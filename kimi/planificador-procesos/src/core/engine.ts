import type {
  AlgorithmId,
  GanttBlock,
  ProcessInput,
  ProcessMetrics,
  ProcessSnapshot,
  ProcessStatus,
  ReadyProcess,
  SimulationResult,
  SimulationStep,
} from './types';

interface InternalProcess extends ProcessInput {
  remaining: number;
  firstStart: number | null;
  finish: number | null;
}

/** Clave de prioridad compartida por SJF y SRTF:
 *  menor tiempo restante → menor llegada → orden de la tabla.
 *  En empate absoluto devuelve false: con claves iguales NUNCA se expropia. */
function lessKey(a: readonly number[], b: readonly number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
}

/** Red eléctrica: los datos validados garantizan terminación, pero evitamos un bucle infinito. */
const MAX_TIME = 100_000;

/**
 * Motor de simulación. Puro TypeScript, sin dependencias (ni de React).
 *
 * Orden exacto de cada instante t:
 *  (a) las llegadas en t entran a la cola de listos;
 *  (b) evaluar expropiación (solo SRTF);
 *  (c) si la CPU está libre, despachar;
 *  (d) ejecutar una unidad de tiempo.
 */
export function simulate(processes: ProcessInput[], algorithm: AlgorithmId): SimulationResult {
  const warnings: string[] = [];
  for (const p of processes) {
    if (p.burst === 0) {
      warnings.push(
        `"${p.name}" tiene ráfaga 0: termina al llegar, no aparece en el Gantt y sus tiempos valen 0.`,
      );
    }
  }

  const table: InternalProcess[] = processes
    .filter((p) => p.burst > 0)
    .map((p) => ({ ...p, remaining: p.burst, firstStart: null, finish: null }));

  const queue: InternalProcess[] = [];
  const steps: SimulationStep[] = [];

  let running: InternalProcess | null = null;
  let lastProcessId: number | null = null;
  let busyTime = 0;
  let contextSwitches = 0;
  let t = 0;

  const key = (p: InternalProcess): number[] => [p.remaining, p.arrival, p.id];

  const selectIndex = (): number => {
    // FIFO: la cabeza de la cola (los procesos entran en orden de llegada,
    // y los que llegan en el mismo instante entran en orden de la tabla).
    if (algorithm === 'FCFS') return 0;
    // SJF / SRTF: se recorre la cola y se elige la mejor clave.
    let best = 0;
    for (let i = 1; i < queue.length; i++) {
      if (lessKey(key(queue[i]), key(queue[best]))) best = i;
    }
    return best;
  };

  while (table.some((p) => p.finish === null) && t < MAX_TIME) {
    // (a) Llegadas en t → entran a la cola de listos (iterar la tabla mantiene
    //     el orden de la tabla cuando varios llegan al mismo instante).
    for (const p of table) {
      if (p.arrival === t && p.finish === null) queue.push(p);
    }

    // (b) Expropiación: solo SRTF y solo si la clave del candidato es
    //     ESTRICTAMENTE menor (en empate NO se expropia).
    if (algorithm === 'SRTF' && running !== null && queue.length > 0) {
      let best = 0;
      for (let i = 1; i < queue.length; i++) {
        if (lessKey(key(queue[i]), key(queue[best]))) best = i;
      }
      if (lessKey(key(queue[best]), key(running))) {
        // El proceso expropiado vuelve a la cola (llegó a la cola en este instante).
        queue.push(running);
        running = null;
      }
    }

    // (c) Despacho si la CPU está libre.
    if (running === null && queue.length > 0) {
      const next = queue.splice(selectIndex(), 1)[0];
      if (next.firstStart === null) next.firstStart = t;
      // Cambio de contexto = la CPU pasa de un proceso A OTRO distinto.
      if (lastProcessId !== null && lastProcessId !== next.id) contextSwitches++;
      lastProcessId = next.id;
      running = next;
    }

    // (d) Ejecutar una unidad.
    const executed = running;
    if (running !== null) {
      busyTime++;
      running.remaining -= 1;
      if (running.remaining === 0) {
        running.finish = t + 1;
        running = null;
      }
    }

    // Snapshot del sistema al terminar el instante t.
    const readyQueue: ReadyProcess[] = queue.map((p) => ({
      id: p.id,
      name: p.name,
      remaining: p.remaining,
    }));

    const snapshots: ProcessSnapshot[] = processes.map((p) => {
      if (p.burst === 0) {
        return { id: p.id, name: p.name, arrival: p.arrival, burst: 0, remaining: 0, status: 'terminado' };
      }
      const s = table.find((x) => x.id === p.id) as InternalProcess;
      const status: ProcessStatus =
        s.finish !== null
          ? 'terminado'
          : executed !== null && executed.id === s.id
            ? 'ejecutando'
            : queue.includes(s)
              ? 'listo'
              : 'no_llega';
      return { id: s.id, name: s.name, arrival: s.arrival, burst: s.burst, remaining: s.remaining, status };
    });

    steps.push({
      time: t,
      running:
        executed !== null
          ? { id: executed.id, name: executed.name, remaining: executed.remaining }
          : null,
      readyQueue,
      processes: snapshots,
    });

    t++;
  }

  // ---- Diagrama de Gantt: se compactan las unidades consecutivas iguales ----
  const gantt: GanttBlock[] = [];
  for (const step of steps) {
    const pid = step.running !== null ? step.running.id : null;
    const last = gantt[gantt.length - 1];
    if (last !== undefined && last.processId === pid) {
      last.end = step.time + 1;
    } else {
      gantt.push({
        start: step.time,
        end: step.time + 1,
        processId: pid,
        label: pid === null ? 'Ociosa' : (step.running as ReadyProcess).name,
      });
    }
  }

  // ---- Métricas por proceso (los de ráfaga 0 tienen tiempos 0) ----
  const metrics: ProcessMetrics[] = processes.map((p) => {
    if (p.burst === 0) {
      return {
        id: p.id, name: p.name, arrival: p.arrival, burst: 0,
        firstStart: 0, finish: 0, turnaround: 0, wait: 0, response: 0,
      };
    }
    const s = table.find((x) => x.id === p.id) as InternalProcess;
    const finish = s.finish as number;
    const turnaround = finish - p.arrival;
    return {
      id: p.id,
      name: p.name,
      arrival: p.arrival,
      burst: p.burst,
      firstStart: s.firstStart as number,
      finish,
      turnaround,
      wait: turnaround - p.burst,
      response: (s.firstStart as number) - p.arrival,
    };
  });

  const totalTime = t;
  const idleTime = totalTime - busyTime;
  const utilization = totalTime === 0 ? 0 : busyTime / totalTime;
  const avg = (xs: number[]): number =>
    xs.length === 0 ? 0 : xs.reduce((acc, x) => acc + x, 0) / xs.length;

  return {
    algorithm,
    steps,
    gantt,
    processes: metrics,
    averages: {
      turnaround: avg(metrics.map((m) => m.turnaround)),
      wait: avg(metrics.map((m) => m.wait)),
      response: avg(metrics.map((m) => m.response)),
    },
    busyTime,
    idleTime,
    totalTime,
    utilization,
    contextSwitches,
    warnings,
  };
}
