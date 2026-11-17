# Registro de cambios (regla anti-deuda técnica)

Cada cambio de código, algoritmo o interfaz agrega **dos resúmenes**: (A) qué cambió y por qué, (B) conceptos técnicos aplicados para estudio.

---

## 2026-11-15 · Base del Hito 1: motor FIFO / SJF / SRTF + interfaz

### A. Qué se modificó y por qué

- **Proyecto creado** con Vite + React + TypeScript `strict` + Vitest. Web para que el docente lo abra sin instalar nada; TypeScript estricto para atrapar errores típicos de código generado por IA.
- **Motor separado de la interfaz** (`src/core/`). Así los algoritmos se prueban sin navegador y el Hito 2 solo agrega políticas nuevas (RR, Prioridades) sin tocar la UI.
- **Simulación por ticks** con un orden fijo de eventos (llegadas → expropiación → despacho → ejecución). Garantiza que la cola de listos y los estados se puedan mostrar en cada instante, y que los empates se resuelvan siempre igual.
- **Políticas como objetos intercambiables** (`select`, `shouldPreempt`). FIFO, SJF y SRTF comparten el mismo motor; solo cambia la regla de elección.
- **Reglas de desempate explícitas y documentadas** en el README, porque son la fuente más común de errores de la IA.
- **Ráfaga nula** tratada como caso especial (termina al llegar, con advertencia) para evitar bucles o tramos de ancho 0.
- **Interfaz:** editor de procesos con validación por celda, escenarios precargados, Gantt a escala con CPU ociosa rayada, reproducción paso a paso, cola de listos, estado de cada proceso, registro de eventos, métricas con fórmula visible y comparación entre algoritmos con la misma carga.
- **216 pruebas unitarias:** casos del libro, casos límite y 200 escenarios aleatorios con invariantes.
- **CI/CD:** GitHub Actions ejecuta pruebas y publica en GitHub Pages.

### B. Conceptos técnicos aplicados

- **FIFO / FCFS:** no expropiativo; la CPU se asigna en el orden de llegada a la cola de listos. Sufre el **efecto convoy**: un proceso largo al frente hace esperar a todos los cortos (Silberschatz, §5.3.1).
- **SJF:** elige la menor ráfaga entre los procesos **listos**. Es **óptimo** en espera media para un conjunto de procesos dados (demostrable por intercambio), pero exige conocer la ráfaga de antemano y puede causar **inanición** de procesos largos (§5.3.2).
- **SRTF (SJF expropiativo):** reevalúa en cada llegada; expulsa al proceso en ejecución si el recién llegado tiene un restante estrictamente menor.
- **Expropiativo vs. no expropiativo:** en el no expropiativo un proceso conserva la CPU hasta terminar (o bloquearse); en el expropiativo el planificador puede retirarla.
- **Métricas:** retorno = fin − llegada; espera = retorno − ráfaga (tiempo total en la cola de listos); respuesta = primer inicio − llegada. En los no expropiativos, respuesta = espera; en SRTF, respuesta ≤ espera.
- **Utilización de CPU y ocio:** la CPU queda ociosa cuando la cola de listos está vacía; la utilización es tiempo ocupado / tiempo total.
- **Cambio de contexto:** guardar el estado del proceso saliente (PCB) y cargar el del entrante; aquí se cuentan los despachos posteriores al primero.
- **Simulación de eventos discretos:** el tiempo avanza en unidades; en cada unidad se aplican los eventos en un orden fijo, lo que hace el resultado **determinista** y reproducible.
- **Pruebas por invariantes (property-based):** en lugar de solo comparar contra resultados conocidos, se verifican propiedades que deben cumplirse para *cualquier* entrada (p. ej., ocupado + ocioso = total).
