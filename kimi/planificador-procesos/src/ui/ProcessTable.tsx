import type { ProcessInput, ValidationError } from '../core';

interface Props {
  processes: ProcessInput[];
  errors: ValidationError[];
  onChange: (id: number, patch: Partial<ProcessInput>) => void;
  onRemove: (id: number) => void;
}

function errorFor(errors: ValidationError[], id: number, field: string): string | undefined {
  return errors.find((e) => e.id === id && e.field === field)?.message;
}

/** Tabla editable de procesos con validación en línea. */
export function ProcessTable({ processes, errors, onChange, onRemove }: Props) {
  const toInt = (raw: string): number => {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  };

  return (
    <div className="table-wrap">
      <table className="proc-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Llegada</th>
            <th>Ráfaga (CPU)</th>
            <th>Prioridad</th>
            <th aria-label="acciones" />
          </tr>
        </thead>
        <tbody>
          {processes.map((p, idx) => (
            <tr key={p.id}>
              <td className="muted">{idx + 1}</td>
              <td>
                <input
                  value={p.name}
                  onChange={(e) => onChange(p.id, { name: e.target.value })}
                  className={errorFor(errors, p.id, 'name') ? 'invalid' : ''}
                />
                {errorFor(errors, p.id, 'name') && (
                  <small className="field-error">{errorFor(errors, p.id, 'name')}</small>
                )}
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={p.arrival}
                  onChange={(e) => onChange(p.id, { arrival: toInt(e.target.value) })}
                  className={errorFor(errors, p.id, 'arrival') ? 'invalid' : ''}
                />
                {errorFor(errors, p.id, 'arrival') && (
                  <small className="field-error">{errorFor(errors, p.id, 'arrival')}</small>
                )}
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={p.burst}
                  onChange={(e) => onChange(p.id, { burst: toInt(e.target.value) })}
                  className={errorFor(errors, p.id, 'burst') ? 'invalid' : ''}
                />
                {errorFor(errors, p.id, 'burst') && (
                  <small className="field-error">{errorFor(errors, p.id, 'burst')}</small>
                )}
              </td>
              <td>
                <input
                  type="number"
                  step={1}
                  value={p.priority ?? ''}
                  placeholder="—"
                  onChange={(e) =>
                    onChange(p.id, {
                      priority: e.target.value === '' ? undefined : toInt(e.target.value),
                    })
                  }
                  className={errorFor(errors, p.id, 'priority') ? 'invalid' : ''}
                />
                {errorFor(errors, p.id, 'priority') && (
                  <small className="field-error">{errorFor(errors, p.id, 'priority')}</small>
                )}
              </td>
              <td>
                <button
                  className="btn-danger"
                  onClick={() => onRemove(p.id)}
                  disabled={processes.length <= 1}
                  title="Eliminar proceso"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
