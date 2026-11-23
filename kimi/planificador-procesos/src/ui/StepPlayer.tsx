import type { SimulationResult } from '../core';
import { colorOf } from './palette';

const STATUS_LABEL: Record<string, string> = {
  no_llega: 'No llega',
  listo: 'Listo',
  ejecutando: 'Ejecutando',
  terminado: 'Terminado',
};

interface Props {
  result: SimulationResult;
  currentStep: number;
  onStepChange: (n: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
}

/** Reproducción paso a paso: CPU, cola de listos y estado de cada proceso por instante. */
export function StepPlayer({ result, currentStep, onStepChange, playing, onTogglePlay }: Props) {
  const steps = result.steps;
  if (steps.length === 0) {
    return <p className="empty">No hay instantes que reproducir (todos los procesos tienen ráfaga 0).</p>;
  }

  const max = steps.length - 1;
  const step = steps[Math.min(currentStep, max)];

  return (
    <div className="player">
      <div className="player-controls">
        <button className="btn" onClick={() => onStepChange(Math.max(0, currentStep - 1))} disabled={currentStep <= 0}>
          ◀ Anterior
        </button>
        <button className="btn btn-primary" onClick={onTogglePlay}>
          {playing ? '⏸ Pausar' : '▶ Reproducir'}
        </button>
        <button className="btn" onClick={() => onStepChange(Math.min(max, currentStep + 1))} disabled={currentStep >= max}>
          Siguiente ▶
        </button>
        <input
          type="range"
          min={0}
          max={max}
          value={Math.min(currentStep, max)}
          onChange={(e) => onStepChange(Number(e.target.value))}
          aria-label="Instante de simulación"
        />
        <strong className="now">t = {step.time}</strong>
      </div>

      <div className="player-grid">
        <div className="panel">
          <h3>CPU</h3>
          {step.running !== null ? (
            <div className="cpu-chip" style={{ background: colorOf(step.running.id) }}>
              {step.running.name} · restante {step.running.remaining}u
            </div>
          ) : (
            <div className="cpu-chip idle">Ociosa</div>
          )}
        </div>

        <div className="panel">
          <h3>Cola de listos <small>(orden de llegada a la cola · sin el proceso en ejecución)</small></h3>
          {step.readyQueue.length === 0 ? (
            <p className="empty">Vacía</p>
          ) : (
            <div className="chips">
              {step.readyQueue.map((p) => (
                <span key={p.id} className="chip" style={{ borderColor: colorOf(p.id) }}>
                  {p.name} · {p.remaining}u restantes
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="panel panel-wide">
          <h3>Estado de los procesos</h3>
          <table className="state-table">
            <thead>
              <tr>
                <th>Proceso</th>
                <th>Llegada</th>
                <th>Ráfaga</th>
                <th>Restante</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {step.processes.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.arrival}</td>
                  <td>{p.burst}</td>
                  <td>{p.remaining}</td>
                  <td>
                    <span className={`badge badge-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="hint">
        Cambios de contexto: <strong>{result.contextSwitches}</strong> · Tiempo total:{' '}
        <strong>{result.totalTime}</strong> · CPU ocupada: <strong>{result.busyTime}</strong> · CPU ociosa:{' '}
        <strong>{result.idleTime}</strong> · Utilización: <strong>{(result.utilization * 100).toFixed(1)}%</strong>
      </p>
    </div>
  );
}
