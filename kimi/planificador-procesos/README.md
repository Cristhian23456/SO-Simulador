# Simulador de planificación de procesos — Hito 1

Simulador web para la materia de Sistemas Operativos con **FIFO (FCFS)**, **SJF no expropiativo**
y **SJF expropiativo (SRTF)**.

## Stack

- TypeScript en modo **strict** + React 18 + Vite 5.
- Pruebas unitarias con **Vitest**.
- El motor de simulación (`src/core/`) es puro TypeScript: **no depende de React** ni del DOM.
- La interfaz (`src/ui/`) solo consume `simulate()` y `validateProcesses()` de `src/core`.

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm test           # ejecutar las pruebas unitarias una vez
npm run test:watch # ejecutar las pruebas en modo observador
npm run build      # type-check + build de producción
npm run preview    # servir el build de producción
```

## Reglas de simulación implementadas

1. Tiempo discreto entero que inicia en `t = 0`; la CPU ociosa se representa explícitamente.
2. En cada instante `t`, en este orden: **(a)** llegadas a la cola de listos → **(b)** evaluación de
   expropiación (solo SRTF) → **(c)** despacho si la CPU está libre → **(d)** ejecución de una unidad.
3. Desempates: FCFS = orden de entrada a la cola y, a igual llegada, orden de la tabla;
   SJF/SRTF = menor tiempo restante → menor llegada → orden de la tabla. **En empate no se expropia.**
4. Ráfaga 0: el proceso termina al llegar, no aparece en el Gantt, sus tiempos valen 0 y se muestra
   una advertencia.
5. Métricas: Retorno = Fin − Llegada; Espera = Retorno − Ráfaga; Respuesta = Primer inicio − Llegada;
   CPU ociosa; Utilización = ocupado / total; cambios de contexto (la CPU pasa de un proceso a
   **otro distinto**; entrar desde ociosa al inicio no cuenta).
6. La cola de listos se muestra en orden de llegada a la cola y **no** incluye al proceso en ejecución.

## Estructura

```
src/
├── core/                 # Motor: puro TypeScript, sin React
│   ├── types.ts          # Contratos de datos
│   ├── engine.ts         # simulate(): bucle de instantes + métricas + Gantt
│   ├── validate.ts       # validateProcesses(): validación de la tabla
│   ├── index.ts          # API pública del motor
│   └── __tests__/        # Vitest: fcfs, sjf, srtf, validate
└── ui/                   # Componentes React (sin lógica de simulación)
    ├── ProcessTable.tsx  # Tabla editable con validación en línea
    ├── AlgorithmSelector.tsx
    ├── GanttChart.tsx    # Gantt a escala, con CPU ociosa y cursor de instante
    ├── StepPlayer.tsx    # Reproducción paso a paso
    ├── MetricsTable.tsx  # Métricas por proceso y promedios
    ├── ComparisonTable.tsx
    └── palette.ts
```
