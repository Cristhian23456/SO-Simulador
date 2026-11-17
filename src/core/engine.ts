import { POLICIES, type Candidate, type Policy } from './policies';
import type {
  AlgorithmId,
  GanttSegment,
  ProcessInput,
  ProcessMetrics,
  ProcessState,
  SimEvent,
  SimulationResult,
  SummaryMetrics,
  TickSnapshot,
} from './types';
import { LIMITS, validateProcesses } from './validation';

/**
 * Motor de simulación por ticks (tiempo discreto). Orden de operaciones en cada instante t:
 *   1. Llegadas en t entran a la cola de listos (en el orden de la tabla).
 *      Las ráfagas nulas terminan en el mismo instante sin usar la CPU.
 *   2. Si la política es expropiativa, se compara el proceso en ejecución con el mejor listo.
 *   3. Si la CPU está libre, la política elige al siguiente de la cola de listos.
 *   4. Se registra la fotografía del tick [t, t+1) y se ejecuta una unidad de CPU.
 * Este orden garantiza que un proceso que llega en t compita en la decisión tomada en t.
 */
export function simulate(processes: ProcessInput[], algorithm: AlgorithmId): SimulationResult {
  const errors = validateProcesses(processes);
  if (errors.length) throw new Error(errors.map((e) => e.message).join(' '));
  return run(processes, POLICIES[algorithm]);
}

function run(input: ProcessInput[], policy: Policy): SimulationResult {
  const procs: Candidate[] = input.map((p, order) => ({
    pid: p.pid.trim(),
    arrival: p.arrival,
    burst: p.burst,
    remaining: p.burst,
    priority: p.priority,
    order,
    enqueuedAt: p.arrival,
  }));
  const n = procs.length;
  const firstStart = new Map<string, number>();
  const completion = new Map<string, number>();
  const events: SimEvent[] = [];
  const timeline: TickSnapshot[] = [];
  const warnings: string[] = [];

  let ready: Candidate[] = [];
  let running: Candidate | null = null;
  let dispatches = 0;
  let wasIdle = false;
  const hardStop = LIMITS.maxArrival + n * LIMITS.maxBurst + 1;

  for (let t = 0; ; t++) {
    if (t > hardStop) throw new Error('La simulación excedió el tiempo máximo (posible bucle).');

    // 1. Llegadas
    for (const p of procs) {
      if (p.arrival !== t) continue;
      if (p.burst === 0) {
        firstStart.set(p.pid, t);
        completion.set(p.pid, t);
        events.push({ t, type: 'RAFAGA_NULA', pid: p.pid, detail: `${p.pid} llega con ráfaga 0 y termina sin usar la CPU` });
      } else {
        p.enqueuedAt = t;
        ready.push(p);
        events.push({ t, type: 'LLEGADA', pid: p.pid, detail: `${p.pid} llega y entra a la cola de listos` });
      }
    }
    if (completion.size === n) break;

    // 2. Expropiación
    if (running && policy.preemptive && policy.shouldPreempt && ready.length) {
      const challenger = ready[policy.select(ready)];
      if (policy.shouldPreempt(running, challenger)) {
        events.push({
          t,
          type: 'EXPROPIACION',
          pid: running.pid,
          detail: `${challenger.pid} (restante ${challenger.remaining}) expulsa a ${running.pid} (restante ${running.remaining})`,
        });
        running.enqueuedAt = t;
        ready.push(running);
        running = null;
      }
    }

    // 3. Despacho
    if (!running && ready.length) {
      const idx = policy.select(ready);
      running = ready[idx];
      ready = ready.filter((_, i) => i !== idx);
      dispatches++;
      if (!firstStart.has(running.pid)) firstStart.set(running.pid, t);
      events.push({ t, type: 'DESPACHO', pid: running.pid, detail: `${running.pid} obtiene la CPU (restante ${running.remaining})` });
    }

    // 4. Fotografía y ejecución de un tick
    const states: Record<string, ProcessState> = {};
    const remaining: Record<string, number> = {};
    const readySet = new Set(ready.map((p) => p.pid));
    for (const p of procs) {
      remaining[p.pid] = p.remaining;
      states[p.pid] = completion.has(p.pid)
        ? 'TERMINADO'
        : running?.pid === p.pid
          ? 'EJECUCION'
          : readySet.has(p.pid)
            ? 'LISTO'
            : 'NO_LLEGADO';
    }
    timeline.push({ t, running: running?.pid ?? null, ready: ready.map((p) => p.pid), states, remaining });

    if (running) {
      wasIdle = false;
      running.remaining--;
      if (running.remaining === 0) {
        completion.set(running.pid, t + 1);
        events.push({ t: t + 1, type: 'FIN', pid: running.pid, detail: `${running.pid} termina` });
        running = null;
      }
    } else {
      if (!wasIdle) events.push({ t, type: 'OCIO', pid: null, detail: 'CPU ociosa: no hay procesos listos' });
      wasIdle = true;
    }
    if (completion.size === n) break;
  }

  const gantt = buildGantt(timeline);
  const perProcess: ProcessMetrics[] = procs.map((p) => {
    const c = completion.get(p.pid)!;
    const s = firstStart.get(p.pid)!;
    return {
      pid: p.pid,
      arrival: p.arrival,
      burst: p.burst,
      priority: p.priority,
      firstStart: s,
      completion: c,
      turnaround: c - p.arrival,
      waiting: c - p.arrival - p.burst,
      response: s - p.arrival,
    };
  });

  const zero = procs.filter((p) => p.burst === 0).map((p) => p.pid);
  if (zero.length)
    warnings.push(`Ráfaga nula en ${zero.join(', ')}: terminan al llegar, no aparecen en el Gantt y sus tiempos valen 0.`);

  return {
    algorithm: policy.id,
    processes: input,
    gantt,
    timeline,
    events,
    perProcess,
    summary: summarize(perProcess, timeline, dispatches),
    warnings,
  };
}

/** Agrupa ticks consecutivos con el mismo ocupante en tramos del diagrama de Gantt. */
export function buildGantt(timeline: TickSnapshot[]): GanttSegment[] {
  const out: GanttSegment[] = [];
  for (const tick of timeline) {
    const last = out[out.length - 1];
    if (last && last.pid === tick.running && last.end === tick.t) last.end++;
    else out.push({ pid: tick.running, start: tick.t, end: tick.t + 1 });
  }
  return out;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function summarize(per: ProcessMetrics[], timeline: TickSnapshot[], dispatches: number): SummaryMetrics {
  const makespan = per.reduce((m, p) => Math.max(m, p.completion), 0);
  const busyTime = timeline.filter((t) => t.running !== null).length;
  const idleTime = makespan - busyTime;
  return {
    avgWaiting: avg(per.map((p) => p.waiting)),
    avgTurnaround: avg(per.map((p) => p.turnaround)),
    avgResponse: avg(per.map((p) => p.response)),
    makespan,
    idleTime,
    busyTime,
    cpuUtilization: makespan ? busyTime / makespan : 0,
    throughput: makespan ? per.length / makespan : 0,
    // Cada despacho después del primero implica guardar/cargar contexto.
    contextSwitches: Math.max(0, dispatches - 1),
  };
}
