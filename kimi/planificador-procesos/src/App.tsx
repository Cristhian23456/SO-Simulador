import { useEffect, useMemo, useRef, useState } from 'react';
import {
  simulate,
  validateProcesses,
  type AlgorithmId,
  type ProcessInput,
} from './core';
import { ProcessTable } from './ui/ProcessTable';
import { AlgorithmSelector } from './ui/AlgorithmSelector';
import { GanttChart } from './ui/GanttChart';
import { StepPlayer } from './ui/StepPlayer';
import { MetricsTable } from './ui/MetricsTable';
import { ComparisonTable } from './ui/ComparisonTable';

const INITIAL_PROCESSES: ProcessInput[] = [
  { id: 1, name: 'P1', arrival: 0, burst: 7, priority: 1 },
  { id: 2, name: 'P2', arrival: 2, burst: 4, priority: 2 },
  { id: 3, name: 'P3', arrival: 4, burst: 1, priority: 3 },
  { id: 4, name: 'P4', arrival: 5, burst: 4, priority: 4 },
];

export default function App() {
  const [processes, setProcesses] = useState<ProcessInput[]>(INITIAL_PROCESSES);
  const [algorithm, setAlgorithm] = useState<AlgorithmId>('FCFS');
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const nextIdRef = useRef(5);

  const errors = useMemo(() => validateProcesses(processes), [processes]);

  // Se simulan SIEMPRE los tres algoritmos con la misma carga (para la comparación).
  const results = useMemo(() => {
    if (errors.length > 0) return null;
    return {
      FCFS: simulate(processes, 'FCFS'),
      SJF: simulate(processes, 'SJF'),
      SRTF: simulate(processes, 'SRTF'),
    };
  }, [processes, errors.length]);

  const result = results !== null ? results[algorithm] : null;
  const lastStep = result !== null && result.steps.length > 0 ? result.steps.length - 1 : 0;
  const clampedStep = Math.min(currentStep, lastStep);

  useEffect(() => {
    setCurrentStep(0);
    setPlaying(false);
  }, [algorithm, processes]);

  useEffect(() => {
    if (!playing || result === null) return;
    if (clampedStep >= lastStep) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setCurrentStep(clampedStep + 1), 700);
    return () => window.clearTimeout(timer);
  }, [playing, clampedStep, result, lastStep]);

  const updateProcess = (id: number, patch: Partial<ProcessInput>) =>
    setProcesses((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const addProcess = () => {
    const id = nextIdRef.current++;
    setProcesses((prev) => [
      ...prev,
      { id, name: `P${id}`, arrival: 0, burst: 1, priority: prev.length + 1 },
    ]);
  };

  const removeProcess = (id: number) =>
    setProcesses((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="app">
      <header>
        <h1>Simulador de planificación de procesos</h1>
        <p>Sistemas Operativos · Hito 1 · FIFO (FCFS) · SJF no expropiativo · SJF expropiativo (SRTF)</p>
      </header>

      <section className="card">
        <h2>1 · Carga de procesos</h2>
        <ProcessTable
          processes={processes}
          errors={errors}
          onChange={updateProcess}
          onRemove={removeProcess}
        />
        <button className="btn" onClick={addProcess}>
          + Añadir proceso
        </button>
      </section>

      <section className="card">
        <h2>2 · Algoritmo</h2>
        <AlgorithmSelector value={algorithm} onChange={setAlgorithm} />
      </section>

      {result === null ? (
        <section className="card">
          <h2>Simulación</h2>
          <p className="error-msg">Corrige los errores de la tabla de procesos para poder simular.</p>
        </section>
      ) : (
        <>
          {result.warnings.map((w) => (
            <div key={w} className="warning">
              ⚠️ {w}
            </div>
          ))}

          <section className="card">
            <h2>3 · Diagrama de Gantt — {algorithm}</h2>
            <GanttChart result={result} currentTime={clampedStep} onSeek={setCurrentStep} />
          </section>

          <section className="card">
            <h2>4 · Reproducción paso a paso</h2>
            <StepPlayer
              result={result}
              currentStep={clampedStep}
              onStepChange={setCurrentStep}
              playing={playing}
              onTogglePlay={() => setPlaying((v) => !v)}
            />
          </section>

          <section className="card">
            <h2>5 · Métricas — {algorithm}</h2>
            <MetricsTable result={result} />
          </section>

          <section className="card">
            <h2>6 · Comparación de algoritmos (misma carga)</h2>
            {results !== null && <ComparisonTable results={results} />}
          </section>
        </>
      )}
    </div>
  );
}
