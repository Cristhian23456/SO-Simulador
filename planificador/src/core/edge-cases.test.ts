import { describe, expect, it } from 'vitest';
import { simulate } from './simulate';
import type { Algorithm } from './types';

const cases: { name: string; algorithm: Algorithm; inputs: [number, number][]; gantt: [string | null, number, number][] }[] = [
  { name: 'FIFO con CPU ociosa entre 8 y 10', algorithm: 'FCFS', inputs: [[0,4],[1,3],[2,1],[10,2]], gantt: [['P1',0,4],['P2',4,7],['P3',7,8],[null,8,10],['P4',10,12]] },
  { name: 'FIFO con llegadas simultáneas', algorithm: 'FCFS', inputs: [[0,3],[0,2],[0,1]], gantt: [['P1',0,3],['P2',3,5],['P3',5,6]] },
  { name: 'SRTF sin expropiación ante empate en t = 2', algorithm: 'SRTF', inputs: [[0,6],[1,2],[2,1],[3,3]], gantt: [['P1',0,1],['P2',1,3],['P3',3,4],['P4',4,7],['P1',7,12]] },
  { name: 'FIFO con ráfaga cero', algorithm: 'FCFS', inputs: [[0,0],[1,2]], gantt: [[null,0,1],['P2',1,3]] },
];

describe('Cuatro casos límite solicitados', () => {
  it.each(cases)('$name', c => {
    const processes = c.inputs.map(([arrival, burst], i) => ({ id: `P${i+1}`, name: `P${i+1}`, arrival, burst, priority: 0 }));
    const r = simulate(processes, c.algorithm);
    expect(r.timeline.map(s => [s.processId, s.start, s.end])).toEqual(c.gantt);
    if (c.name.includes('ociosa')) {
      expect(r.idleTime).toBe(2);
      for (const t of [8, 9]) {
        expect(r.snapshots[t]?.running).toBeNull();
        expect(r.snapshots[t]?.ready).toEqual([]);
        expect(r.snapshots[t]?.processes[3]?.status).toBe('Pendiente');
      }
      expect(r.snapshots[10]?.running).toBe('P4');
    }
    if (c.name.includes('simultáneas')) {
      expect(r.snapshots[0]?.running).toBe('P1');
      expect(r.snapshots[0]?.ready).toEqual(['P2', 'P3']);
    }
    if (c.algorithm === 'SRTF') {
      expect(r.snapshots[2]?.running).toBe('P2');
      expect(r.snapshots[2]?.ready).toEqual(['P1', 'P3']);
      expect(r.snapshots[2]?.events.some(e => e.includes('expropia'))).toBe(false);
      expect(r.snapshots[2]?.processes[1]?.remaining).toBe(1);
      expect(r.snapshots[2]?.processes[2]?.remaining).toBe(1);
    }
    if (c.name.includes('cero')) {
      expect(r.metrics[0]).toEqual({ id: 'P1', firstStart: 0, finish: 0, turnaround: 0, waiting: 0, response: 0 });
      expect(r.snapshots[0]?.processes[0]?.status).toBe('Terminado');
      expect(r.snapshots[0]?.ready).toEqual([]);
      expect(r.warnings).toHaveLength(1);
    }
  });
});
