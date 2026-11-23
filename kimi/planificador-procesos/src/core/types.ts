export type AlgorithmId = 'FCFS' | 'SJF' | 'SRTF';

/** Datos de entrada de un proceso tal como se capturan en la tabla. */
export interface ProcessInput {
  /** Identificador estable = orden de la tabla (sirve de desempate final). */
  id: number;
  name: string;
  arrival: number;
  burst: number;
  priority?: number;
}

export type ProcessStatus = 'no_llega' | 'listo' | 'ejecutando' | 'terminado';

/** Vista reducida de un proceso dentro de la CPU o de la cola de listos. */
export interface ReadyProcess {
  id: number;
  name: string;
  remaining: number;
}

/** Estado de un proceso en un instante concreto de la simulación. */
export interface ProcessSnapshot {
  id: number;
  name: string;
  arrival: number;
  burst: number;
  remaining: number;
  status: ProcessStatus;
}

/**
 * Estado del sistema al terminar de procesar el instante t
 * (la unidad ejecutada fue [t, t+1)).
 */
export interface SimulationStep {
  time: number;
  /** Proceso que ocupó la CPU durante [t, t+1); null = CPU ociosa. */
  running: ReadyProcess | null;
  /** Cola de listos en orden de llegada a la cola, SIN el proceso en ejecución. */
  readyQueue: ReadyProcess[];
  processes: ProcessSnapshot[];
}

/** Bloque contiguo del diagrama de Gantt. processId = null → CPU ociosa. */
export interface GanttBlock {
  start: number;
  end: number;
  processId: number | null;
  label: string;
}

export interface ProcessMetrics {
  id: number;
  name: string;
  arrival: number;
  burst: number;
  firstStart: number;
  finish: number;
  /** Retorno = Fin − Llegada. */
  turnaround: number;
  /** Espera = Retorno − Ráfaga. */
  wait: number;
  /** Respuesta = Primer inicio − Llegada. */
  response: number;
}

export interface SimulationResult {
  algorithm: AlgorithmId;
  steps: SimulationStep[];
  gantt: GanttBlock[];
  processes: ProcessMetrics[];
  averages: {
    turnaround: number;
    wait: number;
    response: number;
  };
  busyTime: number;
  idleTime: number;
  totalTime: number;
  utilization: number;
  contextSwitches: number;
  warnings: string[];
}
