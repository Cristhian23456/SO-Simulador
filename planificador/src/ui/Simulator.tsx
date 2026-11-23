import { useEffect, useState } from 'react';
import { ALGORITHMS, type Algorithm, type ProcessInput, type SimulationResult } from '../core/types';
import { Gantt } from './Gantt';
import { COLORS, DESCRIPTIONS, LABELS, format } from './model';

interface Props {
  processes: ProcessInput[];
  algorithm: Algorithm;
  results: Record<Algorithm, SimulationResult>;
}

export function Simulator({ processes, algorithm, results }: Props) {
  const result = results[algorithm];
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [delay, setDelay] = useState(700);
  const lastStep = result.snapshots.length - 1;
  const snapshot = result.snapshots[step];
  useEffect(() => {
    if (!playing) return;
    if (step >= lastStep) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setStep(s => Math.min(s + 1, lastStep)), delay);
    return () => window.clearTimeout(timer);
  }, [playing, step, lastStep, delay]);
  if (!snapshot) return null;
  const seek = (value: number) => { setPlaying(false); setStep(value); };
  const processName = (id: string | null) => processes.find(p => p.id === id)?.name ?? 'Ociosa';
  return <>
    <div className="algorithm-note"><span className="pill">{LABELS[algorithm]}</span><p>{DESCRIPTIONS[algorithm]}</p></div>
    <div className="stats">
      <div><span>Tiempo total</span><strong>{result.totalTime}<small> u</small></strong></div>
      <div><span>CPU ociosa</span><strong>{result.idleTime}<small> u</small></strong></div>
      <div><span>Utilización</span><strong>{format(result.utilization * 100)}<small> %</small></strong></div>
      <div><span>Cambios de contexto</span><strong>{result.contextSwitches}</strong></div>
    </div>
    {result.warnings.length > 0 && <div className="warning" role="status">{result.warnings.map(w => <p key={w}>{w}</p>)}</div>}
    <Gantt result={result} processes={processes} time={snapshot.time} />
    <section className="panel" aria-labelledby="play-title">
      <div className="section-head"><div><span className="eyebrow">OBSERVA CADA DECISIÓN</span><h2 id="play-title">Ejecución paso a paso</h2></div>
        <div className="clock">t = {snapshot.time}<span>{snapshot.terminal ? 'Finalizado' : `[${snapshot.time}, ${snapshot.time + 1})`}</span></div>
      </div>
      <div className="playback">
        <button onClick={() => seek(0)} disabled={step === 0}>Inicio</button>
        <button onClick={() => seek(Math.max(0, step - 1))} disabled={step === 0}>Anterior</button>
        <button className="primary" onClick={() => setPlaying(p => !p)} disabled={snapshot.terminal}>{playing ? 'Pausar' : 'Reproducir'}</button>
        <button onClick={() => seek(Math.min(lastStep, step + 1))} disabled={snapshot.terminal}>Siguiente</button>
        <button onClick={() => seek(lastStep)} disabled={snapshot.terminal}>Final</button>
        <label>Velocidad <select value={delay} onChange={e => setDelay(Number(e.target.value))}>
          <option value={1400}>0,5×</option><option value={700}>1×</option><option value={350}>2×</option>
        </select></label>
      </div>
      <input className="scrubber" type="range" aria-label="Instante de simulación" min={0} max={lastStep} value={step} onChange={e => seek(Number(e.target.value))} />
      <p className="hint">{snapshot.terminal ? 'Estado final después de la última finalización o llegada.' : 'Estado tras las llegadas, la evaluación de expropiación y el despacho; antes de ejecutar una unidad.'}</p>
      <div className="live-grid">
        <div className="cpu-box"><span className="eyebrow">EN CPU</span><strong>{snapshot.terminal ? 'Finalizado' : processName(snapshot.running)}</strong>
          <span>{snapshot.running ? 'Ejecutará una unidad' : snapshot.terminal ? 'Todos los procesos terminaron' : 'Sin procesos listos'}</span></div>
        <div className="queue-box"><span className="eyebrow">COLA DE LISTOS · ORDEN DE ENTRADA</span>
          <div className="queue">{snapshot.ready.length ? snapshot.ready.map((id, i) => <span key={id}><small>{i + 1}</small>{processName(id)}</span>) : <p>Cola vacía</p>}</div>
          <p className="hint">No incluye al proceso en CPU. En SJF/SRTF, el siguiente elegido puede no ser el primero de esta cola.</p></div>
      </div>
      <div className="table-scroll"><table><caption className="sr-only">Estado por proceso en t = {snapshot.time}</caption>
        <thead><tr><th>Proceso</th><th>Estado</th><th>Restante</th></tr></thead>
        <tbody>{snapshot.processes.map((p, i) => <tr key={p.id}><th><span className="process-name"><i style={{ background: COLORS[i % COLORS.length] }} />{processName(p.id)}</span></th>
          <td><span className={`status ${p.status === 'En CPU' ? 'running' : p.status === 'Terminado' ? 'done' : ''}`}>{p.status}</span></td><td>{p.remaining} u</td></tr>)}</tbody>
      </table></div>
      <div className="events" aria-live="polite"><strong>Eventos en t = {snapshot.time}</strong>
        <ul>{(snapshot.events.length ? snapshot.events : ['Continúa la ejecución sin nuevos eventos.']).map((event, i) => <li key={i}>{event}</li>)}</ul></div>
    </section>
    <section className="panel" aria-labelledby="metrics-title">
      <div className="section-head"><div><span className="eyebrow">RESULTADOS DE LA EJECUCIÓN COMPLETA</span><h2 id="metrics-title">Métricas por proceso</h2></div><span className="unit">Tiempos en unidades</span></div>
      <div className="table-scroll"><table><thead><tr><th>Proceso</th><th>Llegada</th><th>Ráfaga</th><th>Inicio</th><th>Fin (última unidad)</th><th>Finalización</th><th>Sistema / Retorno</th><th>Espera</th><th>Respuesta</th></tr></thead>
        <tbody>{result.metrics.map(m => {
          const p = processes.find(p => p.id === m.id);
          return <tr key={m.id}><th>{p?.name}</th><td>{p?.arrival}</td><td>{p?.burst}</td><td>{p?.burst === 0 ? '—' : m.firstStart}</td><td>{p?.burst === 0 ? '—' : m.finish - 1}</td><td>{m.finish}</td><td>{m.turnaround}</td><td>{m.waiting}</td><td>{m.response}</td></tr>;
        })}</tbody><tfoot><tr><th colSpan={6}>Promedios · incluye ráfagas 0</th><td>{format(result.averages.turnaround)}</td><td>{format(result.averages.waiting)}</td><td>{format(result.averages.response)}</td></tr></tfoot>
      </table></div>
      <p className="hint">Finalización = fin + 1 · Sistema / Retorno = finalización − llegada = espera + ráfaga · Respuesta = inicio − llegada. Ráfaga 0: no tiene unidad ejecutada; finaliza al llegar y sus duraciones son 0.</p>
    </section>
    <section className="panel" aria-labelledby="compare-title">
      <div className="section-head"><div><span className="eyebrow">MISMA CARGA · TRES POLÍTICAS</span><h2 id="compare-title">Comparación de algoritmos</h2></div></div>
      <div className="table-scroll"><table><thead><tr><th>Algoritmo</th><th>Retorno medio</th><th>Espera media</th><th>Respuesta media</th><th>CPU ociosa</th><th>Utilización</th><th>Cambios</th></tr></thead>
        <tbody>{ALGORITHMS.map(a => { const r = results[a]; return <tr key={a} className={a === algorithm ? 'selected-row' : ''}>
          <th>{LABELS[a]}{a === algorithm && <span className="sr-only">, seleccionado</span>}</th><td>{format(r.averages.turnaround)}</td><td>{format(r.averages.waiting)}</td><td>{format(r.averages.response)}</td>
          <td>{r.idleTime}</td><td>{format(r.utilization * 100)} %</td><td>{r.contextSwitches}</td></tr>; })}</tbody>
      </table></div>
    </section>
    <details className="panel conventions"><summary>Reglas y convenciones del laboratorio</summary>
      <ul><li>Tiempo entero desde t = 0. El horizonte termina cuando todos han terminado, incluidas las llegadas futuras con ráfaga 0.</li>
        <li>Orden en cada instante: llegadas, posible expropiación, despacho y una unidad de ejecución.</li>
        <li>FIFO: orden de entrada; llegadas simultáneas conservan el orden de la tabla.</li>
        <li>SJF: menor ráfaga, menor llegada y orden de tabla. SRTF: menor restante, menor llegada y orden de tabla. Un empate no expropia.</li>
        <li>Un proceso expropiado entra al final de la cola, después de las llegadas de ese instante.</li>
        <li>Ráfaga 0: inicio y fin se registran en la llegada; retorno, espera y respuesta valen 0; no aparece en el Gantt.</li>
        <li>Cambios de contexto: solo transiciones directas entre procesos distintos. Se excluyen el primer despacho y las transiciones desde/hacia ociosidad; costo temporal 0.</li>
        <li>Utilización = tiempo ocupado / tiempo total. Si el tiempo total es 0, se muestra 0 %. Los promedios de una carga vacía son 0.</li>
        <li>La prioridad es un dato editable informativo: estos tres algoritmos no la utilizan.</li></ul>
    </details>
  </>;
}
