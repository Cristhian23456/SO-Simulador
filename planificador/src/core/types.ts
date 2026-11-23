export const ALGORITHMS = ['FCFS', 'SJF', 'SRTF'] as const;
export type Algorithm = (typeof ALGORITHMS)[number];

export interface ProcessInput {
  id: string;
  name: string;
  arrival: number;
  burst: number;
  priority: number;
}

export type ProcessStatus = 'Pendiente' | 'Listo' | 'En CPU' | 'Terminado';

export interface ProcessState {
  id: string;
  remaining: number;
  status: ProcessStatus;
}

/** Estado después de despachar y antes de ejecutar [time, time + 1).
 * El último snapshot es terminal: no ejecuta ninguna unidad.
 */
export interface Snapshot {
  time: number;
  running: string | null;
  ready: string[];
  processes: ProcessState[];
  events: string[];
  terminal: boolean;
}

export interface Segment {
  start: number;
  end: number;
  processId: string | null;
}

export interface ProcessMetrics {
  id: string;
  firstStart: number;
  finish: number;
  turnaround: number;
  waiting: number;
  response: number;
}

export interface SimulationResult {
  algorithm: Algorithm;
  timeline: Segment[];
  snapshots: Snapshot[];
  metrics: ProcessMetrics[];
  averages: { turnaround: number; waiting: number; response: number };
  totalTime: number;
  busyTime: number;
  idleTime: number;
  utilization: number;
  contextSwitches: number;
  warnings: string[];
}
