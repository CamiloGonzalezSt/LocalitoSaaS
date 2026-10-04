# Sprint Backlog de Localito

# Resumen ejecutivo

El Sprint Backlog describe el trabajo de una iteración y su relación con el Sprint Goal. Localito mantiene Sprints 1 a 3 cerrados, con una excepción documental en el tercero, y Sprint 4 en curso entre el 28 de septiembre y el 09 de octubre de 2026. Los Sprints 5 a 8 no tienen historias comprometidas en el corte del 03 de octubre.

Este documento conserva las asignaciones y fechas de la fuente Backlog-Scrum-Trello.md. La consulta actual no ejecutó cambios ni una revisión en vivo de Trello; los estados se presentan como la evidencia documental del repositorio en el commit base [P]. Se agregan criterios y procedimientos de seguimiento para mejorar su uso académico.

# Introducción y estructura del plan

La Guía Scrum relaciona objetivo, elementos seleccionados y plan de entrega en el Sprint Backlog [R6]. Para Localito, el objetivo del Sprint 4 integra POS y caja y completa el pendiente offline. La tarea de documentar ese trabajo incluye mostrar qué está hecho, qué se desarrolla y qué todavía necesita pruebas.

El plan se distingue de una lista de funcionalidades del código. Puede existir una implementación inicial de pagos y caja que todavía no ha cumplido DoD en su tarjeta. Por eso la evidencia técnica se describe junto con el estado Scrum, sin elevar automáticamente todas las capacidades del repositorio a trabajo aceptado.

# Criterios de selección y dependencia

Para atender una venta, identidad y catálogo deben existir. Para una venta fiada, se necesita cliente y regla de crédito. Para cerrar caja, se requiere revisar movimientos y pendientes. Estas relaciones permiten planificar tareas en un orden que reduzca retrabajo. Si una dependencia no está lista, el equipo debe renegociar el alcance de la historia o mantenerla pendiente.

HU-13 atraviesa frontend y backend: conserva la venta, mantiene la clave y sincroniza. HU-14 depende de catálogo y persistencia. HU-15 necesita un total consistente antes de aplicar descuento. HU-16 requiere cuadrar la suma de pagos. HU-17 y HU-18 relacionan operaciones con el turno. Su coordinación es más útil que tratar cada pantalla como un resultado independiente.

# Seguimiento y criterios de cierre

Un elemento pasa a Hecho cuando cumple sus criterios y la DoD. La ejecución local de una prueba de cálculo no acredita una prueba de caja en producción. Si se detecta un rechazo de permisos o un estado persistido incoherente, el seguimiento registra el defecto y conserva evidencia. El objetivo del Sprint permite decidir qué reparar primero.

El cierre del Sprint debe conservar resultado de Review, trabajo pendiente y acciones de retrospectiva. Las fechas objetivo no deben transformarse en fechas reales de término si no existe una evidencia. Las actividades futuras siguen como futuras; registrar una fecha de retrospectiva no significa que el evento ya ocurrió.

# Product Backlog y evidencia Trello — Localito

**Corte verificado:** 03-10-2026  
**Herramienta activa:** Trello  
**Marco de trabajo:** Scrum  
**Workspace:** Localito Saas

## 1. Equipo Scrum

| Integrante | Rol | Responsabilidad principal |
| --- | --- | --- |
| Alexander Patiño | Product Owner | Ordenar el Product Backlog, priorizar valor y validar criterios de aceptación. |
| Samuel Solís | Scrum Master | Facilitar Scrum, seguimiento, impedimentos y mejora continua. |
| Camilo González | Developer | Implementación, integración, pruebas técnicas y soporte documental. |

Los miembros ya se encuentran asignados realmente a las tarjetas correspondientes en Trello. La línea “Agregar como miembro” se conserva en algunas descripciones como guía histórica, pero la asignación real del tablero es la referencia operativa.

## 2. Product Goal

Entregar una **PWA SaaS para almacenes y minimarkets** que permita gestionar ventas, inventario, clientes, caja, compras y reportes desde una interfaz simple, usable y segura.

El Product Backlog se ordena por valor, riesgo y dependencia. Un elemento pasa a un Sprint únicamente durante el **Sprint Planning**.

## 3. Definition of Done

Un Product Backlog Item se considera **Hecho** cuando:

- cumple sus criterios de aceptación;
- la funcionalidad está integrada y usable;
- las pruebas necesarias se ejecutaron satisfactoriamente;
- no quedan defectos críticos conocidos que invaliden el resultado;
- permisos y seguridad fueron revisados cuando corresponde;
- responsive/PWA fue revisado cuando corresponde;
- la documentación afectada fue actualizada;
- el incremento puede demostrarse en Sprint Review.

## 4. Product Backlog vigente

Al 03-10-2026 el tablero **00 · Product Backlog · Localito** contiene 24 tarjetas: Product Goal, Definition of Done y 22 elementos todavía no comprometidos a un Sprint.

| ID | Elemento | Responsable actual | Estado |
| --- | --- | --- | --- |
| HU-19 | Registrar clientes | Alexander | Product Backlog |
| HU-20 | Registrar ventas fiadas | Alexander | Product Backlog |
| HU-21 | Registrar abonos y pagos de deuda | Alexander | Product Backlog |
| HU-22 | Consultar saldo y estado de cuenta | Alexander | Product Backlog |
| HU-23 | Gestionar devoluciones y anulaciones | Alexander | Product Backlog |
| HU-24 | Auditar movimientos sensibles | Alexander | Product Backlog |
| HU-25 | Gestionar proveedores | Alexander | Product Backlog |
| HU-26 | Crear órdenes de compra | Alexander | Product Backlog |
| HU-27 | Recepcionar mercadería | Alexander | Product Backlog |
| HU-28 | Actualizar inventario desde recepción | Alexander | Product Backlog |
| HU-29 | Importar datos mediante CSV | Alexander | Product Backlog |
| HU-30 | Visualizar dashboard general | Alexander | Product Backlog |
| HU-31 | Consultar reportes de ventas | Alexander | Product Backlog |
| HU-32 | Consultar reportes de inventario | Alexander | Product Backlog |
| HU-33 | Utilizar apoyo de IA visual | Alexander | Product Backlog / sujeto a validación de alcance |
| ET-03 | Mejorar experiencia responsive | Camilo | Product Backlog |
| ET-04 | Fortalecer autorización y seguridad | Camilo | Product Backlog |
| ET-05 | Preparar Release Candidate | Camilo | Product Backlog |
| ET-06 | Ejecutar validación integral | Camilo | Product Backlog |
| ET-07 | Ejecutar UAT con Product Owner | Alexander | Product Backlog |
| DOC-01 | Preparar documentación de entrega | Samuel | Product Backlog |
| REL-01 | Desplegar versión final | Camilo | Product Backlog |

## 5. Sprint 1 — cerrado

**Periodo:** 17-08-2026 al 28-08-2026.  
**Sprint Goal:** establecer la base técnica de Localito incorporando autenticación, autorización y aislamiento por negocio.

| ID / actividad | Responsable | Estado Trello | Fecha |
| --- | --- | --- | --- |
| ET-01 · Establecer base técnica del producto | Camilo | Hecho | 21-08 |
| HU-01 · Autenticarse en Localito | Camilo | Hecho | 24-08 |
| HU-02 · Gestionar roles y permisos | Camilo | Hecho | 25-08 |
| HU-03 · Aislar datos por negocio | Camilo | Hecho | 26-08 |
| Sprint Planning | Alexander | Hecho | 17-08 |
| Daily Scrum | Samuel | Hecho | 18–27-08 |
| Refinamiento | Alexander | Hecho | 25-08 |
| Sprint Review | Alexander | Hecho | 28-08 |
| Sprint Retrospective | Samuel | Hecho | 28-08 |

## 6. Sprint 2 — cerrado

**Periodo:** 31-08-2026 al 11-09-2026.  
**Sprint Goal:** incorporar administración del negocio, usuarios, categorías, productos y stock inicial para disponer de una base operativa de inventario.

| ID / actividad | Responsable | Estado Trello | Fecha |
| --- | --- | --- | --- |
| HU-04 · Gestionar negocio y local | Camilo | Hecho | 02-09 |
| HU-05 · Administrar usuarios | Camilo | Hecho | 03-09 |
| HU-06 · Gestionar categorías de productos | Camilo | Hecho | 04-09 |
| HU-07 · Gestionar catálogo de productos | Camilo | Hecho | 07-09 |
| HU-08 · Registrar stock inicial | Camilo | Hecho | 08-09 |
| ET-02 · Adaptar interfaces del módulo a responsive | Camilo | Hecho | 09-09 |
| Sprint Planning | Alexander | Hecho | 31-08 |
| Daily Scrum | Samuel | Hecho | 01–10-09 |
| Refinamiento | Alexander | Hecho | 08-09 |
| Sprint Review | Alexander | Hecho | 11-09 |
| Sprint Retrospective | Samuel | Hecho | 11-09 |

## 7. Sprint 3 — cerrado con excepción documental

**Periodo:** 14-09-2026 al 25-09-2026.  
**Sprint Goal:** mejorar el control de inventario incorporando trazabilidad, alertas, código de barras y capacidades de operación PWA.

| ID / actividad | Responsable | Estado Trello | Fecha |
| --- | --- | --- | --- |
| HU-09 · Registrar movimientos de stock | Camilo | Hecho | 16-09 |
| HU-10 · Consultar Kardex y trazabilidad | Camilo | Hecho | 17-09 |
| HU-11 · Recibir alertas de stock bajo | Camilo | Hecho | 21-09 |
| HU-12 · Utilizar código de barras | Camilo | Hecho | 22-09 |
| Sprint Planning | Alexander | Hecho | 14-09 |
| Daily Scrum | Samuel | Hecho | 15–24-09 |
| Refinamiento del Product Backlog | Sin asignación real | **Por hacer** | 22-09 |
| Sprint Review | Alexander | Hecho | 25-09 |
| Sprint Retrospective | Samuel | Hecho | 25-09 |

**Excepción:** el refinamiento conserva una descripción histórica que propone a Alexander como responsable, pero la tarjeta real está sin miembro y en “Por hacer”. No se marca como completada porque falta evidencia suficiente de su cierre.

La Sprint Review registra además que el trabajo de operación offline/sincronización **no cumplió Definition of Done** y continuó en el Sprint siguiente.

## 8. Sprint 4 — en curso

**Periodo:** 28-09-2026 al 09-10-2026.  
**Sprint Goal:** implementar el flujo de ventas POS y caja, incluyendo descuentos, pagos divididos y control de caja, completando además el trabajo pendiente de sincronización offline.

### Sprint Backlog

| ID | Elemento | Responsable | Lista Trello | Fecha objetivo |
| --- | --- | --- | --- | --- |
| HU-13 | Operar offline y sincronizar cambios | Camilo | En progreso | 09-10 |
| HU-14 | Registrar una venta en el POS | Camilo | Hecho | 01-10 |
| HU-15 | Aplicar descuentos en una venta | Alexander | Hecho | 02-10 |
| HU-16 | Gestionar medios y pagos divididos | Camilo | Por hacer | 05-10 |
| HU-17 | Abrir caja por turno | Camilo | Por hacer | 06-10 |
| HU-18 | Cerrar y cuadrar caja | Camilo | Por hacer | 07-10 |

### Eventos y actividades

| Actividad | Responsable | Lista Trello | Fecha objetivo |
| --- | --- | --- | --- |
| Sprint Planning | Alexander | Hecho | 28-09 |
| Daily Scrum | Samuel | En progreso | 08-10 |
| Refinamiento del Product Backlog | Alexander | En progreso | 06-10 |
| Sprint Review | Alexander | Por hacer | 09-10 |
| Sprint Retrospective | Samuel | Por hacer | 09-10 |

## 9. Sprints 5–8 — futuros

Los tableros Sprint 5, 6, 7 y 8 contienen **exactamente cinco tarjetas estructurales cada uno**:

1. Sprint Planning — Alexander.
2. Daily Scrum — Samuel.
3. Refinamiento del Product Backlog — Alexander.
4. Sprint Review — Alexander.
5. Sprint Retrospective — Samuel.

**No contienen Historias de Usuario.** Esto es intencional: las HU se incorporarán únicamente cuando ocurra el Sprint Planning correspondiente.

## 10. Etiquetas y trazabilidad

Uso actual observado:

- verde: Historia de Usuario / producto;
- azul: elemento técnico;
- naranja: QA, validación, documentación o release;
- morado: evento Scrum / Product Goal;
- amarillo: refinamiento.

La trazabilidad documental vigente es:

**Requisito → HU/PBI → tarjeta Trello / Sprint → commit → prueba → evidencia**

Para los enlaces directos de cada tablero consulte [TRELLO_BOARDS.md](https://github.com/CamiloGonzalezSt/LocalitoSaaS/blob/05a6f34b749cdc97dd560d91bb9be057a1197fbf/docs/02_gestion_scrum_trello/TRELLO_BOARDS.md).


# Planificación de Sprints — Localito

**Corte verificado en Trello:** 03-10-2026.

| Sprint | Inicio | Fin | Estado real | Sprint Goal / criterio |
| --- | --- | --- | --- | --- |
| Sprint 0 | 10-08-2026 | 14-08-2026 | Cerrado / preparación | Preparación del proyecto, definición inicial y organización técnica. |
| Sprint 1 | 17-08-2026 | 28-08-2026 | Cerrado | Base técnica, autenticación, autorización y aislamiento por negocio. |
| Sprint 2 | 31-08-2026 | 11-09-2026 | Cerrado | Administración de negocio/usuarios y base operativa de catálogo e inventario. |
| Sprint 3 | 14-09-2026 | 25-09-2026 | Cerrado con excepción documental | Trazabilidad de inventario, alertas, código de barras y capacidades PWA. El refinamiento permanece “Por hacer” por falta de evidencia de cierre; offline/sync se replanificó. |
| Sprint 4 | 28-09-2026 | 09-10-2026 | **En curso** | POS y caja: ventas, descuentos, pagos divididos, apertura/cierre de caja y finalización del pendiente offline. |
| Sprint 5 | 12-10-2026 | 23-10-2026 | Futuro | Solo estructura Scrum. HU se seleccionarán durante Planning. |
| Sprint 6 | 26-10-2026 | 06-11-2026 | Futuro | Solo estructura Scrum. HU se seleccionarán durante Planning. |
| Sprint 7 | 09-11-2026 | 20-11-2026 | Futuro | Solo estructura Scrum. HU se seleccionarán durante Planning. |
| Sprint 8 | 23-11-2026 | 04-12-2026 | Futuro | Solo estructura Scrum. HU se seleccionarán durante Planning. |

## Estado del Sprint 4 al 03-10-2026

- **Hecho:** Sprint Planning, HU-14 Registrar una venta en el POS, HU-15 Aplicar descuentos.
- **En progreso:** HU-13 Operar offline y sincronizar cambios, Daily Scrum, Refinamiento.
- **Por hacer:** HU-16 Medios y pagos divididos, HU-17 Apertura de caja, HU-18 Cierre/cuadratura, Sprint Review y Sprint Retrospective.
- **Revisión / QA:** sin tarjetas en este corte.

## Regla para Sprints futuros

La existencia de un tablero futuro **no implica compromiso de alcance**. Sprint 5–8 contienen únicamente eventos/actividades Scrum y no tienen HU asignadas. El Sprint Backlog se define únicamente durante el Planning de la iteración.


# Plan de verificación del Sprint en curso

| Elemento | Comprobación recomendada | Evidencia mínima |
| --- | --- | --- |
| HU13 offline | Cortar red y restaurar sin duplicar | Cola antes y después y venta final |
| HU14 venta POS | Registrar con stock y cliente controlados | Ticket y filas afectadas |
| HU15 descuentos | Probar cero, límite y valor inválido | Total esperado y rechazo |
| HU16 pagos divididos | Cuadrar total y rechazar diferencias | Detalle de pagos y respuesta |
| HU17 apertura | Evitar dos cajas abiertas del negocio | Sesión e índice observado |
| HU18 cierre | Comparar esperado, contado y diferencia | Movimiento y motivo de diferencia |

Los casos se proponen para completar evidencia, sin cambiar estados actuales del tablero. Se recomienda ejecutar sobre una base aislada y registrar la misma clave de venta ante reintentos. Las cuentas y dispositivos del turno deben verificarse antes de cerrar, porque cada cola local pertenece a un contexto distinto.

# Gestión de impedimentos y cambios

Un impedimento debe indicar efecto sobre el objetivo, responsable de seguimiento y siguiente comprobación. Por ejemplo, una falla del proveedor IA no debe detener la venta manual; un error de conexión PostgreSQL sí impide acreditar persistencia. El equipo debe diferenciar esos efectos antes de cambiar prioridades.

Si una historia no completa DoD al cierre, vuelve al backlog con su estado y dependencias. La decisión de incorporar trabajo a la siguiente iteración ocurre en su Planning. La documentación no mantiene una historia simultáneamente cerrada en un Sprint y pendiente en otro sin explicar la parte que se trasladó.

# Conclusiones

El Sprint Backlog conserva una representación verificable del trabajo al corte actual. La separación entre fechas objetivo, estados documentados y pruebas evita presentar un semestre futuro como ejecutado. El cierre del Sprint 4 requerirá evidencia de sus operaciones y resultados de sus eventos finales.

# Referencias y evidencia de la versión

Las referencias externas fundamentan conceptos y organización. La descripción específica de Localito procede del repositorio. Se consultaron fuentes públicas el 03 de octubre de 2026. Las fichas públicas ISO se utilizan para alcance y orientación, sin atribuir acceso al texto normativo completo ni conformidad certificada.

[R6] Schwaber K y Sutherland J 2020. The Scrum Guide. https://scrumguides.org/scrum-guide.html

[P] Equipo Localito. Repositorio LocalitoSaaS. Commit base 05a6f34b749cdc97dd560d91bb9be057a1197fbf. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/05a6f34b749cdc97dd560d91bb9be057a1197fbf

Fuentes internas revisadas: README.md; package.json y manifests de apps; apps/api/src/server.ts, repository.ts y auth.ts; db/schema.sql; apps/web/src/lib/offline.ts y workspaceCache.ts; docs de requisitos, calidad, operación y Scrum. La revisión es documental y estática. No crea resultados de pruebas funcionales, reuniones ni aceptación de usuario.
