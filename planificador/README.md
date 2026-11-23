# CPU Lab — Planificación de procesos

Simulador local de Sistemas Operativos: FIFO/FCFS, SJF no expropiativo y SRTF.
TypeScript en modo `strict`, React, Vite y Vitest. No necesita servidor de datos.

## Instalación y ejecución

Requisito: Node.js 22 o 24 con npm. Verificado con Node 24.22.1.
Desde la carpeta `planificador`:

```sh
npm ci
npm run dev
```

Abrir la dirección que imprime Vite, normalmente `http://127.0.0.1:5173/`.
En PowerShell, si la política de scripts impide usar `npm`, utilizar `npm.cmd`.
Los cambios de código se reflejan automáticamente.

```sh
npm test
npm run test:watch
npm run build
npm run preview
```

`npm test` ejecuta y termina. `test:watch` permanece observando cambios.
`build` verifica TypeScript y genera `dist/`. `preview` sirve esa compilación.
Para ejecutar solo los seis ejercicios:

```sh
npm test -- src/core/exercises.test.ts
```

No abrir `index.html` con doble clic: la aplicación necesita el servidor de Vite.
`node_modules/` y `dist/` son generados; no forman parte del código fuente del ZIP.
`package-lock.json` fija las versiones instaladas para reproducir `npm ci`.

## Estructura completa del código fuente

```text
planificador/
├── .gitignore
├── README.md
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── core/
    │   ├── types.ts
    │   ├── validation.ts
    │   ├── simulate.ts
    │   ├── simulate.test.ts
    │   ├── edge-cases.test.ts
    │   ├── exercises.ts
    │   └── exercises.test.ts
    └── ui/
        ├── App.tsx
        ├── Simulator.tsx
        ├── Gantt.tsx
        ├── model.ts
        └── styles.css
```

## Arquitectura

- `core/types.ts`: contratos de procesos, estados, intervalos y métricas.
- `core/validation.ts`: validación compartida por interfaz y motor.
- `core/simulate.ts`: función pura `simulate(processes, algorithm)`, sin React,
  DOM, temporizadores ni estado global mutable. Devuelve el Gantt, todos los
  pasos, métricas, promedios y advertencias. No modifica los procesos recibidos.
- `core/exercises.ts`: las seis cargas solicitadas, en orden de tabla A–E.
- `ui/App.tsx`: tabla editable, validación, carga de ejemplos y algoritmo.
- `ui/Simulator.tsx`: reproducción, CPU, cola, estados, métricas y comparación.
- `ui/Gantt.tsx`: Gantt a escala configurable con desplazamiento horizontal.
- `ui/model.ts`: textos, colores y carga de demostración.
- `src/main.tsx`: punto de entrada de React.

Ejemplo de llamada independiente de React:

```ts
import { simulate } from './src/core/simulate';

const result = simulate([
  { id: 'A', name: 'A', arrival: 0, burst: 5, priority: 0 },
  { id: 'B', name: 'B', arrival: 1, burst: 2, priority: 0 },
], 'SRTF');

console.log(result.timeline);
// A [0,1), B [1,3), A [3,7)
```

## Semántica exacta

1. La simulación comienza en `t = 0`. El Gantt incluye ociosidad inicial e
   intermedia. Termina cuando han finalizado todos los procesos, incluyendo
   los de ráfaga cero que lleguen en el futuro.
2. En cada `t`: llegadas, evaluación de expropiación, despacho y ejecución de
   una unidad `[t, t + 1)`. Una finalización de la unidad anterior ya es visible
   al comenzar `t`.
3. FCFS elige el primero en la cola. Las llegadas simultáneas se incorporan
   según el orden de la tabla.
4. SJF elige por ráfaga, llegada y orden de tabla; nunca expropia.
5. SRTF elige por restante, llegada y orden de tabla. Solo expropia cuando
   existe un listo con restante estrictamente menor; un empate no expropia.
6. La selección no ordena la cola visible. El expropiado se agrega al final,
   después de las llegadas del instante. El despachado sale de la cola.
7. Ráfaga cero: termina al llegar, no ingresa a listos y no aparece en Gantt.
   En el motor, `firstStart = finish = arrival` por convención; respuesta,
   espera y retorno son cero. La interfaz muestra `—` en inicio y última unidad
   porque no hubo ejecución; muestra la llegada como finalización y advierte.
8. El último snapshot es terminal: no ejecuta ninguna unidad. Los anteriores
   muestran el estado después del despacho y antes de ejecutar. Su `remaining`
   es el restante antes de consumir esa unidad.
9. La prioridad se valida y se conserva, pero no interviene en estos algoritmos.

## Métricas y límites de intervalos

El campo `finish` del motor es el instante de **finalización exclusivo**.
Para los ejercicios pedidos:

- Inicio: `firstStart` (primera unidad ejecutada).
- Fin: `finish - 1` (última unidad ejecutada, solo para ráfaga positiva).
- Finalización: `finish = Fin + 1`.
- Tiempo en el sistema / retorno: `finish - arrival`.
- Espera: `finish - arrival - burst`.
- Respuesta: `firstStart - arrival`.
- Sistema también se comprueba como `waiting + burst`.

Los promedios incluyen todos los procesos, incluso los de ráfaga cero.
La carga vacía tiene promedios cero.

La utilización es ocupado / total (fracción entre 0 y 1 en el motor; porcentaje
en la interfaz). Para horizonte cero se define como cero para evitar `NaN`.
El tiempo ocupado es la suma de las ráfagas y ocioso = total − ocupado.

**Cambios de contexto:** se cuentan solo transiciones directas de un proceso
a otro distinto en unidades consecutivas. No cuentan el primer despacho,
las transiciones desde/hacia ociosidad ni la finalización final. Se asume
costo temporal de despacho y cambio de contexto igual a cero.

## Validación y uso

Nombres únicos de 1 a 24 caracteres; identificadores únicos no vacíos;
llegada, ráfaga y prioridad deben ser enteros seguros no negativos. Un campo
numérico vacío es inválido. La interfaz no calcula resultados con errores.

Se admiten hasta 100 procesos y `máxima llegada + suma de ráfagas ≤ 10000`.
Es un límite conservador y explícito para acotar los snapshots almacenados.
El motor procesa una unidad a la vez; su costo y memoria son O(T × N), donde
T es el horizonte y N la cantidad de procesos. La comparación calcula los
tres algoritmos para la misma carga.

Los datos se mantienen en memoria durante la sesión; recargar restaura el
ejemplo. Editar la carga o cambiar el algoritmo reinicia la reproducción.
El selector «Ejercicios» carga cualquiera de las seis cargas y su algoritmo.

## Verificación realizada

`npm test`: **51 pruebas pasan**, en tres archivos.

- 41 pruebas generales: FCFS, SJF, SRTF, orden de llegadas, expropiación,
  desempates, orden de cola, métricas, ociosidad, carga vacía, ráfaga cero,
  validación, inmutabilidad y determinismo. Incluyen comprobaciones de
  invariantes sobre 60 cargas por algoritmo.
- 6 pruebas de regresión, una por ejercicio, con valores esperados escritos
  independientemente del motor: intervalos del Gantt, las seis columnas,
  ambos promedios, ociosidad, utilización y cambios de contexto.
- 4 pruebas adicionales con los casos límite solicitados: ociosidad entre
  8 y 10, llegadas simultáneas, empate SRTF en t = 2 y ráfaga cero.

`npm run build`: comprobación de tipos y compilación de producción.
Revisión visual en navegador: Gantt, carga de ejercicio, avance de pasos y
expropiación SRTF con retorno del proceso desplazado a la cola.
