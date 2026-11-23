/** Colores consistentes entre Gantt, chips de CPU/cola y comparación. */
export const PALETTE = [
  '#3b82f6', '#f97316', '#22c55e', '#a855f7',
  '#eab308', '#ef4444', '#06b6d4', '#64748b',
];

export function colorOf(processId: number): string {
  return PALETTE[(processId - 1) % PALETTE.length];
}
