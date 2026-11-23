# Simulador de planificación de procesos — SO · UTPL

## Versión de la rama `chat-gpt`

La implementación creada en esta conversación está en **[planificador/](planificador/README.md)**.
Incluye React + Vite + TypeScript strict, motor independiente en `src/core/`,
interfaz en `src/ui/`, FCFS, SJF y SRTF, reproducción, Gantt y comparación.
El proyecto original de la raíz se conserva.

```sh
cd planificador
npm ci
npm test
npm run dev
```

- [Seis ejercicios resueltos](docs/chat-gpt/ejercicios-resueltos.md).
- [Cuatro casos límite verificados](docs/chat-gpt/casos-limite.md).
- [Código completo de cada archivo](docs/chat-gpt/CODIGO-COMPLETO.txt).
- [Proyecto descargable](docs/chat-gpt/planificador.zip).
- [Vista del Gantt SJF 3](docs/chat-gpt/vista-sjf3.jpg).

La versión `planificador/` tiene 51 pruebas: 41 generales, 6 ejercicios y 4 casos límite.
Sus convenciones específicas, incluido el conteo de cambios de contexto, están
documentadas en su propio README. El resto de este documento describe el proyecto original.

---

Simulador interactivo y comparativo de algoritmos de planificación de CPU.
**Hito 1:** FIFO (FCFS) y SJF (no expropiativo + variante expropiativa SRTF).
**Hito 2 (pendiente):** Round Robin con quantum configurable, Prioridades e integración comparativa.

## Stack

| Capa | Herramienta | Por qué |
|---|---|---|
| Lenguaje | TypeScript (modo `strict`) | Los tipos detectan errores que la IA suele introducir (campos mal escritos, `undefined`, mezcla de unidades). |
| Motor | TypeScript puro en `src/core/` | Sin dependencias de UI → se prueba de forma aislada y se reutiliza en el Hito 2. |
| Interfaz | React 19 + Vite | Corre en cualquier navegador; sin instalación para el docente. |
| Pruebas | Vitest | Pruebas unitarias rápidas, misma sintaxis que Jest. |
| Gantt | HTML/CSS propio (sin librería de gráficos) | Control total de la fidelidad: escala proporcional y CPU ociosa siempre visible. |
| Publicación | GitHub Pages + GitHub Actions | Gratuito; cada `push` a `main` ejecuta pruebas y publica. |

## Uso

```bash
npm install
npm run dev        # servidor local en http://localhost:5173
npm test           # pruebas unitarias del motor
npm run build      # build de producción en dist/
```

## Estructura

```
src/
  core/                 ← motor (no depende de React)
    types.ts            modelo de datos y resultados
    policies.ts         FIFO, SJF, SRTF (reglas de selección y desempate)
    engine.ts           simulación por ticks, Gantt, métricas
    validation.ts       validación de entrada
    presets.ts          escenarios de referencia y casos límite
    __tests__/          pruebas unitarias
  ui/                   ← componentes de interfaz
    ProcessEditor.tsx   tabla de procesos (llegada, ráfaga, prioridad)
    Gantt.tsx           diagrama de Gantt a escala
    StatePanel.tsx      CPU, cola de listos y estados en el instante t
    Metrics.tsx         métricas por proceso y comparación entre algoritmos
  App.tsx
docs/
  BITACORA_PROMPTS.md   registro obligatorio de prompts
  REGISTRO_DEFECTOS.md  defectos de la IA (tipo, gravedad, corrección, fundamento)
  CAMBIOS.md            resúmenes "qué cambió y por qué" + "conceptos aplicados"
```

## Convenciones de simulación (contrato del motor)

Estas reglas son la referencia para auditar el código generado por IA. Si un resultado las contradice, es un defecto.

1. **Tiempo discreto entero** y la simulación **inicia en t = 0** (el hueco previo a la primera llegada cuenta como CPU ociosa).
2. **Orden en cada instante t:** (a) llegadas en t entran a la cola de listos; (b) evaluación de expropiación (solo SRTF); (c) despacho si la CPU está libre; (d) se ejecuta una unidad.
3. **Desempates:**
   - FIFO: orden de entrada a la cola; si llegan en el mismo instante, orden de la tabla.
   - SJF: menor ráfaga → menor llegada → orden de la tabla.
   - SRTF: menor restante → menor llegada → orden de la tabla. **En empate no se expropia.**
4. **Ráfaga nula:** el proceso termina en su instante de llegada, no ocupa la CPU, no aparece en el Gantt; espera, retorno y respuesta = 0. Se muestra una advertencia.
5. **Métricas:**
   - Retorno = Fin − Llegada
   - Espera = Retorno − Ráfaga
   - Respuesta = Primer inicio − Llegada
   - CPU ociosa = ticks sin proceso en [0, tiempo total)
   - Utilización = tiempo ocupado / tiempo total
   - Cambios de contexto = despachos − 1
6. La **cola de listos** se muestra en orden de llegada a la cola y **no incluye** al proceso en ejecución.

## Validación incluida

- Casos de referencia de Silberschatz et al. (2018, cap. 5): efecto convoy (FIFO 17 / SJF 3), SJF con espera media 7, SRTF con espera media 6.5.
- Casos límite: CPU ociosa, llegadas simultáneas, empates de ráfaga, empate sin expropiación, ráfaga nula, todos con ráfaga nula.
- 200 escenarios aleatorios que verifican invariantes: `ocupado + ocioso = total`, `retorno = espera + ráfaga`, `respuesta ≤ espera`, nadie se ejecuta antes de llegar, y los algoritmos no expropiativos dan un solo tramo por proceso.

## Referencias

- Silberschatz, A., Galvin, P. B., & Gagne, G. (2018). *Operating System Concepts* (10.ª ed.), cap. 5.
- Tanenbaum, A. S., & Bos, H. (2015). *Modern Operating Systems* (4.ª ed.), cap. 2.
