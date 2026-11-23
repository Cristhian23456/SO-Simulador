import type { ProcessInput } from './types';

export const MAX_PROCESSES = 100;
export const MAX_HORIZON = 10_000;

export function validateProcesses(processes: readonly ProcessInput[]): string[] {
  const errors: string[] = [];
  if (processes.length > MAX_PROCESSES) errors.push(`Máximo ${MAX_PROCESSES} procesos.`);
  const ids = new Set<string>();
  const names = new Set<string>();
  let maxArrival = 0;
  let totalBurst = 0;
  processes.forEach((p, index) => {
    const row = `Fila ${index + 1}`;
    if (!p.id.trim() || ids.has(p.id)) errors.push(`${row}: identificador vacío o duplicado.`);
    ids.add(p.id);
    const name = p.name.trim();
    if (!name || name.length > 24) errors.push(`${row}: nombre de 1 a 24 caracteres.`);
    if (name && names.has(name)) errors.push(`${row}: nombre duplicado.`);
    names.add(name);
    for (const [label, value] of [['llegada', p.arrival], ['ráfaga', p.burst], ['prioridad', p.priority]] as const) {
      if (!Number.isSafeInteger(value) || value < 0) errors.push(`${row}: ${label} debe ser un entero no negativo.`);
    }
    maxArrival = Math.max(maxArrival, p.arrival);
    totalBurst += p.burst;
  });
  if (maxArrival + totalBurst > MAX_HORIZON) {
    errors.push(`La llegada máxima + suma de ráfagas debe ser ≤ ${MAX_HORIZON} para limitar la memoria de los pasos.`);
  }
  return errors;
}
