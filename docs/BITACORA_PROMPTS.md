# Bitácora de prompts

> Uso ético: solo versiones gratuitas o institucionales; **no ingresar datos personales** (nombres, cédulas, correos) en los prompts.
> Registrar **todos** los prompts, incluso los que produjeron resultados incorrectos: son evidencia para el informe de validación.

| # | Fecha | Integrante | Herramienta / versión | Objetivo | Prompt (texto exacto o resumen fiel) | Resultado | ¿Aceptado? | Verificación realizada | Defecto asociado |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-15 | (iniciales) | Claude (Anthropic) | Definir stack y arquitectura del simulador | "Aún no se define stack, ayúdanos, queremos un simulador potente… establezcamos los puntos importantes para comenzar y entregar el hito 1" | Stack TS + React + Vite + Vitest; motor FIFO/SJF/SRTF; interfaz con Gantt, cola de listos y métricas | Sí, tras revisión | `npm test` (216 pruebas), comparación con ejemplos de Silberschatz cap. 5 | — |
| 2 | | | | | | | | | |

## Cómo llenar cada columna

- **Objetivo:** qué se pedía (p. ej., "implementar desempate en SJF").
- **Resultado:** qué devolvió la IA, en una línea.
- **¿Aceptado?:** Sí / Parcial / No.
- **Verificación realizada:** prueba unitaria, caso del docente, revisión manual del Gantt, etc.
- **Defecto asociado:** ID del registro de defectos (D-01, D-02…), si aplica.
