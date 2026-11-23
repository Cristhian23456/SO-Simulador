import { useState } from 'react';
import type { ProcessInput, SimulationResult } from '../core/types';
import { COLORS } from './model';

interface Props { result: SimulationResult; processes: readonly ProcessInput[]; time: number }

export function Gantt({ result, processes, time }: Props) {
  const [scale, setScale] = useState(40);
  const tickStep = Math.max(1, Math.ceil(result.totalTime / 100));
  const ticks = Array.from({ length: Math.ceil(result.totalTime / tickStep) }, (_, i) => i * tickStep);
  ticks.push(result.totalTime);
  return <section className="panel" aria-labelledby="gantt-title">
    <div className="section-head">
      <div><span className="eyebrow">LÍNEA DE TIEMPO</span><h2 id="gantt-title">Diagrama de Gantt</h2></div>
      <label className="zoom">Escala <select value={scale} onChange={e => setScale(Number(e.target.value))}>
        <option value={16}>16 px / u</option><option value={40}>40 px / u</option><option value={64}>64 px / u</option>
      </select></label>
    </div>
    {result.totalTime === 0 ? <p className="empty">No hay unidades de CPU que representar.</p> :
      <div className="gantt-scroll" tabIndex={0} role="region" aria-label="Gantt desplazable horizontalmente">
        <div className="gantt-track" style={{ width: result.totalTime * scale }}>
          <div className="segments">{result.timeline.map(segment => {
            const index = processes.findIndex(p => p.id === segment.processId);
            const name = processes[index]?.name ?? 'Ociosa';
            return <div key={segment.start} className={`segment ${segment.processId === null ? 'idle' : ''}`}
              style={{ width: (segment.end - segment.start) * scale, backgroundColor: index >= 0 ? COLORS[index % COLORS.length] : undefined }}
              title={`${name}: [${segment.start}, ${segment.end}) · ${segment.end - segment.start} u`}
              aria-label={`${name}, de ${segment.start} a ${segment.end}`}>
              <strong>{name}</strong><span>{segment.end - segment.start} u</span>
            </div>;
          })}</div>
          <div className="time-marker" style={{ left: time * scale }}><span>t = {time}</span></div>
          <div className="ticks">{ticks.map(t => <span key={t} style={{ left: t * scale }}>{t}</span>)}</div>
        </div>
      </div>}
    <div className="legend">{processes.map((p, i) => <span key={p.id}><i style={{ background: COLORS[i % COLORS.length] }} />{p.name}</span>)}
      <span><i className="idle" />CPU ociosa</span>
    </div>
    <p className="hint">Cada bloque representa [inicio, fin). Su ancho es proporcional a la duración. El gráfico muestra la ejecución completa; la línea marca el paso seleccionado.</p>
  </section>;
}
