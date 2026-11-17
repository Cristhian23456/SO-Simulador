/**
 * Tipos del dominio del simulador de planificación de procesos.
 * Unidad de tiempo: entero (ticks). La simulación comienza siempre en t = 0.
 */

/** Proceso tal como lo ingresa el usuario. */
export interface ProcessInput {
  /** Identificador visible y único (p. ej. "P1"). */
  pid: string;
  /** Instante de llegada a la cola de listos (entero >= 0). */
  arrival: number;
  /** Ráfaga de CPU requerida (entero >= 0). 0 = ráfaga nula. */
  burst: number;
  /** Nivel de prioridad (entero; menor número = mayor prioridad). Se usa en el Hito 2. */
  priority: number;
}

export type AlgorithmId = 'FIFO' | 'SJF' | 'SRTF';

/** Estado de un proceso en un instante dado (modelo de 5 estados simplificado). */
export type ProcessState = 'NO_LLEGADO' | 'LISTO' | 'EJECUCION' | 'TERMINADO';

/** Tramo continuo del diagrama de Gantt. pid = null significa CPU ociosa. */
export interface GanttSegment {
  pid: string | null;
  start: number;
  end: number;
}

export type EventType = 'LLEGADA' | 'DESPACHO' | 'EXPROPIACION' | 'FIN' | 'OCIO' | 'RAFAGA_NULA';

export interface SimEvent {
  t: number;
  type: EventType;
  pid: string | null;
  detail: string;
}

/** Fotografía del sistema durante el tick [t, t+1). */
export interface TickSnapshot {
  t: number;
  /** Proceso que usa la CPU en este tick (null = ocioso). */
  running: string | null;
  /** Cola de listos en orden de llegada a la cola, SIN incluir al proceso en ejecución. */
  ready: string[];
  /** Estado de cada proceso al inicio del tick. */
  states: Record<string, ProcessState>;
  /** Tiempo restante de cada proceso al inicio del tick. */
  remaining: Record<string, number>;
}

export interface ProcessMetrics {
  pid: string;
  arrival: number;
  burst: number;
  priority: number;
  /** Primer instante en que obtuvo la CPU (para ráfaga nula = llegada). */
  firstStart: number;
  /** Instante de finalización. */
  completion: number;
  /** Retorno (turnaround) = finalización − llegada. */
  turnaround: number;
  /** Espera = retorno − ráfaga (tiempo total en la cola de listos). */
  waiting: number;
  /** Respuesta = primer inicio − llegada. */
  response: number;
}

export interface SummaryMetrics {
  avgWaiting: number;
  avgTurnaround: number;
  avgResponse: number;
  /** Instante en que termina el último proceso. */
  makespan: number;
  /** Ticks con CPU ociosa dentro de [0, makespan). */
  idleTime: number;
  /** Ticks con CPU ocupada. */
  busyTime: number;
  /** busyTime / makespan (0 si makespan = 0). */
  cpuUtilization: number;
  /** Procesos terminados por unidad de tiempo. */
  throughput: number;
  contextSwitches: number;
}

export interface SimulationResult {
  algorithm: AlgorithmId;
  processes: ProcessInput[];
  gantt: GanttSegment[];
  timeline: TickSnapshot[];
  events: SimEvent[];
  perProcess: ProcessMetrics[];
  summary: SummaryMetrics;
  warnings: string[];
}
