import type { AlgorithmId, SimulationResult } from '../core';

interface Row {
  label: string;
  get: (r: SimulationResult) => number;
  better: 'min' | 'max';
  fmt?: (n: number) => string;
}

const f2 = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(2));

const ROWS: Row[] = [
  { label: 'Retorno medio', get: (r) => r.averages.turnaround, better: 'min', fmt: f2 },
  { label: 'Espera media', get: (r) => r.averages.wait, better: 'min', fmt: f2 },
  { label: 'Respuesta media', get: (r) => r.averages.response, better: 'min', fmt: f2 },
  { label: 'CPU ociosa', get: (r) => r.idleTime, better: 'min' },
  {
    label: 'Utilización',
    get: (r) => r.utilization,
    better: 'max',
    fmt: (n) => `${(n * 100).toFixed(1)}%`,
  },
  { label: 'Cambios de contexto', get: (r) => r.contextSwitches, better: 'min' },
];

const ALGOS: AlgorithmId[] = ['FCFS', 'SJF', 'SRTF'];

/** Comparación de los tres algoritmos con la misma carga de procesos. */
export function ComparisonTable({ results }: { results: Record<AlgorithmId, SimulationResult> }) {
  return (
    <div className="table-wrap">
      <table className="metrics-table">
        <thead>
          <tr>
            <th>Métrica</th>
            {ALGOS.map((a) => (
              <th key={a}>{a}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const values = ALGOS.map((a) => row.get(results[a]));
            const best =
              row.better === 'min' ? Math.min(...values) : Math.max(...values);
            return (
              <tr key={row.label}>
                <td>{row.label}</td>
                {ALGOS.map((a, i) => (
                  <td key={a} className={Math.abs(values[i] - best) < 1e-9 ? 'best' : ''}>
                    {row.fmt ? row.fmt(values[i]) : values[i]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="hint">
        Se resalta el mejor valor de cada fila (mínimo en tiempos y cambios de contexto, máximo en
        utilización), con la misma carga de procesos para los tres algoritmos.
      </p>
    </div>
  );
}
