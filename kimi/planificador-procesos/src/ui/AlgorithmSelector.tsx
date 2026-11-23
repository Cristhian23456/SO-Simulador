import type { AlgorithmId } from '../core';

const OPTIONS: { id: AlgorithmId; title: string; desc: string }[] = [
  {
    id: 'FCFS',
    title: 'FIFO / FCFS',
    desc: 'Primero en entrar a la cola, primero en servirse. Sin expropiación.',
  },
  {
    id: 'SJF',
    title: 'SJF no expropiativo',
    desc: 'Al quedar libre la CPU se elige la menor ráfaga de la cola de listos.',
  },
  {
    id: 'SRTF',
    title: 'SJF expropiativo (SRTF)',
    desc: 'Expropia al proceso en CPU si llega uno con menor tiempo restante.',
  },
];

export function AlgorithmSelector({
  value,
  onChange,
}: {
  value: AlgorithmId;
  onChange: (a: AlgorithmId) => void;
}) {
  return (
    <div className="algo-selector">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          className={`algo-card ${value === o.id ? 'active' : ''}`}
          onClick={() => onChange(o.id)}
        >
          <strong>{o.title}</strong>
          <span>{o.desc}</span>
        </button>
      ))}
    </div>
  );
}
