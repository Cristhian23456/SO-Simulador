import type { ProcessInput } from './types';

export interface ValidationError {
  id: number;
  field: 'name' | 'arrival' | 'burst' | 'priority';
  message: string;
}

/** Validación de la tabla de procesos. Devuelve la lista de errores (vacía = válida). */
export function validateProcesses(processes: ProcessInput[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenNames = new Set<string>();

  for (const p of processes) {
    const trimmed = p.name.trim();
    if (trimmed === '') {
      errors.push({ id: p.id, field: 'name', message: 'El nombre es obligatorio.' });
    } else {
      const key = trimmed.toLowerCase();
      if (seenNames.has(key)) {
        errors.push({ id: p.id, field: 'name', message: `Nombre duplicado: "${trimmed}".` });
      } else {
        seenNames.add(key);
      }
    }

    if (!Number.isInteger(p.arrival) || p.arrival < 0) {
      errors.push({ id: p.id, field: 'arrival', message: 'La llegada debe ser un entero ≥ 0.' });
    }

    if (!Number.isInteger(p.burst) || p.burst < 0) {
      errors.push({ id: p.id, field: 'burst', message: 'La ráfaga debe ser un entero ≥ 0.' });
    }

    if (p.priority !== undefined && !Number.isInteger(p.priority)) {
      errors.push({ id: p.id, field: 'priority', message: 'La prioridad debe ser un entero.' });
    }
  }

  return errors;
}
