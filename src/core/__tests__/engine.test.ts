import { describe, expect, it } from 'vitest';
import { simulate, validateProcesses, type AlgorithmId, type ProcessInput } from '..';

const p = (pid: string, arrival: number, burst: number, priority = 1): ProcessInput => ({ pid, arrival, burst, priority });

/** Gantt compacto: "P1:0-24 P2:24-27 -:27-30" ("-" = CPU ociosa). */
const gantt = (procs: ProcessInput[], alg: AlgorithmId) =>
  simulate(procs, alg)
    .gantt.map((s) => `${s.pid ?? '-'}:${s.start}-${s.end}`)
    .join(' ');

const metric = (procs: ProcessInput[], alg: AlgorithmId, key: 'waiting' | 'turnaround' | 'response') =>
  Object.fromEntries(simulate(procs, alg).perProcess.map((m) => [m.pid, m[key]]));

describe('Casos de referencia (Silberschatz et al., 2018, cap. 5)', () => {
  const convoy = [p('P1', 0, 24), p('P2', 0, 3), p('P3', 0, 3)];

  it('FIFO – efecto convoy: espera media 17, retorno medio 27', () => {
    expect(gantt(convoy, 'FIFO')).toBe('P1:0-24 P2:24-27 P3:27-30');
    const r = simulate(convoy, 'FIFO');
    expect(metric(convoy, 'FIFO', 'waiting')).toEqual({ P1: 0, P2: 24, P3: 27 });
    expect(r.summary.avgWaiting).toBe(17);
    expect(r.summary.avgTurnaround).toBe(27);
  });

  it('SJF – mismo lote: espera media 3', () => {
    expect(gantt(convoy, 'SJF')).toBe('P2:0-3 P3:3-6 P1:6-30');
    expect(simulate(convoy, 'SJF').summary.avgWaiting).toBe(3);
  });

  it('SJF – ejemplo del libro: espera media 7', () => {
    const procs = [p('P1', 0, 6), p('P2', 0, 8), p('P3', 0, 7), p('P4', 0, 3)];
    expect(gantt(procs, 'SJF')).toBe('P4:0-3 P1:3-9 P3:9-16 P2:16-24');
    expect(simulate(procs, 'SJF').summary.avgWaiting).toBe(7);
  });

  const staggered = [p('P1', 0, 8), p('P2', 1, 4), p('P3', 2, 9), p('P4', 3, 5)];

  it('SRTF – ejemplo del libro: espera media 6.5', () => {
    expect(gantt(staggered, 'SRTF')).toBe('P1:0-1 P2:1-5 P4:5-10 P1:10-17 P3:17-26');
    expect(metric(staggered, 'SRTF', 'waiting')).toEqual({ P1: 9, P2: 0, P3: 15, P4: 2 });
    expect(simulate(staggered, 'SRTF').summary.avgWaiting).toBe(6.5);
  });

  it('SJF no expropiativo con llegadas escalonadas: espera media 7.75', () => {
    expect(gantt(staggered, 'SJF')).toBe('P1:0-8 P2:8-12 P4:12-17 P3:17-26');
    expect(simulate(staggered, 'SJF').summary.avgWaiting).toBe(7.75);
  });

  it('FIFO con llegadas escalonadas: respuesta = espera (no expropiativo)', () => {
    expect(gantt(staggered, 'FIFO')).toBe('P1:0-8 P2:8-12 P3:12-21 P4:21-26');
    expect(metric(staggered, 'FIFO', 'response')).toEqual(metric(staggered, 'FIFO', 'waiting'));
  });
});

describe('Casos límite', () => {
  it('CPU ociosa al inicio y entre procesos se refleja en Gantt y métricas', () => {
    const procs = [p('P1', 2, 3), p('P2', 10, 2)];
    for (const alg of ['FIFO', 'SJF', 'SRTF'] as const) {
      expect(gantt(procs, alg)).toBe('-:0-2 P1:2-5 -:5-10 P2:10-12');
      const s = simulate(procs, alg).summary;
      expect(s.idleTime).toBe(7);
      expect(s.busyTime).toBe(5);
      expect(s.makespan).toBe(12);
      expect(s.cpuUtilization).toBeCloseTo(5 / 12);
    }
  });

  it('Llegadas simultáneas en FIFO: desempata el orden de la tabla', () => {
    const procs = [p('B', 0, 2), p('A', 0, 2), p('C', 0, 2)];
    expect(gantt(procs, 'FIFO')).toBe('B:0-2 A:2-4 C:4-6');
  });

  it('Empate de ráfaga en SJF: desempata la llegada y luego el orden de la tabla', () => {
    const procs = [p('P1', 0, 4), p('P3', 1, 3), p('P2', 1, 3), p('P4', 0, 3)];
    // En t=0 compiten P1(4) y P4(3) → P4. En t=3: P1(4), P3(3,llegó 1), P2(3,llegó 1) → P3 (fila anterior).
    expect(gantt(procs, 'SJF')).toBe('P4:0-3 P3:3-6 P2:6-9 P1:9-13');
  });

  it('SRTF no expropia en empate de tiempo restante', () => {
    const procs = [p('P1', 0, 4), p('P2', 1, 3)];
    expect(gantt(procs, 'SRTF')).toBe('P1:0-4 P2:4-7');
    expect(simulate(procs, 'SRTF').events.some((e) => e.type === 'EXPROPIACION')).toBe(false);
  });

  it('SRTF expropia cuando el recién llegado es estrictamente menor', () => {
    const procs = [p('P1', 0, 5), p('P2', 2, 1)];
    const r = simulate(procs, 'SRTF');
    expect(gantt(procs, 'SRTF')).toBe('P1:0-2 P2:2-3 P1:3-6');
    expect(r.summary.contextSwitches).toBe(2);
    expect(r.perProcess.find((m) => m.pid === 'P1')!.response).toBe(0);
  });

  it('Ráfaga nula: termina al llegar, no ocupa CPU y genera advertencia', () => {
    const procs = [p('P1', 0, 3), p('P2', 1, 0), p('P3', 1, 2)];
    const r = simulate(procs, 'FIFO');
    expect(gantt(procs, 'FIFO')).toBe('P1:0-3 P3:3-5');
    expect(r.perProcess.find((m) => m.pid === 'P2')).toMatchObject({ completion: 1, waiting: 0, turnaround: 0, response: 0 });
    expect(r.warnings.length).toBe(1);
  });

  it('Todos con ráfaga nula: no hay división por cero', () => {
    const r = simulate([p('P1', 0, 0), p('P2', 0, 0)], 'SJF');
    expect(r.gantt).toEqual([]);
    expect(r.summary).toMatchObject({ makespan: 0, cpuUtilization: 0, throughput: 0 });
  });

  it('La cola de listos excluye al proceso en ejecución y respeta el orden de llegada', () => {
    const r = simulate([p('P1', 0, 3), p('P2', 1, 2), p('P3', 1, 1)], 'FIFO');
    expect(r.timeline.map((t) => t.ready.join(','))).toEqual(['', 'P2,P3', 'P2,P3', 'P3', 'P3', '']);
  });
});

describe('Invariantes (todas las políticas)', () => {
  const gen = (seed: number): ProcessInput[] => {
    let s = seed;
    const rnd = (m: number) => ((s = (s * 1103515245 + 12345) % 2 ** 31), s % m);
    return Array.from({ length: 1 + rnd(8) }, (_, i) => p(`P${i + 1}`, rnd(15), rnd(9)));
  };

  it.each(Array.from({ length: 200 }, (_, i) => i + 1))('semilla %i', (seed) => {
    const procs = gen(seed);
    for (const alg of ['FIFO', 'SJF', 'SRTF'] as const) {
      const r = simulate(procs, alg);
      const totalBurst = procs.reduce((a, x) => a + x.burst, 0);
      expect(r.summary.busyTime).toBe(totalBurst);
      expect(r.summary.busyTime + r.summary.idleTime).toBe(r.summary.makespan);
      for (const m of r.perProcess) {
        expect(m.waiting).toBeGreaterThanOrEqual(0);
        expect(m.response).toBeGreaterThanOrEqual(0);
        expect(m.response).toBeLessThanOrEqual(m.waiting);
        expect(m.turnaround).toBe(m.waiting + m.burst);
        // Ticks en el Gantt = ráfaga
        const used = r.gantt.filter((g) => g.pid === m.pid).reduce((a, g) => a + g.end - g.start, 0);
        expect(used).toBe(m.burst);
      }
      // Ningún proceso se ejecuta antes de llegar
      for (const g of r.gantt) if (g.pid) expect(g.start).toBeGreaterThanOrEqual(procs.find((x) => x.pid === g.pid)!.arrival);
      // No expropiativos: cada proceso aparece en un solo tramo
      if (alg !== 'SRTF') for (const m of r.perProcess) expect(r.gantt.filter((g) => g.pid === m.pid).length).toBe(m.burst ? 1 : 0);
    }
  });

  it('SJF es óptimo en espera media cuando todos llegan en 0', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const procs = gen(seed).map((x) => ({ ...x, arrival: 0 }));
      expect(simulate(procs, 'SJF').summary.avgWaiting).toBeLessThanOrEqual(simulate(procs, 'FIFO').summary.avgWaiting);
    }
  });
});

describe('Validación de entrada', () => {
  it('rechaza ids repetidos, negativos y decimales', () => {
    const errs = validateProcesses([p('P1', 0, 2), p('P1', -1, 2.5)]);
    expect(errs.map((e) => e.field)).toEqual(['pid', 'arrival', 'burst']);
    expect(() => simulate([], 'FIFO')).toThrow();
  });
});
