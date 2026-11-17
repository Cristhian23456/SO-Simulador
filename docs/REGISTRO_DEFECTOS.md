# Registro de defectos generados por IA

## Clasificación

**Tipo**
- `LOG` Lógica del algoritmo (selección, desempate, expropiación)
- `MET` Cálculo de métricas
- `TMP` Manejo del tiempo (ocio de CPU, llegadas, orden de eventos)
- `ENT` Validación de entrada / casos límite
- `VIS` Fidelidad visual (Gantt, estados, cola de listos)
- `USA` Usabilidad / accesibilidad

**Gravedad**
- **Crítica:** resultado incorrecto que el usuario no puede detectar (métrica o Gantt equivocado).
- **Alta:** el simulador falla o se bloquea con una entrada válida.
- **Media:** representación engañosa o incompleta, pero los números son correctos.
- **Baja:** estilo, textos, detalles de usabilidad.

## Registro

| ID | Fecha | Tipo | Gravedad | Algoritmo | Descripción del defecto | Caso que lo revela | Corrección aplicada | Fundamento teórico (Silberschatz / Tanenbaum) | Prompt de origen (#) |
|---|---|---|---|---|---|---|---|---|---|
| D-01 | | | | | | | | | |

## Defectos típicos a buscar (lista de verificación)

- [ ] FIFO ordena por PID o por ráfaga en lugar de por llegada.
- [ ] SJF elige entre **todos** los procesos y no solo entre los que **ya llegaron**.
- [ ] El Gantt omite la CPU ociosa o "comprime" el tiempo (anchos no proporcionales).
- [ ] Tiempo de espera calculado como `inicio − llegada` (solo vale en no expropiativos; falla en SRTF).
- [ ] Respuesta confundida con espera.
- [ ] Empates resueltos de forma no determinista (depende del orden interno de un `sort`).
- [ ] SRTF expropia en empate (cambios de contexto innecesarios).
- [ ] Ráfaga 0 produce división por cero, bucle infinito o un tramo de ancho 0 en el Gantt.
- [ ] La cola de listos incluye al proceso que está en ejecución.
- [ ] Promedios con redondeo prematuro (redondear solo al mostrar).
