# Resultados de los seis ejercicios

Ejecutados con src/core/simulate.ts. SJF es no expropiativo.

Los Gantt usan límites [inicio, finalización). Fin es la última unidad ocupada: Finalización − 1. Todas las unidades son enteras.

## FIFO 1

A(10, 3), B(0, 6), C(2, 4), D(8, 6), E(7, 1)

```text
|        B         |     C      | E |        D         |    A    |
0                  6            10  11                 17        20
```

| Proceso | Inicio | Fin | Espera | Sistema (espera + ráfaga) | Finalización (Fin + 1) | Sistema (Finalización − Llegada) |
|---|---:|---:|---:|---:|---:|---:|
| A | 17 | 19 | 7 | 10 | 20 | 10 |
| B | 0 | 5 | 0 | 6 | 6 | 6 |
| C | 6 | 9 | 4 | 8 | 10 | 8 |
| D | 11 | 16 | 3 | 9 | 17 | 9 |
| E | 10 | 10 | 3 | 4 | 11 | 4 |

**Espera promedio: 3,4 u. Tiempo en el sistema promedio: 7,4 u.**

## FIFO 2

A(10, 3), B(2, 4), C(6, 6), D(0, 7), E(7, 1)

```text
|          D          |     B      |        C         | E |    A    |
0                     7            11                 17  18        21
```

| Proceso | Inicio | Fin | Espera | Sistema (espera + ráfaga) | Finalización (Fin + 1) | Sistema (Finalización − Llegada) |
|---|---:|---:|---:|---:|---:|---:|
| A | 18 | 20 | 8 | 11 | 21 | 11 |
| B | 7 | 10 | 5 | 9 | 11 | 9 |
| C | 11 | 16 | 5 | 11 | 17 | 11 |
| D | 0 | 6 | 0 | 7 | 7 | 7 |
| E | 17 | 17 | 10 | 11 | 18 | 11 |

**Espera promedio: 5,6 u. Tiempo en el sistema promedio: 9,8 u.**

## FIFO 3

A(5, 3), B(0, 6), C(2, 4), D(9, 6), E(4, 1)

```text
|        B         |     C      | E |    A    |        D         |
0                  6            10  11        14                 20
```

| Proceso | Inicio | Fin | Espera | Sistema (espera + ráfaga) | Finalización (Fin + 1) | Sistema (Finalización − Llegada) |
|---|---:|---:|---:|---:|---:|---:|
| A | 11 | 13 | 6 | 9 | 14 | 9 |
| B | 0 | 5 | 0 | 6 | 6 | 6 |
| C | 6 | 9 | 4 | 8 | 10 | 8 |
| D | 14 | 19 | 5 | 11 | 20 | 11 |
| E | 10 | 10 | 6 | 7 | 11 | 7 |

**Espera promedio: 4,2 u. Tiempo en el sistema promedio: 8,2 u.**

## SJF 1

A(9, 4), B(0, 9), C(2, 6), D(0, 4), E(6, 1)

```text
|     D      |        C         | E |     A      |             B             |
0            4                  10  11           15                          24
```

| Proceso | Inicio | Fin | Espera | Sistema (espera + ráfaga) | Finalización (Fin + 1) | Sistema (Finalización − Llegada) |
|---|---:|---:|---:|---:|---:|---:|
| A | 11 | 14 | 2 | 6 | 15 | 6 |
| B | 15 | 23 | 15 | 24 | 24 | 24 |
| C | 4 | 9 | 2 | 8 | 10 | 8 |
| D | 0 | 3 | 0 | 4 | 4 | 4 |
| E | 10 | 10 | 4 | 5 | 11 | 5 |

**Espera promedio: 4,6 u. Tiempo en el sistema promedio: 9,4 u.**

## SJF 2

A(7, 4), B(0, 9), C(2, 6), D(1, 4), E(8, 1)

```text
|             B             | E |     D      |     A      |        C         |
0                           9   10           14           18                 24
```

| Proceso | Inicio | Fin | Espera | Sistema (espera + ráfaga) | Finalización (Fin + 1) | Sistema (Finalización − Llegada) |
|---|---:|---:|---:|---:|---:|---:|
| A | 14 | 17 | 7 | 11 | 18 | 11 |
| B | 0 | 8 | 0 | 9 | 9 | 9 |
| C | 18 | 23 | 16 | 22 | 24 | 22 |
| D | 10 | 13 | 9 | 13 | 14 | 13 |
| E | 9 | 9 | 1 | 2 | 10 | 2 |

**Espera promedio: 6,6 u. Tiempo en el sistema promedio: 11,4 u.**

## SJF 3

A(3, 4), B(7, 8), C(0, 10), D(9, 4), E(0, 5)

```text
|       E       |     A      |     D      |           B            |              C               |
0               5            9            13                       21                             31
```

| Proceso | Inicio | Fin | Espera | Sistema (espera + ráfaga) | Finalización (Fin + 1) | Sistema (Finalización − Llegada) |
|---|---:|---:|---:|---:|---:|---:|
| A | 5 | 8 | 2 | 6 | 9 | 6 |
| B | 13 | 20 | 6 | 14 | 21 | 14 |
| C | 21 | 30 | 21 | 31 | 31 | 31 |
| D | 9 | 12 | 0 | 4 | 13 | 4 |
| E | 0 | 4 | 0 | 5 | 5 | 5 |

**Espera promedio: 5,8 u. Tiempo en el sistema promedio: 12 u.**

En los seis ejercicios: CPU ociosa = 0, utilización = 100 %, cambios de contexto = 4.
