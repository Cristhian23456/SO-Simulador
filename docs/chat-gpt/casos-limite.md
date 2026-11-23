# Casos límite verificados

Todos los intervalos del Gantt son [inicio, finalización). Fin inclusivo es finalización − 1 para ráfagas positivas.

## 1. FIFO: P1(0,4), P2(1,3), P3(2,1), P4(10,2)

Gantt: P1 [0,4), P2 [4,7), P3 [7,8), OCIOSA [8,10), P4 [10,12).

En t = 8 y t = 9, la CPU está ociosa y la cola vacía. P1, P2 y P3 están terminados; P4 sigue pendiente. P4 llega y se despacha en t = 10.
CPU ociosa: 2 unidades. Utilización: 10/12 = 83,33 %.

## 2. FIFO: P1(0,3), P2(0,2), P3(0,1)

Gantt: P1 [0,3), P2 [3,5), P3 [5,6).

Las llegadas simultáneas respetan el orden de tabla P1, P2, P3. Después del despacho en t = 0, CPU = P1 y cola = [P2, P3]. No hay ociosidad.

## 3. SRTF: P1(0,6), P2(1,2), P3(2,1), P4(3,3)

Gantt: P1 [0,1), P2 [1,3), P3 [3,4), P4 [4,7), P1 [7,12).

En t = 1, P2 expropia a P1 porque 2 < 5. En t = 2, P2 y P3 tienen restante 1: NO se expropia. CPU = P2 y cola = [P1, P3].
En t = 3, P2 termina, llega P4 y se despacha P3. La cola queda [P1, P4].

## 4. FIFO: P1(0,0), P2(1,2)

Gantt: OCIOSA [0,1), P2 [1,3).

P1 termina al llegar en t = 0, no ingresa a la cola ni aparece en el Gantt. Se muestra la advertencia de ráfaga cero. Su finalización, espera, retorno y respuesta son 0.
La interfaz muestra «—» en inicio y última unidad ejecutada: no hubo ejecución. El motor registra firstStart = finish = arrival por convención. No se asigna una última unidad −1.

## Pruebas

Los cuatro casos tienen aserciones de Gantt y estados en `planificador/src/core/edge-cases.test.ts`.
