import { POLICIES, type AlgorithmId, type SimulationResult } from '../core';
import { Gantt } from './Gantt';

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
const pctf = (n: number) => `${(n * 100).toFixed(1)}%`;

export function MetricsTable({ result }: { result: SimulationResult }) {
  const s = result.summary;
  return (
    <>
      <div className="scroll-x">
        <table className="metrics">
          <thead>
            <tr>
              <th scope="col">Proceso</th>
              <th scope="col">Llegada</th>
              <th scope="col">Ráfaga</th>
              <th scope="col" title="Primer instante en que obtuvo la CPU">Inicio</th>
              <th scope="col" title="Instante de finalización">Fin</th>
              <th scope="col" title="Fin − Llegada">Retorno</th>
              <th scope="col" title="Retorno − Ráfaga">Espera</th>
              <th scope="col" title="Inicio − Llegada">Respuesta</th>
            </tr>
          </thead>
          <tbody>
            {result.perProcess.map((m) => (
              <tr key={m.pid}>
                <th scope="row">{m.pid}</th>
                <td>{m.arrival}</td>
                <td>{m.burst}</td>
                <td>{m.firstStart}</td>
                <td>{m.completion}</td>
                <td title={`${m.completion} − ${m.arrival}`}>{m.turnaround}</td>
                <td title={`${m.turnaround} − ${m.burst}`}>{m.waiting}</td>
                <td title={`${m.firstStart} − ${m.arrival}`}>{m.response}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={5}>Promedio</th>
              <td>{fmt(s.avgTurnaround)}</td>
              <td>{fmt(s.avgWaiting)}</td>
              <td>{fmt(s.avgResponse)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <dl className="kpis">
        <div><dt>Tiempo total</dt><dd>{s.makespan}</dd></div>
        <div><dt>CPU ociosa</dt><dd>{s.idleTime}</dd></div>
        <div><dt>Utilización CPU</dt><dd>{pctf(s.cpuUtilization)}</dd></div>
        <div><dt>Throughput</dt><dd>{fmt(s.throughput)} <small>proc/u</small></dd></div>
        <div><dt>Cambios de contexto</dt><dd>{s.contextSwitches}</dd></div>
      </dl>
      <p className="small muted">
        Retorno = Fin − Llegada · Espera = Retorno − Ráfaga · Respuesta = Primer inicio − Llegada · Utilización = tiempo
        ocupado / tiempo total (desde t = 0).
      </p>
    </>
  );
}

const ROWS: { key: 'avgWaiting' | 'avgTurnaround' | 'avgResponse' | 'idleTime' | 'cpuUtilization' | 'contextSwitches'; label: string; better: 'min' | 'max'; f: (n: number) => string }[] = [
  { key: 'avgWaiting', label: 'Espera media', better: 'min', f: fmt },
  { key: 'avgTurnaround', label: 'Retorno medio', better: 'min', f: fmt },
  { key: 'avgResponse', label: 'Respuesta media', better: 'min', f: fmt },
  { key: 'idleTime', label: 'CPU ociosa', better: 'min', f: fmt },
  { key: 'cpuUtilization', label: 'Utilización CPU', better: 'max', f: pctf },
  { key: 'contextSwitches', label: 'Cambios de contexto', better: 'min', f: fmt },
];

/** Compara los algoritmos sobre la MISMA carga de trabajo. */
export function Comparison({ results }: { results: SimulationResult[] }) {
  const pids = results[0].perProcess.map((p) => p.pid);
  const maxSpan = Math.max(...results.map((r) => r.summary.makespan));
  return (
    <>
      <div className="scroll-x">
        <table className="metrics compare">
          <thead>
            <tr>
              <th scope="col">Métrica</th>
              {results.map((r) => <th key={r.algorithm} scope="col">{POLICIES[r.algorithm as AlgorithmId].name}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const vals = results.map((r) => r.summary[row.key]);
              const best = row.better === 'min' ? Math.min(...vals) : Math.max(...vals);
              const allEqual = vals.every((v) => v === vals[0]);
              return (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  {vals.map((v, i) => (
                    <td key={i} className={v === best && !allEqual ? 'best' : ''}>
                      {row.f(v)}{v === best && !allEqual && <span className="sr-only"> (mejor)</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="compare-gantts">
        {results.map((r) => (
          <div key={r.algorithm}>
            <div className="small"><strong>{POLICIES[r.algorithm].name}</strong></div>
            <div style={{ width: `${(r.summary.makespan / maxSpan) * 100}%` }}>
              <Gantt segments={r.gantt} pids={pids} makespan={r.summary.makespan} compact label={POLICIES[r.algorithm].name} />
            </div>
          </div>
        ))}
      </div>
      <p className="small muted">★ = mejor valor de la fila (sin marca si todos empatan). Los Gantt usan la misma escala de tiempo.</p>
    </>
  );
}
