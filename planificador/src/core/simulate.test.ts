import { describe, expect, it } from 'vitest';
import { simulate } from './simulate';
import { ALGORITHMS, type Algorithm, type ProcessInput } from './types';
import { validateProcesses } from './validation';

const p = (name: string, arrival: number, burst: number, priority = 0): ProcessInput =>
  ({ id: name, name, arrival, burst, priority });
const sequence = (inputs: ProcessInput[], algorithm: Algorithm) =>
  simulate(inputs, algorithm).timeline.map(s => [s.processId, s.start, s.end]);

describe('FCFS', () => {
  it('respeta orden de llegada y orden de tabla en llegadas simultáneas', () => {
    expect(sequence([p('C', 2, 1), p('B', 0, 3), p('A', 0, 1)], 'FCFS'))
      .toEqual([['B', 0, 3], ['A', 3, 4], ['C', 4, 5]]);
  });
  it('no expropia al llegar una ráfaga más corta', () => {
    expect(sequence([p('A', 0, 5), p('B', 1, 1)], 'FCFS'))
      .toEqual([['A', 0, 5], ['B', 5, 6]]);
  });
  it('calcula exactamente todas las métricas y sus promedios', () => {
    const r = simulate([p('A', 0, 3), p('B', 1, 2), p('C', 1, 1)], 'FCFS');
    expect(r.metrics).toEqual([
      { id: 'A', firstStart: 0, finish: 3, turnaround: 3, waiting: 0, response: 0 },
      { id: 'B', firstStart: 3, finish: 5, turnaround: 4, waiting: 2, response: 2 },
      { id: 'C', firstStart: 5, finish: 6, turnaround: 5, waiting: 4, response: 4 },
    ]);
    expect(r.averages).toEqual({ turnaround: 4, waiting: 2, response: 2 });
    expect(r.contextSwitches).toBe(2);
  });
});

describe('SJF no expropiativo', () => {
  it('elige menor ráfaga entre los disponibles, sin anticipar llegadas', () => {
    expect(sequence([p('A', 0, 5), p('B', 1, 2), p('C', 2, 1)], 'SJF'))
      .toEqual([['A', 0, 5], ['C', 5, 6], ['B', 6, 8]]);
  });
  it('desempata por llegada y luego posición en tabla', () => {
    expect(sequence([p('X', 0, 4), p('C', 2, 2), p('B', 1, 2), p('A', 1, 2)], 'SJF'))
      .toEqual([['X', 0, 4], ['B', 4, 6], ['A', 6, 8], ['C', 8, 10]]);
  });
  it('incorpora las llegadas antes del despacho en el mismo instante del fin', () => {
    expect(sequence([p('A', 0, 2), p('B', 1, 5), p('C', 2, 1)], 'SJF'))
      .toEqual([['A', 0, 2], ['C', 2, 3], ['B', 3, 8]]);
  });
  it('mantiene la cola en orden de entrada aunque elija por ráfaga', () => {
    const r = simulate([p('A', 0, 4), p('B', 1, 9), p('C', 1, 2), p('D', 1, 5)], 'SJF');
    expect(r.snapshots[1]?.ready).toEqual(['B', 'C', 'D']);
    expect(r.snapshots[4]?.running).toBe('C');
    expect(r.snapshots[4]?.ready).toEqual(['B', 'D']);
  });
});

describe('SRTF', () => {
  it('expropia con restante menor y reanuda con métricas correctas', () => {
    const input = [p('A', 0, 8), p('B', 1, 4), p('C', 2, 2)];
    const r = simulate(input, 'SRTF');
    expect(sequence(input, 'SRTF')).toEqual([
      ['A', 0, 1], ['B', 1, 2], ['C', 2, 4], ['B', 4, 7], ['A', 7, 14],
    ]);
    expect(r.metrics).toEqual([
      { id: 'A', firstStart: 0, finish: 14, turnaround: 14, waiting: 6, response: 0 },
      { id: 'B', firstStart: 1, finish: 7, turnaround: 6, waiting: 2, response: 0 },
      { id: 'C', firstStart: 2, finish: 4, turnaround: 2, waiting: 0, response: 0 },
    ]);
    expect(r.contextSwitches).toBe(4);
  });
  it('NO expropia en empate de restante, incluso si el otro aparece antes en tabla', () => {
    expect(sequence([p('B', 1, 3), p('A', 0, 4)], 'SRTF'))
      .toEqual([['A', 0, 4], ['B', 4, 7]]);
  });
  it('compara el restante del proceso en CPU, no su ráfaga original', () => {
    expect(sequence([p('A', 0, 4), p('B', 3, 2)], 'SRTF'))
      .toEqual([['A', 0, 4], ['B', 4, 6]]);
  });
  it('desempata un despacho por llegada y orden de tabla', () => {
    expect(sequence([p('C', 1, 2), p('B', 1, 2), p('A', 0, 3)], 'SRTF'))
      .toEqual([['A', 0, 3], ['C', 3, 5], ['B', 5, 7]]);
    expect(sequence([p('B', 1, 2), p('A', 0, 3), p('X', 0, 1)], 'SRTF'))
      .toEqual([['X', 0, 1], ['B', 1, 3], ['A', 3, 6]]);
    expect(sequence([p('B', 1, 3), p('A', 0, 3), p('X', 0, 2)], 'SRTF'))
      .toEqual([['X', 0, 2], ['A', 2, 5], ['B', 5, 8]]);
  });
  it('encola llegadas antes del expropiado y excluye al proceso despachado', () => {
    const r = simulate([p('A', 0, 8), p('B', 1, 4), p('C', 1, 2)], 'SRTF');
    expect(r.snapshots[1]?.running).toBe('C');
    expect(r.snapshots[1]?.ready).toEqual(['B', 'A']);
    expect(r.snapshots[1]?.processes.map(j => j.status)).toEqual(['Listo', 'Listo', 'En CPU']);
  });
});

describe.each(ALGORITHMS)('%s: reglas comunes', algorithm => {
  it('representa ociosidad inicial e intermedia desde t = 0', () => {
    const r = simulate([p('A', 2, 1), p('B', 5, 2)], algorithm);
    expect(r.timeline).toEqual([
      { processId: null, start: 0, end: 2 }, { processId: 'A', start: 2, end: 3 },
      { processId: null, start: 3, end: 5 }, { processId: 'B', start: 5, end: 7 },
    ]);
    expect(r.idleTime).toBe(4);
    expect(r.busyTime).toBe(3);
    expect(r.utilization).toBe(3 / 7);
    expect(r.contextSwitches).toBe(0);
  });
  it('termina ráfaga 0 al llegar aun con la CPU ocupada', () => {
    const r = simulate([p('A', 0, 5), p('Z', 2, 0)], algorithm);
    expect(r.metrics[1]).toEqual({ id: 'Z', firstStart: 2, finish: 2, turnaround: 0, waiting: 0, response: 0 });
    expect(r.timeline).toEqual([{ processId: 'A', start: 0, end: 5 }]);
    expect(r.snapshots[2]?.processes[1]?.status).toBe('Terminado');
    expect(r.snapshots[2]?.ready).toEqual([]);
    expect(r.warnings).toHaveLength(1);
    expect(r.averages.turnaround).toBe(2.5);
  });
  it('espera una llegada futura de ráfaga 0 sin añadir una unidad extra', () => {
    const r = simulate([p('A', 0, 1), p('Z', 4, 0)], algorithm);
    expect(r.totalTime).toBe(4);
    expect(r.idleTime).toBe(3);
    expect(r.snapshots.at(-1)?.terminal).toBe(true);
    expect(r.snapshots.at(-1)?.time).toBe(4);
  });
  it('resuelve carga vacía y solo ráfagas cero en t = 0 sin NaN', () => {
    for (const input of [[], [p('Z', 0, 0), p('Y', 0, 0)]]) {
      const r = simulate(input, algorithm);
      expect(r.totalTime).toBe(0);
      expect(r.timeline).toEqual([]);
      expect(r.utilization).toBe(0);
      expect(r.averages).toEqual({ turnaround: 0, waiting: 0, response: 0 });
      expect(r.snapshots).toHaveLength(1);
      expect(r.snapshots[0]?.terminal).toBe(true);
    }
  });
  it('captura cada estado antes de ejecutar y el estado terminal después', () => {
    const r = simulate([p('A', 0, 2), p('B', 1, 3)], algorithm);
    expect(r.snapshots[0]?.processes).toEqual([
      { id: 'A', remaining: 2, status: 'En CPU' }, { id: 'B', remaining: 3, status: 'Pendiente' },
    ]);
    expect(r.snapshots[1]?.processes[0]?.remaining).toBe(1);
    expect(r.snapshots[2]?.processes[0]?.status).toBe('Terminado');
    expect(r.snapshots.at(-1)?.processes.every(p => p.status === 'Terminado')).toBe(true);
    expect(r.snapshots.at(-1)?.ready).toEqual([]);
    expect(r.snapshots.at(-1)?.running).toBeNull();
  });
  it('no muta entradas, es determinista e ignora prioridad', () => {
    const input = [p('A', 0, 3, 9), p('B', 1, 1, 0)];
    const saved = structuredClone(input);
    input.forEach(Object.freeze);
    Object.freeze(input);
    const first = simulate(input, algorithm);
    expect(simulate(input, algorithm)).toEqual(first);
    expect(input).toEqual(saved);
    expect(simulate(saved.map(p => ({ ...p, priority: 99 })), algorithm)).toEqual(first);
  });
});

describe('validación', () => {
  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rechaza tiempos y prioridades inválidos: %s', value => {
    for (const field of ['arrival', 'burst', 'priority'] as const) {
      expect(() => simulate([{ ...p('A', 0, 1), [field]: value }], 'FCFS')).toThrow();
    }
  });
  it('rechaza nombres e identificadores vacíos o duplicados', () => {
    expect(validateProcesses([p('', 0, 1)])).not.toEqual([]);
    expect(validateProcesses([p('A', 0, 1), p('A', 1, 2)])).not.toEqual([]);
    expect(validateProcesses([{ ...p('A', 0, 1), name: ' '.repeat(2) }])).not.toEqual([]);
    expect(validateProcesses([p('x'.repeat(25), 0, 1)])).not.toEqual([]);
    expect(validateProcesses([p('A', 0, 1), { ...p('B', 0, 1), name: ' A ' }])).not.toEqual([]);
  });
  it('rechaza exceso de procesos y horizonte; acepta el límite', () => {
    expect(validateProcesses(Array.from({ length: 101 }, (_, i) => p(`P${i}`, 0, 0)))).not.toEqual([]);
    expect(() => simulate([p('A', 10000, 1)], 'SJF')).toThrow();
    expect(validateProcesses([p('A', 9999, 1)])).toEqual([]);
  });
  it('rechaza algoritmos desconocidos en runtime', () => {
    expect(() => simulate([], 'RR' as Algorithm)).toThrow('Algoritmo desconocido');
  });
});

describe('invariantes con 60 cargas deterministas', () => {
  it.each(ALGORITHMS)('%s conserva trabajo, estados y métricas', algorithm => {
    let seed = 7341;
    const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
    for (let sample = 0; sample < 60; sample++) {
      const input = Array.from({ length: next() % 7 }, (_, i) => p(`P${i}`, next() % 9, next() % 7));
      const r = simulate(input, algorithm);
      expect(r.busyTime).toBe(input.reduce((s, p) => s + p.burst, 0));
      expect(r.busyTime + r.idleTime).toBe(r.totalTime);
      expect(r.snapshots).toHaveLength(r.totalTime + 1);
      expect(r.timeline.reduce((s, x) => s + x.end - x.start, 0)).toBe(r.totalTime);
      for (const [index, segment] of r.timeline.entries()) {
        expect(segment.start).toBe(index ? r.timeline[index - 1]?.end : 0);
        expect(segment.end).toBeGreaterThan(segment.start);
      }
      for (const process of input) {
        const executed = r.timeline.filter(s => s.processId === process.id).reduce((s, x) => s + x.end - x.start, 0);
        expect(executed).toBe(process.burst);
        const metric = r.metrics.find(m => m.id === process.id);
        expect(metric?.waiting).toBeGreaterThanOrEqual(0);
        expect(metric?.response).toBeGreaterThanOrEqual(0);
      }
      for (const state of r.snapshots) {
        expect(state.ready).not.toContain(state.running);
        expect(new Set(state.ready).size).toBe(state.ready.length);
        expect([...state.ready].sort()).toEqual(state.processes.filter(p => p.status === 'Listo').map(p => p.id).sort());
        if (state.running === null && !state.terminal) expect(state.ready).toEqual([]);
      }
    }
  });
});
