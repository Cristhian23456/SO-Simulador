import type { GanttSegment } from '../core';
import { colorFor } from './colors';

interface Props {
  segments: GanttSegment[];
  pids: string[];
  makespan: number;
  /** Instante actual de la reproducción; los tramos posteriores se atenúan. */
  cursor?: number;
  compact?: boolean;
  label?: string;
}

/**
 * Diagrama de Gantt fiel a la escala: el ancho de cada tramo es proporcional a su duración
 * y los huecos de CPU ociosa se dibujan explícitamente (no se omiten).
 */
export function Gantt({ segments, pids, makespan, cursor, compact, label }: Props) {
  if (makespan === 0) return <p className="muted">Sin uso de CPU (todas las ráfagas son nulas).</p>;
  const pct = (t: number) => `${(t / makespan) * 100}%`;
  const ticks = Array.from({ length: makespan + 1 }, (_, i) => i);
  const step = makespan <= 30 ? 1 : makespan <= 60 ? 2 : 5;
  const desc = segments.map((s) => `${s.pid ?? 'ocioso'} de ${s.start} a ${s.end}`).join('; ');

  return (
    <figure className={`gantt ${compact ? 'compact' : ''}`} aria-label={`${label ?? 'Diagrama de Gantt'}: ${desc}`}>
      <div className="gantt-bar" role="img" aria-hidden="true">
        {segments.map((s, i) => {
          const future = cursor !== undefined && s.start >= cursor;
          return (
            <div
              key={i}
              className={`seg ${s.pid ? '' : 'idle'} ${future ? 'future' : ''}`}
              style={{ left: pct(s.start), width: pct(s.end - s.start), background: s.pid ? colorFor(pids, s.pid) : undefined }}
              title={`${s.pid ?? 'CPU ociosa'}: ${s.start} → ${s.end} (${s.end - s.start} u)`}
            >
              <span>{s.pid ?? (compact ? '' : 'ocio')}</span>
            </div>
          );
        })}
        {cursor !== undefined && <div className="cursor" style={{ left: pct(Math.min(cursor, makespan)) }} />}
      </div>
      <div className="gantt-axis" aria-hidden="true">
        {ticks
          .filter((t) => t % step === 0 || t === makespan || segments.some((s) => s.start === t))
          .map((t) => (
            <span key={t} style={{ left: pct(t) }}>{t}</span>
          ))}
      </div>
    </figure>
  );
}
