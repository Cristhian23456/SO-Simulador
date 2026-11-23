import type { Algorithm, ProcessInput } from './types';

export interface Exercise {
  name: string;
  algorithm: Algorithm;
  processes: ProcessInput[];
}

function load(values: readonly (readonly [string, number, number])[]): ProcessInput[] {
  return values.map(([name, arrival, burst]) => ({ id: name, name, arrival, burst, priority: 0 }));
}

/** El orden A, B, C, D, E es el orden de tabla usado para desempatar. */
export const EXERCISES: Exercise[] = [
  { name: 'FIFO 1', algorithm: 'FCFS', processes: load([
    ['A', 10, 3], ['B', 0, 6], ['C', 2, 4], ['D', 8, 6], ['E', 7, 1],
  ]) },
  { name: 'FIFO 2', algorithm: 'FCFS', processes: load([
    ['A', 10, 3], ['B', 2, 4], ['C', 6, 6], ['D', 0, 7], ['E', 7, 1],
  ]) },
  { name: 'FIFO 3', algorithm: 'FCFS', processes: load([
    ['A', 5, 3], ['B', 0, 6], ['C', 2, 4], ['D', 9, 6], ['E', 4, 1],
  ]) },
  { name: 'SJF 1', algorithm: 'SJF', processes: load([
    ['A', 9, 4], ['B', 0, 9], ['C', 2, 6], ['D', 0, 4], ['E', 6, 1],
  ]) },
  { name: 'SJF 2', algorithm: 'SJF', processes: load([
    ['A', 7, 4], ['B', 0, 9], ['C', 2, 6], ['D', 1, 4], ['E', 8, 1],
  ]) },
  { name: 'SJF 3', algorithm: 'SJF', processes: load([
    ['A', 3, 4], ['B', 7, 8], ['C', 0, 10], ['D', 9, 4], ['E', 0, 5],
  ]) },
];
