import type { ProcessState, SimulationResult } from '../core';
import { colorFor } from './colors';

const STATE_LABEL: Record<ProcessState, string> = {
  NO_LLEGADO: 'Sin llegar',
  LISTO: 'Listo',
  EJECUCION: 'En ejecución',
  TERMINADO: 'Terminado',
};

interface Props {
  result: SimulationResult;
  t: number;
}

/** Estado del sistema en el instante t: CPU, cola de listos y estado de cada proceso. */
export function StatePanel({ result, t }: Props) {
  const pids = result.perProcess.map((p) => p.pid);
  const snap = result.timeline[t];
  const finished = !snap;
  const running = snap?.running ?? null;
  const ready = snap?.ready ?? [];
  const stateOf = (pid: string): ProcessState => (finished ? 'TERMINADO' : snap.states[pid]);
  const remOf = (pid: string) => (finished ? 0 : snap.remaining[pid]);
  const eventsNow = result.events.filter((e) => e.t === t);

  return (
    <div className="state-panel">
      <div className="cpu-box" aria-live="polite">
        <div className="small muted">CPU en [{t}, {t + 1})</div>
        {finished ? (
          <strong>Simulación terminada</strong>
        ) : running ? (
          <span className="chip big" style={{ background: colorFor(pids, running) }}>{running}</span>
        ) : (
          <span className="chip big idle">Ociosa</span>
        )}
      </div>

      <div className="queue-box">
        <div className="small muted">Cola de listos (frente → final)</div>
        <ol className="queue" aria-label="Cola de listos">
          {ready.length === 0 && <li className="muted">vacía</li>}
          {ready.map((pid) => (
            <li key={pid} className="chip" style={{ background: colorFor(pids, pid) }}>
              {pid} <small>({remOf(pid)})</small>
            </li>
          ))}
        </ol>
      </div>

      <div className="events-now">
        <div className="small muted">Eventos en t = {t}</div>
        <ul>
          {eventsNow.length === 0 && <li className="muted">—</li>}
          {eventsNow.map((e, i) => (
            <li key={i}><span className={`tag ${e.type}`}>{e.type}</span> {e.detail}</li>
          ))}
        </ul>
      </div>

      <table className="states">
        <caption className="sr-only">Estado de cada proceso en t = {t}</caption>
        <thead>
          <tr><th scope="col">Proceso</th><th scope="col">Estado</th><th scope="col">Restante</th></tr>
        </thead>
        <tbody>
          {pids.map((pid) => {
            const st = stateOf(pid);
            return (
              <tr key={pid}>
                <th scope="row"><span className="dot" style={{ background: colorFor(pids, pid) }} />{pid}</th>
                <td><span className={`state ${st}`}>{STATE_LABEL[st]}</span></td>
                <td>{remOf(pid)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
