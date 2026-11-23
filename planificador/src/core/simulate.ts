import { ALGORITHMS, type Algorithm, type ProcessInput, type SimulationResult, type Snapshot, type Segment } from './types';
import { validateProcesses } from './validation';

interface Job {
  input: ProcessInput;
  order: number;
  remaining: number;
  firstStart: number | null;
  finish: number | null;
}

/** Motor puro: no modifica entradas ni depende de React, DOM o temporizadores. */
export function simulate(processes: readonly ProcessInput[], algorithm: Algorithm): SimulationResult {
  if (!ALGORITHMS.includes(algorithm)) throw new Error('Algoritmo desconocido.');
  const errors = validateProcesses(processes);
  if (errors.length) throw new Error(errors.join('\n'));
  const jobs: Job[] = processes.map((input, order) => ({
    input: { ...input }, order, remaining: input.burst, firstStart: null, finish: null,
  }));
  const ready: Job[] = [];
  const snapshots: Snapshot[] = [];
  const timeline: Segment[] = [];
  const warnings = jobs.filter(j => j.input.burst === 0)
    .map(j => `${j.input.name}: ráfaga 0; termina al llegar y sus métricas de duración son 0.`);
  let running: Job | null = null;
  let previousId: string | null = null;
  let time = 0;
  let completed = 0;
  let busyTime = 0;
  let contextSwitches = 0;
  let events: string[] = [];

  const compare = (a: Job, b: Job): number => {
    const durationA = algorithm === 'SRTF' ? a.remaining : a.input.burst;
    const durationB = algorithm === 'SRTF' ? b.remaining : b.input.burst;
    return durationA - durationB || a.input.arrival - b.input.arrival || a.order - b.order;
  };
  const bestIndex = (): number => {
    if (algorithm === 'FCFS') return 0;
    let best = 0;
    ready.forEach((job, index) => {
      const candidate = ready[best];
      if (candidate && compare(job, candidate) < 0) best = index;
    });
    return best;
  };
  const snapshot = (terminal: boolean): Snapshot => ({
    time, running: running?.input.id ?? null,
    ready: ready.map(j => j.input.id), events: [...events], terminal,
    processes: jobs.map(j => ({
      id: j.input.id, remaining: j.remaining,
      status: j.finish !== null ? 'Terminado' : j === running ? 'En CPU' :
        j.input.arrival <= time ? 'Listo' : 'Pendiente',
    })),
  });

  while (true) {
    // (a) Llegadas en orden original de la tabla. Ráfaga 0 no ocupa CPU ni cola.
    for (const job of jobs) {
      if (job.input.arrival !== time) continue;
      events.push(`Llega ${job.input.name}.`);
      if (job.remaining === 0) {
        job.firstStart = time;
        job.finish = time;
        completed++;
        events.push(`${job.input.name} termina al llegar (ráfaga 0).`);
      } else ready.push(job);
    }
    if (completed === jobs.length) {
      snapshots.push(snapshot(true));
      break;
    }
    // (b) Expropiar solo ante restante estrictamente menor. El expulsado
    // entra al FINAL de la cola, después de las llegadas de este instante.
    if (algorithm === 'SRTF' && running && ready.length) {
      const candidate = ready[bestIndex()];
      if (candidate && candidate.remaining < running.remaining) {
        events.push(`Se expropia ${running.input.name}: ${candidate.input.name} tiene menor restante.`);
        ready.push(running);
        running = null;
      }
    }
    // (c) La elección no ordena ni altera la posición de los otros listos.
    if (!running && ready.length) {
      running = ready.splice(bestIndex(), 1)[0] ?? null;
      if (running) {
        running.firstStart ??= time;
        events.push(`Se despacha ${running.input.name}.`);
      }
    }
    if (!running) events.push('CPU ociosa.');
    snapshots.push(snapshot(false));
    const currentId = running?.input.id ?? null;
    if (previousId !== null && currentId !== null && previousId !== currentId) contextSwitches++;
    previousId = currentId;
    const last = timeline[timeline.length - 1];
    if (last && last.processId === currentId) last.end = time + 1;
    else timeline.push({ start: time, end: time + 1, processId: currentId });
    // (d) Ejecutar exactamente una unidad. El fin pertenece al límite t + 1.
    events = [];
    if (running) {
      busyTime++;
      running.remaining--;
      if (running.remaining === 0) {
        running.finish = time + 1;
        events.push(`Termina ${running.input.name}.`);
        completed++;
        running = null;
      }
    }
    time++;
  }
  const metrics = jobs.map(job => {
    if (job.finish === null || job.firstStart === null) throw new Error('Proceso sin finalizar.');
    const turnaround = job.finish - job.input.arrival;
    return { id: job.input.id, firstStart: job.firstStart, finish: job.finish,
      turnaround, waiting: turnaround - job.input.burst,
      response: job.firstStart - job.input.arrival };
  });
  const mean = (key: 'turnaround' | 'waiting' | 'response'): number =>
    metrics.length ? metrics.reduce((sum, m) => sum + m[key], 0) / metrics.length : 0;
  return {
    algorithm, timeline, snapshots, metrics, warnings, totalTime: time,
    busyTime, idleTime: time - busyTime, utilization: time ? busyTime / time : 0,
    contextSwitches,
    averages: { turnaround: mean('turnaround'), waiting: mean('waiting'), response: mean('response') },
  };
}
