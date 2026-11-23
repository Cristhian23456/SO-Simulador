import { describe, expect, it } from 'vitest';
import { validateProcesses } from '../validate';
import type { ProcessInput } from '../types';

const ok: ProcessInput[] = [
  { id: 1, name: 'P1', arrival: 0, burst: 5, priority: 1 },
  { id: 2, name: 'P2', arrival: 3, burst: 2 },
];

describe('validateProcesses', () => {
  it('acepta una tabla válida (ráfaga 0 permitida)', () => {
    expect(validateProcesses([...ok, { id: 3, name: 'P3', arrival: 0, burst: 0 }])).toEqual([]);
  });

  it('rechaza nombre vacío', () => {
    const errors = validateProcesses([{ ...ok[0], name: '   ' }]);
    expect(errors.some((e) => e.field === 'name')).toBe(true);
  });

  it('rechaza nombres duplicados sin importar mayúsculas', () => {
    const errors = validateProcesses([ok[0], { ...ok[1], name: 'p1' }]);
    expect(errors.some((e) => e.field === 'name' && e.message.includes('duplicado'))).toBe(true);
  });

  it('rechaza llegada negativa o no entera', () => {
    expect(validateProcesses([{ ...ok[0], arrival: -1 }]).some((e) => e.field === 'arrival')).toBe(true);
    expect(validateProcesses([{ ...ok[0], arrival: 1.5 }]).some((e) => e.field === 'arrival')).toBe(true);
  });

  it('rechaza ráfaga negativa o no entera; acepta 0', () => {
    expect(validateProcesses([{ ...ok[0], burst: -2 }]).some((e) => e.field === 'burst')).toBe(true);
    expect(validateProcesses([{ ...ok[0], burst: 2.7 }]).some((e) => e.field === 'burst')).toBe(true);
    expect(validateProcesses([{ ...ok[0], burst: 0 }]).some((e) => e.field === 'burst')).toBe(false);
  });

  it('rechaza prioridad no entera', () => {
    expect(validateProcesses([{ ...ok[0], priority: 1.2 }]).some((e) => e.field === 'priority')).toBe(true);
    expect(validateProcesses([{ ...ok[0], priority: undefined }]).some((e) => e.field === 'priority')).toBe(false);
  });

  it('reporta un error por proceso afectado (id correcto)', () => {
    const errors = validateProcesses([ok[0], { ...ok[1], arrival: -5 }]);
    expect(errors).toHaveLength(1);
    expect(errors[0].id).toBe(2);
    expect(errors[0].field).toBe('arrival');
  });
});
