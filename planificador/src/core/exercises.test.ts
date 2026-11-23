import { describe, expect, it } from 'vitest';
import { EXERCISES } from './exercises';
import { simulate } from './simulate';

// Oráculos calculados independientemente del motor.
// Filas: proceso, inicio, fin inclusivo, espera, sistema (espera + ráfaga),
// finalización (fin + 1), sistema (finalización − llegada).
const EXPECTED = [
  {
    name: 'FIFO 1',
    gantt: [['B', 0, 6], ['C', 6, 10], ['E', 10, 11], ['D', 11, 17], ['A', 17, 20]],
    rows: [
      ['A', 17, 19, 7, 10, 20, 10], ['B', 0, 5, 0, 6, 6, 6],
      ['C', 6, 9, 4, 8, 10, 8], ['D', 11, 16, 3, 9, 17, 9], ['E', 10, 10, 3, 4, 11, 4],
    ],
    waiting: 3.4, turnaround: 7.4,
  },
  {
    name: 'FIFO 2',
    gantt: [['D', 0, 7], ['B', 7, 11], ['C', 11, 17], ['E', 17, 18], ['A', 18, 21]],
    rows: [
      ['A', 18, 20, 8, 11, 21, 11], ['B', 7, 10, 5, 9, 11, 9],
      ['C', 11, 16, 5, 11, 17, 11], ['D', 0, 6, 0, 7, 7, 7], ['E', 17, 17, 10, 11, 18, 11],
    ],
    waiting: 5.6, turnaround: 9.8,
  },
  {
    name: 'FIFO 3',
    gantt: [['B', 0, 6], ['C', 6, 10], ['E', 10, 11], ['A', 11, 14], ['D', 14, 20]],
    rows: [
      ['A', 11, 13, 6, 9, 14, 9], ['B', 0, 5, 0, 6, 6, 6],
      ['C', 6, 9, 4, 8, 10, 8], ['D', 14, 19, 5, 11, 20, 11], ['E', 10, 10, 6, 7, 11, 7],
    ],
    waiting: 4.2, turnaround: 8.2,
  },
  {
    name: 'SJF 1',
    gantt: [['D', 0, 4], ['C', 4, 10], ['E', 10, 11], ['A', 11, 15], ['B', 15, 24]],
    rows: [
      ['A', 11, 14, 2, 6, 15, 6], ['B', 15, 23, 15, 24, 24, 24],
      ['C', 4, 9, 2, 8, 10, 8], ['D', 0, 3, 0, 4, 4, 4], ['E', 10, 10, 4, 5, 11, 5],
    ],
    waiting: 4.6, turnaround: 9.4,
  },
  {
    name: 'SJF 2',
    gantt: [['B', 0, 9], ['E', 9, 10], ['D', 10, 14], ['A', 14, 18], ['C', 18, 24]],
    rows: [
      ['A', 14, 17, 7, 11, 18, 11], ['B', 0, 8, 0, 9, 9, 9],
      ['C', 18, 23, 16, 22, 24, 22], ['D', 10, 13, 9, 13, 14, 13], ['E', 9, 9, 1, 2, 10, 2],
    ],
    waiting: 6.6, turnaround: 11.4,
  },
  {
    name: 'SJF 3',
    gantt: [['E', 0, 5], ['A', 5, 9], ['D', 9, 13], ['B', 13, 21], ['C', 21, 31]],
    rows: [
      ['A', 5, 8, 2, 6, 9, 6], ['B', 13, 20, 6, 14, 21, 14],
      ['C', 21, 30, 21, 31, 31, 31], ['D', 9, 12, 0, 4, 13, 4], ['E', 0, 4, 0, 5, 5, 5],
    ],
    waiting: 5.8, turnaround: 12,
  },
];

describe('Los seis ejercicios solicitados', () => {
  it.each(EXPECTED)('$name: Gantt, seis columnas y promedios exactos', expected => {
    const exercise = EXERCISES.find(e => e.name === expected.name);
    if (!exercise) throw new Error(`Falta el ejercicio ${expected.name}`);
    const result = simulate(exercise.processes, exercise.algorithm);
    expect(result.timeline.map(s => [s.processId, s.start, s.end])).toEqual(expected.gantt);
    const rows = result.metrics.map(m => {
      const process = exercise.processes.find(p => p.id === m.id);
      if (!process) throw new Error('Proceso desconocido');
      // El motor guarda el límite exclusivo, no la última unidad ocupada.
      const fin = m.finish - 1;
      const finalizacion = fin + 1;
      expect(m.turnaround).toBe(m.waiting + process.burst);
      expect(m.turnaround).toBe(finalizacion - process.arrival);
      return [m.id, m.firstStart, fin, m.waiting, m.waiting + process.burst,
        finalizacion, finalizacion - process.arrival];
    });
    expect(rows).toEqual(expected.rows);
    expect(result.averages.waiting).toBeCloseTo(expected.waiting, 10);
    expect(result.averages.turnaround).toBeCloseTo(expected.turnaround, 10);
    expect(result.idleTime).toBe(0);
    expect(result.utilization).toBe(1);
    expect(result.contextSwitches).toBe(4);
  });
});
