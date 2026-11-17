import { LIMITS, PRESETS, type ProcessInput, type ValidationError } from '../core';

interface Props {
  processes: ProcessInput[];
  errors: ValidationError[];
  onChange: (next: ProcessInput[]) => void;
}

const FIELDS: { key: keyof ProcessInput; label: string; hint: string }[] = [
  { key: 'pid', label: 'Proceso', hint: 'Identificador único' },
  { key: 'arrival', label: 'Llegada', hint: 'Instante en que entra a la cola de listos' },
  { key: 'burst', label: 'Ráfaga', hint: 'Tiempo de CPU requerido' },
  { key: 'priority', label: 'Prioridad', hint: 'Menor número = mayor prioridad (Hito 2)' },
];

function nextPid(list: ProcessInput[]): string {
  let i = list.length + 1;
  while (list.some((p) => p.pid === `P${i}`)) i++;
  return `P${i}`;
}

export function ProcessEditor({ processes, errors, onChange }: Props) {
  const update = (i: number, key: keyof ProcessInput, raw: string) => {
    const next = processes.map((p, j) =>
      j !== i ? p : { ...p, [key]: key === 'pid' ? raw : raw === '' ? NaN : Number(raw) },
    );
    onChange(next);
  };
  const errorFor = (row: number, key: keyof ProcessInput) => errors.find((e) => e.row === row && e.field === key);

  const random = () => {
    const n = 4 + Math.floor(Math.random() * 3);
    onChange(
      Array.from({ length: n }, (_, i) => ({
        pid: `P${i + 1}`,
        arrival: Math.floor(Math.random() * 8),
        burst: 1 + Math.floor(Math.random() * 8),
        priority: 1 + Math.floor(Math.random() * 5),
      })),
    );
  };

  return (
    <section className="card" aria-labelledby="h-procesos">
      <div className="card-head">
        <h2 id="h-procesos">Procesos</h2>
        <div className="toolbar">
          <label className="sr-only" htmlFor="preset">Cargar escenario</label>
          <select
            id="preset"
            value=""
            onChange={(e) => {
              const pr = PRESETS.find((x) => x.id === e.target.value);
              if (pr) onChange(pr.processes.map((p) => ({ ...p })));
            }}
          >
            <option value="">Cargar escenario…</option>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button type="button" onClick={random}>Aleatorio</button>
        </div>
      </div>

      <table className="editor">
        <thead>
          <tr>
            {FIELDS.map((f) => (
              <th key={f.key} scope="col" title={f.hint}>{f.label}</th>
            ))}
            <th scope="col"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {processes.map((p, i) => (
            <tr key={i}>
              {FIELDS.map((f) => {
                const err = errorFor(i, f.key);
                const v = p[f.key];
                return (
                  <td key={f.key}>
                    <input
                      aria-label={`${f.label} de la fila ${i + 1}`}
                      aria-invalid={!!err}
                      title={err?.message ?? f.hint}
                      className={err ? 'invalid' : ''}
                      type={f.key === 'pid' ? 'text' : 'number'}
                      min={f.key === 'priority' ? undefined : 0}
                      max={f.key === 'arrival' ? LIMITS.maxArrival : f.key === 'burst' ? LIMITS.maxBurst : undefined}
                      step={1}
                      value={typeof v === 'number' && Number.isNaN(v) ? '' : v}
                      onChange={(e) => update(i, f.key, e.target.value)}
                    />
                  </td>
                );
              })}
              <td>
                <button
                  type="button"
                  className="icon"
                  aria-label={`Eliminar ${p.pid || `fila ${i + 1}`}`}
                  onClick={() => onChange(processes.filter((_, j) => j !== i))}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="toolbar">
        <button
          type="button"
          disabled={processes.length >= LIMITS.maxProcesses}
          onClick={() => {
            const last = processes[processes.length - 1];
            onChange([...processes, { pid: nextPid(processes), arrival: last ? last.arrival : 0, burst: 1, priority: 1 }]);
          }}
        >
          + Agregar proceso
        </button>
      </div>

      {errors.length > 0 && (
        <ul className="errors" role="alert">
          {errors.map((e, i) => (
            <li key={i}>{e.row !== null ? `Fila ${e.row + 1}: ` : ''}{e.message}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
