# Guía para reunión de equipo — Localito
**Fecha de corte:** 03-10-2026

## 1. Qué es Localito hoy
Localito es una PWA SaaS multi-negocio orientada a almacenes y comercios de barrio. El alcance vigente reúne autenticación y roles, POS/ventas, inventario y kardex, clientes y fiado, caja, compras/proveedores, reportes, auditoría, operación PWA/offline acotada y apoyo de IA para Venta Rápida e ingreso de facturas.

## 2. Arquitectura y stack vigente
- Frontend: React/TypeScript, PWA mobile-first.
- Backend: Node.js y API REST.
- Base de datos: PostgreSQL/Supabase.
- Despliegue: Vercel.
- IA/visión: desde backend; las claves no se exponen al frontend.
- Versionado y evidencias: Git/GitHub.

## 3. Organización Scrum
- Alexander Patiño — Product Owner.
- Samuel Solís — Scrum Master.
- Camilo González — Developer.

Trello es la herramienta de gestión activa. Jira se conserva únicamente como antecedente histórico.

### Estado de iteraciones al 03-10-2026
- Sprint 0: preparación/cerrado.
- Sprint 1: 17–28 agosto, cerrado.
- Sprint 2: 31 agosto–11 septiembre, cerrado.
- Sprint 3: 14–25 septiembre, cerrado.
- Sprint 4: 28 septiembre–9 octubre, en curso.
- Sprint 5–8: futuros; no se comprometen HU antes del Planning.

Regla de trazabilidad: requisito → HU → Trello/Sprint → commit → prueba → evidencia.

## 4. Qué se hizo en Trello
- Se reorganizó la evidencia para que sea defendible como Scrum.
- Se distribuyeron responsabilidades según rol.
- Se agregaron etiquetas/colores y fechas coherentes.
- Se usan checklists nativos donde corresponde.
- Los Sprints futuros mantienen estructura, pero no HU asignadas anticipadamente.
- Para asignar tarjetas, Alexander y Samuel deben estar agregados al tablero correspondiente.

## 5. Reorganización de GitHub
La documentación dejó de estar mezclada entre archivos activos, temporales y QA.

```text
docs/
  00_indice/
  01_documentacion_maestra/
  02_gestion_scrum_trello/
  03_requisitos_diseno/
  04_calidad_pruebas/
  05_operacion_produccion/
  06_documentacion_academica/
  90_historico_jira/
archivo/
  qa_y_temporales/
entregables/
  finales/
  presentaciones/
```

### Fuentes de verdad
1. `docs/01_documentacion_maestra/Estado-Actual.md`
2. `docs/01_documentacion_maestra/Documento-Proyecto-Localito.md`
3. `docs/02_gestion_scrum_trello/Backlog-Scrum-Trello.md`
4. `docs/02_gestion_scrum_trello/PLANIFICACION_SPRINTS.md`
5. matrices de pruebas y operación.

## 6. Documentación Word/DUOC
Los paquetes académicos existentes mantienen su formato visual para no romper logos, diagramas, tablas ni estructura de las entregas. Se revisaron documentos representativos y comparten una base académica coherente (portada, jerarquía de títulos, azul institucional y pie de página).

La documentación de gestión vigente se concentra en la estructura nueva. Los documentos antiguos de reconstrucción/Jira son evidencia histórica y no deben presentarse como el estado actual del proyecto.

## 7. Qué no cambió
- No se modificó el código funcional como parte de esta reorganización.
- No se borraron evidencias antiguas.
- No se convirtió Jira en evidencia activa: permanece como histórico.
- Los pagos externos y el alcance tributario mantienen las limitaciones documentadas en el proyecto.

## 8. Cómo explicarlo en la reunión
La secuencia recomendada es:
1. Mostrar el objetivo actual de Localito.
2. Mostrar el Trello y explicar roles/Sprint 4.
3. Explicar por qué Sprint 5–8 no tienen HU comprometidas.
4. Abrir GitHub y mostrar la nueva estructura documental.
5. Explicar que Jira quedó como histórico.
6. Mostrar Documento Maestro + Estado Actual + Backlog Trello.
7. Revisar próximos pendientes del Sprint 4 y preparar Planning de Sprint 5.

## 9. Rama y Pull Request
La reorganización se trabajó fuera de `main` en:
`docs/reorganizacion-integral-2026-10-03`

Debe revisarse el Pull Request antes de integrarlo a `main`.
