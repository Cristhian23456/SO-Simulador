import type { AlgorithmId } from './types';

/**
 * Vista mínima de un proceso que necesita una política para decidir.
 * `order` es la posición del proceso en la tabla de entrada (desempate final, determinista).
 */
export interface Candidate {
  pid: string;
  arrival: number;
  burst: number;
  remaining: number;
  priority: number;
  order: number;
  /** Instante en que entró (o reingresó) a la cola de listos. */
  enqueuedAt: number;
}

export interface Policy {
  id: AlgorithmId;
  name: string;
  preemptive: boolean;
  /** Devuelve el índice, dentro de `ready`, del proceso a despachar. `ready` nunca está vacío. */
  select(ready: Candidate[]): number;
  /** Solo políticas expropiativas: ¿debe `challenger` expulsar a `running`? */
  shouldPreempt?(running: Candidate, challenger: Candidate): boolean;
}

function argmin(ready: Candidate[], cmp: (a: Candidate, b: Candidate) => number): number {
  let best = 0;
  for (let i = 1; i < ready.length; i++) if (cmp(ready[i], ready[best]) < 0) best = i;
  return best;
}

/** Desempate común: llegada más temprana y luego orden de la tabla. */
const byArrivalThenOrder = (a: Candidate, b: Candidate) => a.arrival - b.arrival || a.order - b.order;

/**
 * FIFO / FCFS: atiende en el orden en que los procesos entraron a la cola de listos.
 * Desempate (llegadas simultáneas): orden de la tabla de entrada.
 */
export const FIFO: Policy = {
  id: 'FIFO',
  name: 'FIFO (FCFS)',
  preemptive: false,
  select: (ready) => argmin(ready, (a, b) => a.enqueuedAt - b.enqueuedAt || a.order - b.order),
};

/**
 * SJF no expropiativo: elige la menor ráfaga entre los listos; una vez despachado, termina.
 * Desempate: llegada más temprana (equivale a FCFS entre iguales) y luego orden de la tabla.
 */
export const SJF: Policy = {
  id: 'SJF',
  name: 'SJF (no expropiativo)',
  preemptive: false,
  select: (ready) => argmin(ready, (a, b) => a.burst - b.burst || byArrivalThenOrder(a, b)),
};

/**
 * SRTF (SJF expropiativo): elige el menor tiempo restante. Un proceso que llega expulsa al
 * que se ejecuta solo si su restante es ESTRICTAMENTE menor (en empate no se expropia,
 * para evitar cambios de contexto inútiles).
 */
export const SRTF: Policy = {
  id: 'SRTF',
  name: 'SJF expropiativo (SRTF)',
  preemptive: true,
  select: (ready) => argmin(ready, (a, b) => a.remaining - b.remaining || byArrivalThenOrder(a, b)),
  shouldPreempt: (running, challenger) => challenger.remaining < running.remaining,
};

export const POLICIES: Record<AlgorithmId, Policy> = { FIFO, SJF, SRTF };
