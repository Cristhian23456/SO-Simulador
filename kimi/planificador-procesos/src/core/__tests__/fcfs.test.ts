import { describe, expect, it } from 'vitest';
import { simulate } from '../engine';
import type { ProcessInput } from '../types';

/** Carga clásica de ejemplo (Silberschatz). */
const load: ProcessInput[] = [
  { id: 1, name: 'P1', arrival: 0, burst: 7 },
  { id: 2, name: 'P2', arrival: 2, burst: 4 },
  { id: 3, name: 'P3', arrival: 4, burst: 1 },
  { id: 4, name: 'P4', arrival: 5, burst: 4 },
];

describe('FCFS (FIFO)', () => {
  it('despacha en orden de llegada a la cola', () => {
    const r = simulate(load, 'FCFS');
    expect(r.gantt.map((b) => [b.label, b.start, b.end])).toEqual([
      ['P1', 0, 7],
      ['P2', 7, 11],
      ['P3', 11, 12],
      ['P4', 12, 16],
    ]);
    expect(r.totalTime).toBe(16);
    expect(r.busyTime).toBe(16);
    expect(r.idleTime).toBe(0);
    expect(r.utilization).toBe(1);
  });

  it('calcula las métricas por proceso y los promedios', () => {
    const r = simulate(load, 'FCFS');
    const m = (id: number) => r.processes.find((p) => p.id === id)!;
    expect(m(1)).toMatchObject({ firstStart: 0, finish: 7, turnaround: 7, wait: 0, response: 0 });
    expect(m(2)).toMatchObject({ firstStart: 7, finish: 11, turnaround: 9, wait: 5, response: 5 });
    expect(m(3)).toMatchObject({ firstStart: 11, finish: 12, turnaround: 8, wait: 7, response: 7 });
    expect(m(4)).toMatchObject({ firstStart: 12, finish: 16, turnaround: 11, wait: 7, response: 7 });
    expect(r.averages.turnaround).toBeCloseTo(8.75);
    expect(r.averages.wait).toBeCloseTo(4.75);
    expect(r.averages.response).toBeCloseTo(4.75);
  });

  it('cuenta un cambio de contexto por cada cambio de proceso', () => {
    const r = simulate(load, 'FCFS');
    expect(r.contextSwitches).toBe(3); // P1→P2→P3→P4
  });

  it('si varios procesos llegan en el mismo instante, respeta el orden de la tabla', () => {
    const r = simulate(
      [
        { id: 1, name: 'P1', arrival: 2, burst: 2 },
        { id: 2, name: 'P2', arrival: 2, burst: 1 },
      ],
      'FCFS',
    );
    expect(r.gantt.map((b) => b.label)).toEqual(['Ociosa', 'P1', 'P2']);
    expect(r.steps[2].running?.id).toBe(1);
    expect(r.steps[2].readyQueue.map((p) => p.id)).toEqual([2]);
  });

  it('muestra la CPU ociosa cuando no hay procesos listos', () => {
    const r = simulate([{ id: 1, name: 'P1', arrival: 3, burst: 2 }], 'FCFS');
    expect(r.steps[0].running).toBeNull();
    expect(r.steps[1].running).toBeNull();
    expect(r.gantt[0]).toMatchObject({ processId: null, start: 0, end: 3, label: 'Ociosa' });
    expect(r.idleTime).toBe(3);
    expect(r.totalTime).toBe(5);
    expect(r.utilization).toBeCloseTo(2 / 5);
  });

  it('no cuenta cambio de contexto al despachar desde ociosa al inicio', () => {
    const r = simulate([{ id: 1, name: 'P1', arrival: 0, burst: 3 }], 'FCFS');
    expect(r.contextSwitches).toBe(0);
  });
});
