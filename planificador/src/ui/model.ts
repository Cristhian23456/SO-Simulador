import type { Algorithm, ProcessInput } from '../core/types';

export const LABELS: Record<Algorithm, string> = {
  FCFS: 'FIFO · FCFS', SJF: 'SJF · No expropiativo', SRTF: 'SRTF · Expropiativo',
};
export const DESCRIPTIONS: Record<Algorithm, string> = {
  FCFS: 'El primero en entrar a la cola ejecuta hasta terminar.',
  SJF: 'Cuando la CPU se libera, elige la menor ráfaga y ejecuta hasta terminar.',
  SRTF: 'Elige el menor tiempo restante. Solo expropia si otro proceso tiene un restante estrictamente menor.',
};
export const COLORS = ['#2563eb', '#0e817c', '#a34bbb', '#c15a15', '#b33958', '#5264aa'];
export const DEMO: ProcessInput[] = [
  { id: 'p1', name: 'P1', arrival: 1, burst: 7, priority: 2 },
  { id: 'p2', name: 'P2', arrival: 2, burst: 4, priority: 1 },
  { id: 'p3', name: 'P3', arrival: 4, burst: 1, priority: 3 },
  { id: 'p4', name: 'P4', arrival: 5, burst: 3, priority: 2 },
];
export const format = (value: number): string => value.toLocaleString('es', { maximumFractionDigits: 2 });
