import type { ProcessInput } from './types';

export const LIMITS = { maxProcesses: 26, maxArrival: 500, maxBurst: 100 } as const;

export interface ValidationError {
  row: number | null;
  field: keyof ProcessInput | null;
  message: string;
}

const isNonNegInt = (n: number) => Number.isInteger(n) && n >= 0;

/** Valida la entrada antes de simular. Devuelve lista vacía si todo es correcto. */
export function validateProcesses(list: ProcessInput[]): ValidationError[] {
  const errors: ValidationError[] = [];
  if (list.length === 0) errors.push({ row: null, field: null, message: 'Ingrese al menos un proceso.' });
  if (list.length > LIMITS.maxProcesses)
    errors.push({ row: null, field: null, message: `Máximo ${LIMITS.maxProcesses} procesos.` });

  const seen = new Map<string, number>();
  list.forEach((p, i) => {
    const pid = p.pid.trim();
    if (!pid) errors.push({ row: i, field: 'pid', message: 'El identificador no puede estar vacío.' });
    else if (seen.has(pid))
      errors.push({ row: i, field: 'pid', message: `"${pid}" está repetido (fila ${seen.get(pid)! + 1}).` });
    else seen.set(pid, i);

    if (!isNonNegInt(p.arrival) || p.arrival > LIMITS.maxArrival)
      errors.push({ row: i, field: 'arrival', message: `Llegada: entero entre 0 y ${LIMITS.maxArrival}.` });
    if (!isNonNegInt(p.burst) || p.burst > LIMITS.maxBurst)
      errors.push({ row: i, field: 'burst', message: `Ráfaga: entero entre 0 y ${LIMITS.maxBurst}.` });
    if (!Number.isInteger(p.priority))
      errors.push({ row: i, field: 'priority', message: 'Prioridad: número entero.' });
  });
  return errors;
}
