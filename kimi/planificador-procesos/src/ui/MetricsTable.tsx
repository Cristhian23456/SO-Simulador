import type { SimulationResult } from '../core';

const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(2));

/** Tabla de métricas por proceso + fila de promedios. */
export function MetricsTable({ result }: { result: SimulationResult }) {
  return (
    <div className="table-wrap">
      <table className="metrics-table">
        <thead>
          <tr>
            <th>Proceso</th>
            <th>Llegada</th>
            <th>Ráfaga</th>
            <th>Primer inicio</th>
            <th>Fin</th>
            <th>Retorno (T)</th>
            <th>Espera (W)</th>
            <th>Respuesta (R)</th>
          </tr>
        </thead>
        <tbody>
          {result.processes.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.arrival}</td>
              <td>{p.burst}</td>
              <td>{p.firstStart}</td>
              <td>{p.finish}</td>
              <td>{fmt(p.turnaround)}</td>
              <td>{fmt(p.wait)}</td>
              <td>{fmt(p.response)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5}>Promedios</td>
            <td>{fmt(result.averages.turnaround)}</td>
            <td>{fmt(result.averages.wait)}</td>
            <td>{fmt(result.averages.response)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="hint">
        Retorno = Fin − Llegada · Espera = Retorno − Ráfaga · Respuesta = Primer inicio − Llegada ·
        Utilización = {result.busyTime}/{result.totalTime} = {(result.utilization * 100).toFixed(1)}% ·
        Cambios de contexto: {result.contextSwitches}
      </p>
    </div>
  );
}
