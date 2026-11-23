import { describe, expect, it } from 'vitest';
import { simulate } from '../engine';
import type { ProcessInput } from '../types';

const load: ProcessInput[] = [
  { id: 1, name: 'P1', arrival: 0, burst: 8 },
  { id: 2, name: 'P2', arrival: 1, burst: 4 },
  { id: 3, name: 'P3', arrival: 2, burst: 9 },
  { id: 4, name: 'P4', arrival: 3, burst: 5 },
];

describe('SJF expropiativo (SRTF)', () => {
  it('expropia cuando llega un proceso con menor tiempo restante', () => {
    const r = simulate(load, 'SRTF');
    expect(r.gantt.map((b) => [b.label, b.start, b.end])).toEqual([
      ['P1', 0, 1], // P2 llega en t=1 con 4 < 7 → expropia
      ['P2', 1, 5],
      ['P4', 5, 10], // en t=5: P4(5) < P1(7) < P3(9)
      ['P1', 10, 17], // en t=10: P1(7) < P3(9)
      ['P3', 17, 26],
    ]);
    expect(r.contextSwitches).toBe(4); // P1→P2→P4→P1→P3
    expect(r.totalTime).toBe(26);
  });

  it('métricas del ejemplo clásico', () => {
    const r = simulate(load, 'SRTF');
    const m = (id: number) => r.processes.find((p) => p.id === id)!;
    expect(m(1)).toMatchObject({ firstStart: 0, finish: 17, turnaround: 17, wait: 9, response: 0 });
    expect(m(2)).toMatchObject({ firstStart: 1, finish: 5, turnaround: 4, wait: 0, response: 0 });
    expect(m(3)).toMatchObject({ firstStart: 17, finish: 26, turnaround: 24, wait: 15, response: 15 });
    expect(m(4)).toMatchObject({ firstStart: 5, finish: 10, turnaround: 7, wait: 2, response: 2 });
    expect(r.averages.wait).toBeCloseTo(6.5);
    expect(r.averages.turnaround).toBeCloseTo(13);
  });

  it('el proceso expropiado vuelve a la cola con su tiempo restante', () => {
    const r = simulate(load, 'SRTF');
    const step1 = r.steps[1];
    expect(step1.running?.id).toBe(2);
    const backInQueue = step1.readyQueue.find((p) => p.id === 1);
    expect(backInQueue).toBeDefined();
    expect(backInQueue!.remaining).toBe(7);
  });

  it('con tiempo restante igual, NO expropia (empate)', () => {
    const r = simulate(
      [
        { id: 1, name: 'P1', arrival: 0, burst: 5 },
        { id: 2, name: 'P2', arrival: 2, burst: 3 },
      ],
      'SRTF',
    );
    // En t=2 ambos tienen 3 restantes → P1 conserva la CPU.
    expect(r.steps[2].running?.id).toBe(1);
    expect(r.gantt.map((b) => b.label)).toEqual(['P1', 'P2']);
    expect(r.contextSwitches).toBe(1);
  });

  it('respeta el desempate: menor restante → menor llegada → orden de tabla', () => {
    // En t=1, A tiene 3 restantes y B llega con 3: no expropia (empate de restante,
    // y la llegada menor de A gana de todos modos).
    const r = simulate(
      [
        { id: 1, name: 'A', arrival: 0, burst: 4 },
        { id: 2, name: 'B', arrival: 1, burst: 3 },
        { id: 3, name: 'C', arrival: 1, burst: 3 },
      ],
      'SRTF',
    );
    // A termina en t=4; luego B y C empatan (3, llegada 1) → orden de tabla: B, C.
    expect(r.gantt.map((b) => b.label)).toEqual(['A', 'B', 'C']);
  });
});
