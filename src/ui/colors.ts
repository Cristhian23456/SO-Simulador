/** Paleta categórica con buen contraste de texto oscuro; el color nunca es el único canal (siempre va la etiqueta). */
const PALETTE = [
  '#8ec5ff', '#ffb38a', '#9be3a8', '#f7a8c9', '#d4b8ff', '#ffe08a',
  '#86e0d8', '#ffc2a8', '#b8d98a', '#a8b8ff', '#f0c48a', '#c9c9c9',
];

export function colorFor(pids: string[], pid: string): string {
  const i = pids.indexOf(pid);
  return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
}
