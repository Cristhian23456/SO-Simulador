import { describe, expect, it } from 'vitest';
import { simulate } from '../engine';
import type { ProcessInput } from '../types';

const load: ProcessInput[] = [
  { id: 1, name: 'P1', arrival: 0, burst: 7 },
  { id: 2, name: 'P2', arrival: 2, burst: 4 },
  { id: 3, name: 'P3', arrival: 4, burst: 1 },
  { id: 4, name: 'P4', arrival: 5, burst: 4 },
];

describe('SJF no expropiativo', () => {
  it('elige la menor ráfaga; empate de ráfaga → menor llegada', () => {
    const r = simulate(load, 'SJF');
    expect(r.gantt.map((b) => [b.label, b.start, b.end])).toEqual([
      ['P1', 0, 7], // en t=0 solo P1 ha llegado
      ['P3', 7, 8], // ráfaga 1
      ['P2', 8, 12], // empate 4 con P4 → menor llegada (2 < 5)
      ['P4', 12, 16],
    ]);
    expect(r.contextSwitches).toBe(3);
  });

  it('mejora los promedios respecto a FCFS en esta carga', () => {
    const r = simulate(load, 'SJF');
    expect(r.averages.wait).toBeCloseTo(4); // FCFS da 4.75
    expect(r.averages.turnaround).toBeCloseTo(8);
    const m = (id: number) => r.processes.find((p) => p.id === id)!;
    expect(m(3)).toMatchObject({ firstStart: 7, finish: 8, turnaround: 4, wait: 3, response: 3 });
  });

  it('con ráfaga y llegada iguales respeta el orden de la tabla', () => {
    const r = simulate(
      [
        { id: 1, name: 'P1', arrival: 0, burst: 3 },
        { id: 2, name: 'P2', arrival: 0, burst: 3 },
        { id: 3, name: 'P3', arrival: 0, burst: 2 },
      ],
      'SJF',
    );
    expect(r.gantt.map((b) => b.label)).toEqual(['P3', 'P1', 'P2']);
    expect(r.averages.wait).toBeCloseTo(7 / 3);
  });

  it('NO expropia: un proceso en CPU no se interrumpe por uno más corto', () => {
    const r = simulate(
      [
        { id: 1, name: 'P1', arrival: 0, burst: 5 },
        { id: 2, name: 'P2', arrival: 1, burst: 1 },
      ],
      'SJF',
    );
    expect(r.gantt.map((b) => b.label)).toEqual(['P1', 'P2']);
    expect(r.contextSwitches).toBe(1);
    expect(r.steps[1].running?.id).toBe(1); // en t=1 sigue P1 a pesar de P2
  });

  it('ráfaga 0: termina al llegar, no aparece en el Gantt, tiempos 0 y advertencia', () => {
    const r = simulate(
      [
        { id: 1, name: 'P0', arrival: 0, burst: 0 },
        { id: 2, name: 'P1', arrival: 1, burst: 3 },
      ],
      'SJF',
    );
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toContain('ráfaga 0');
    expect(r.gantt.every((b) => b.processId !== 1)).toBe(true);
    expect(r.gantt[0]).toMatchObject({ processId: null, start: 0, end: 1 });
    expect(r.processes.find((p) => p.id === 1)).toMatchObject({
      firstStart: 0, finish: 0, turnaround: 0, wait: 0, response: 0,
    });
    const p1 = r.processes.find((p) => p.id === 2)!;
    expect(p1.firstStart).toBe(1);
    expect(p1.finish).toBe(4);
    expect(r.idleTime).toBe(1);
    expect(r.utilization).toBeCloseTo(0.75);
  });
});
