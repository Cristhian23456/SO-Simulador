import { useEffect, useMemo, useState } from 'react';
import { POLICIES, PRESETS, simulate, validateProcesses, type AlgorithmId, type ProcessInput, type SimulationResult } from './core';
import { ProcessEditor } from './ui/ProcessEditor';
import { Gantt } from './ui/Gantt';
import { StatePanel } from './ui/StatePanel';
import { Comparison, MetricsTable } from './ui/Metrics';

const ALGS: AlgorithmId[] = ['FIFO', 'SJF', 'SRTF'];

const DESCRIPTIONS: Record<AlgorithmId, string> = {
  FIFO: 'No expropiativo. Atiende por orden de llegada a la cola de listos. Empates: orden de la tabla.',
  SJF: 'No expropiativo. Elige la menor ráfaga entre los listos. Empates: llegada más temprana, luego orden de la tabla.',
  SRTF: 'Expropiativo. Elige el menor tiempo restante; un recién llegado expulsa solo si su restante es estrictamente menor.',
};

export default function App() {
  const [processes, setProcesses] = useState<ProcessInput[]>(() => PRESETS[2].processes.map((p) => ({ ...p })));
  const [alg, setAlg] = useState<AlgorithmId>('FIFO');
  const [rawT, setT] = useState(0);
  const [rawPlaying, setPlaying] = useState(false);
  const [tab, setTab] = useState<'detalle' | 'comparar' | 'eventos'>('detalle');

  const errors = useMemo(() => validateProcesses(processes), [processes]);
  const results = useMemo<Record<AlgorithmId, SimulationResult> | null>(() => {
    if (errors.length) return null;
    return Object.fromEntries(ALGS.map((a) => [a, simulate(processes, a)])) as Record<AlgorithmId, SimulationResult>;
  }, [processes, errors]);

  const result = results?.[alg];
  const makespan = result?.summary.makespan ?? 0;
  const pids = result?.perProcess.map((p) => p.pid) ?? [];

  // El cursor se acota en render (si cambia la carga y el nuevo tiempo total es menor).
  const t = Math.min(rawT, makespan);
  const playing = rawPlaying && t < makespan;
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      setT(t + 1);
      if (t + 1 >= makespan) setPlaying(false);
    }, 600);
    return () => clearTimeout(id);
  }, [playing, t, makespan]);

  return (
    <div className="app">
      <header>
        <h1>Simulador de planificación de procesos</h1>
        <p className="muted">Sistemas Operativos · UTPL · Hito 1: FIFO y SJF</p>
      </header>

      <main className="layout">
        <aside>
          <ProcessEditor processes={processes} errors={errors} onChange={setProcesses} />
          <section className="card" aria-labelledby="h-alg">
            <h2 id="h-alg">Algoritmo</h2>
            <div className="seg-control" role="radiogroup" aria-label="Algoritmo">
              {ALGS.map((a) => (
                <button key={a} type="button" role="radio" aria-checked={alg === a} className={alg === a ? 'on' : ''} onClick={() => setAlg(a)}>
                  {a}
                </button>
              ))}
            </div>
            <p className="small"><strong>{POLICIES[alg].name}.</strong> {DESCRIPTIONS[alg]}</p>
          </section>
        </aside>

        <div className="main-col">
          {!result ? (
            <section className="card"><p>Corrija los datos de entrada para ver la simulación.</p></section>
          ) : (
            <>
              <section className="card" aria-labelledby="h-gantt">
                <div className="card-head">
                  <h2 id="h-gantt">Diagrama de Gantt · {POLICIES[alg].name}</h2>
                </div>
                {result.warnings.map((w, i) => <p key={i} className="warning" role="note">⚠ {w}</p>)}
                <Gantt segments={result.gantt} pids={pids} makespan={makespan} cursor={t} />
                <div className="player">
                  <button type="button" onClick={() => setT(0)} aria-label="Ir al inicio">⏮</button>
                  <button type="button" onClick={() => setT(Math.max(0, t - 1))} aria-label="Paso atrás">◀</button>
                  <button type="button" onClick={() => { if (t >= makespan) setT(0); setPlaying(!playing); }} aria-label={playing ? 'Pausar' : 'Reproducir'}>
                    {playing ? '⏸' : '▶'}
                  </button>
                  <button type="button" onClick={() => setT(Math.min(makespan, t + 1))} aria-label="Paso adelante">▶|</button>
                  <button type="button" onClick={() => setT(makespan)} aria-label="Ir al final">⏭</button>
                  <input type="range" min={0} max={makespan} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="Instante de tiempo" />
                  <output>t = {t}</output>
                </div>
                <StatePanel result={result} t={t} />
              </section>

              <section className="card">
                <div className="tabs" role="tablist">
                  {([['detalle', 'Métricas'], ['comparar', 'Comparar algoritmos'], ['eventos', 'Registro de eventos']] as const).map(([k, l]) => (
                    <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
                  ))}
                </div>
                {tab === 'detalle' && <MetricsTable result={result} />}
                {tab === 'comparar' && results && <Comparison results={ALGS.map((a) => results[a])} />}
                {tab === 'eventos' && (
                  <ol className="log">
                    {result.events.map((e, i) => (
                      <li key={i}><code>t={e.t}</code> <span className={`tag ${e.type}`}>{e.type}</span> {e.detail}</li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <footer className="small muted">Unidad de tiempo entera · simulación desde t = 0 · referencias: Silberschatz et al. (2018), cap. 5; Tanenbaum &amp; Bos (2015), cap. 2.</footer>
    </div>
  );
}
