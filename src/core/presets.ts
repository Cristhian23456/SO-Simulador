import type { ProcessInput } from './types';

const p = (pid: string, arrival: number, burst: number, priority = 1): ProcessInput => ({ pid, arrival, burst, priority });

/** Escenarios de referencia (Silberschatz et al., 2018, cap. 5) y casos límite del proyecto. */
export const PRESETS: { id: string; name: string; note: string; processes: ProcessInput[] }[] = [
  {
    id: 'convoy',
    name: 'Efecto convoy (Silberschatz)',
    note: 'Todos llegan en 0. FIFO: espera media 17; SJF: 3.',
    processes: [p('P1', 0, 24), p('P2', 0, 3), p('P3', 0, 3)],
  },
  {
    id: 'sjf-libro',
    name: 'SJF del libro',
    note: 'Silberschatz: SJF da espera media 7.',
    processes: [p('P1', 0, 6), p('P2', 0, 8), p('P3', 0, 7), p('P4', 0, 3)],
  },
  {
    id: 'srtf-libro',
    name: 'SRTF del libro (llegadas escalonadas)',
    note: 'Silberschatz: SRTF da espera media 6.5; SJF no expropiativo 7.75.',
    processes: [p('P1', 0, 8), p('P2', 1, 4), p('P3', 2, 9), p('P4', 3, 5)],
  },
  {
    id: 'ocio',
    name: 'CPU ociosa',
    note: 'Huecos sin procesos listos: 0–2 y 5–10.',
    processes: [p('P1', 2, 3), p('P2', 10, 2)],
  },
  {
    id: 'empates',
    name: 'Empates y llegadas simultáneas',
    note: 'Misma ráfaga y misma llegada: decide la llegada y luego el orden de la tabla.',
    processes: [p('P1', 0, 4), p('P2', 1, 3), p('P3', 1, 3), p('P4', 2, 3)],
  },
  {
    id: 'nula',
    name: 'Ráfaga nula',
    note: 'P2 tiene ráfaga 0: termina al llegar sin usar la CPU.',
    processes: [p('P1', 0, 3), p('P2', 1, 0), p('P3', 1, 2)],
  },
];
