import type { SimulationResult } from '../core';
import { colorOf } from './palette';

const UNIT = 44; // píxeles por unidad de tiempo

interface Props {
  result: SimulationResult;
  /** Instante actual de la reproducción (para la línea vertical). */
  currentTime: number | null;
  onSeek: (step: number) => void;
}

export function GanttChart({ result, currentTime, onSeek }: Props) {
  const { gantt, totalTime } = result;

  if (totalTime === 0) {
    return <p className="empty">Sin actividad en la CPU: todos los procesos tienen ráfaga 0.</p>;
  }

  return (
    <div className="gantt-scroll">
      <div className="gantt" style={{ width: totalTime * UNIT }}>
        {gantt.map((b, i) => (
          <button
            key={i}
            className={`gantt-block ${b.processId === null ? 'idle' : ''}`}
            style={{
              left: b.start * UNIT,
              width: (b.end - b.start) * UNIT - 2,
              background: b.processId === null ? undefined : colorOf(b.processId),
            }}
            onClick={() => onSeek(b.start)}
            title={`${b.label}: t = ${b.start} → ${b.end}`}
          >
            <span>{b.label}</span>
            <small>{b.end - b.start}u</small>
          </button>
        ))}
        {currentTime !== null && (
          <div className="gantt-cursor" style={{ left: (currentTime + 0.5) * UNIT }} />
        )}
      </div>
      <div className="gantt-axis" style={{ width: totalTime * UNIT }}>
        {Array.from({ length: totalTime + 1 }, (_, tt) => (
          <span key={tt} style={{ left: tt * UNIT }}>
            {tt}
          </span>
        ))}
      </div>
    </div>
  );
}
