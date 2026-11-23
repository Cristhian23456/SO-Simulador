import { useMemo, useState } from 'react';
import { simulate } from '../core/simulate';
import { EXERCISES } from '../core/exercises';
import { ALGORITHMS, type Algorithm, type ProcessInput } from '../core/types';
import { MAX_PROCESSES, validateProcesses } from '../core/validation';
import { Simulator } from './Simulator';
import { COLORS, DEMO, LABELS } from './model';

interface Draft { id: string; name: string; arrival: string; burst: string; priority: string }
const toDraft = (p: ProcessInput): Draft => ({ ...p, arrival: String(p.arrival), burst: String(p.burst), priority: String(p.priority) });
const number = (value: string): number => value.trim() === '' ? NaN : Number(value);

export function App() {
  const [drafts, setDrafts] = useState<Draft[]>(() => DEMO.map(toDraft));
  const [algorithm, setAlgorithm] = useState<Algorithm>('FCFS');
  const processes = useMemo(() => drafts.map(p => ({ ...p, name: p.name.trim(), arrival: number(p.arrival), burst: number(p.burst), priority: number(p.priority) })), [drafts]);
  const errors = useMemo(() => validateProcesses(processes), [processes]);
  const results = useMemo(() => errors.length ? null : ({
    FCFS: simulate(processes, 'FCFS'), SJF: simulate(processes, 'SJF'), SRTF: simulate(processes, 'SRTF'),
  }), [processes, errors]);
  const update = (id: string, field: keyof Omit<Draft, 'id'>, value: string) => {
    setDrafts(rows => rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };
  const add = () => {
    let n = 1;
    while (drafts.some(p => p.name.trim() === `P${n}`)) n++;
    setDrafts(rows => [...rows, { id: crypto.randomUUID(), name: `P${n}`, arrival: '0', burst: '1', priority: '0' }]);
  };
  return <>
    <header className="topbar"><div className="brand"><span className="brand-icon" aria-hidden="true">▥</span>CPU<span>Lab</span></div><span>Sistemas Operativos <b>Hito 1</b></span></header>
    <main>
      <div className="intro"><div><span className="eyebrow">LABORATORIO INTERACTIVO</span><h1>Cada proceso.<br /><span>A su tiempo.</span></h1>
        <p>Explora cómo el planificador decide quién usa la CPU.<br />Define una carga, recorre la ejecución y compara sus resultados.</p></div>
        <div className="intro-label"><span>3 algoritmos</span><span>Tiempo discreto</span><span>Sin costo de despacho</span></div>
      </div>
      <section className="panel" aria-labelledby="load-title">
        <div className="section-head"><div><span className="eyebrow">CONFIGURA EL EXPERIMENTO</span><h2 id="load-title">Carga de procesos <span className="count">{drafts.length}</span></h2></div>
          <div className="actions"><button onClick={() => setDrafts(DEMO.map(toDraft))}>Cargar ejemplo</button><button onClick={() => setDrafts([])} disabled={!drafts.length}>Vaciar</button><button className="primary" onClick={add} disabled={drafts.length >= MAX_PROCESSES}>+ Añadir proceso</button></div>
        </div>
        <div className="table-scroll"><table className="editor"><thead><tr><th>Orden</th><th>Nombre</th><th>Llegada</th><th>Ráfaga</th><th>Prioridad</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>{drafts.map((p, index) => <tr key={p.id}>
            <td><span className="process-name"><i style={{ background: COLORS[index % COLORS.length] }} />{index + 1}</span></td>
            <td><input aria-label={`Nombre fila ${index + 1}`} value={p.name} maxLength={24} onChange={e => update(p.id, 'name', e.target.value)} /></td>
            {(['arrival', 'burst', 'priority'] as const).map((field, i) => <td key={field}><input type="number" min={0} step={1} aria-label={`${['Llegada', 'Ráfaga', 'Prioridad'][i]} fila ${index + 1}`} value={p[field]} onChange={e => update(p.id, field, e.target.value)} /></td>)}
            <td><button className="delete" aria-label={`Eliminar fila ${index + 1}`} onClick={() => setDrafts(rows => rows.filter(row => row.id !== p.id))}>Eliminar</button></td>
          </tr>)}</tbody>
        </table></div>
        {!drafts.length && <p className="empty">La carga está vacía. Añade un proceso o carga el ejemplo.</p>}
        <div className="config-footer"><p className="hint">Enteros ≥ 0. La prioridad no interviene en estos algoritmos.<br />El orden de la tabla resuelve los empates finales. Los cambios reinician la reproducción.</p>
          <label className="algorithm-select">Ejercicios<select value="" onChange={e => {
            const exercise = EXERCISES.find(x => x.name === e.target.value);
            if (exercise) { setDrafts(exercise.processes.map(toDraft)); setAlgorithm(exercise.algorithm); }
          }}><option value="" disabled>Cargar un ejercicio…</option>{EXERCISES.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}</select></label>
          <label className="algorithm-select">Algoritmo<select value={algorithm} onChange={e => setAlgorithm(e.target.value as Algorithm)}>{ALGORITHMS.map(a => <option key={a} value={a}>{LABELS[a]}</option>)}</select></label>
        </div>
        {errors.length > 0 && <div className="error" role="alert"><strong>Corrige la carga para simular:</strong><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}
      </section>
      {results && <Simulator key={`${algorithm}:${JSON.stringify(processes)}`} processes={processes} algorithm={algorithm} results={results} />}
    </main>
    <footer>CPU Lab <span>FIFO / FCFS · SJF · SRTF</span><span>Motor determinista · TypeScript + React</span></footer>
  </>;
}
