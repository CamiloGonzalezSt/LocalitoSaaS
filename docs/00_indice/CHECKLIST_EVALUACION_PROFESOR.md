# Checklist de evaluación automática — Localito

**Corte:** 03-10-2026  
**Metodología declarada:** Scrum  
**Herramienta activa:** Trello

| # | Criterio evaluado | Evidencia principal | Estado |
|---:|---|---|---|
| 1 | Documento de inicio de proyecto | `docs/01_documentacion_maestra/Documento-Inicio-Proyecto.md` | Cubierto |
| 2 | Metodología declarada y justificada | `docs/02_gestion_scrum_trello/Metodologia-Scrum.md` | Cubierto |
| 3 | Product Vision | `docs/02_gestion_scrum_trello/Product-Vision.md` | Cubierto |
| 4 | Product Backlog | `docs/02_gestion_scrum_trello/Product-Backlog.md` | Cubierto |
| 5 | Sprint Backlog | `docs/02_gestion_scrum_trello/Sprint-Backlog.md` | Cubierto |
| 6 | Definition of Done | `docs/02_gestion_scrum_trello/Definition-of-Done.md` | Cubierto |
| 7 | Retrospectivas | `docs/02_gestion_scrum_trello/Retrospectivas.md` | Cubierto S1–S3; S4 pendiente por estar en curso |
| 8 | SRS | `docs/03_requisitos_diseno/SRS-No-Aplica.md` | No aplica: metodología Scrum |
| 9 | README del repositorio | `README.md` | Cubierto |
| 10 | Arquitectura | `docs/05_operacion_produccion/Arquitectura.md` | Cubierto |
| 11 | Modelo de datos | `docs/05_operacion_produccion/Modelo-de-Datos.md` + `db/schema.sql` | Cubierto |
| 12 | Diagramas UML | `docs/03_requisitos_diseno/UML/` | Cubierto: casos de uso, clases, secuencia y componentes |
| 13 | Requisitos no funcionales | `docs/03_requisitos_diseno/Requisitos-No-Funcionales.md` | Cubierto |
| 14 | Docker | `docker-compose.yml` + Manual Técnico | Cubierto |
| 15 | Pruebas | `docs/04_calidad_pruebas/Plan-de-Pruebas.md` + matrices + scripts | Cubierto |
| 16 | Manual técnico | `docs/05_operacion_produccion/Manual-Tecnico.md` | Cubierto |
| 17 | Innovación | `docs/07_innovacion/Innovacion-y-Valor-Agregado.md` | Cubierto |

## Nota
Este checklist no sustituye las evidencias técnicas. Su objetivo es permitir una revisión rápida y evitar que un artefacto existente quede oculto dentro de un documento extenso.

## Regla de consistencia
Cuando exista contradicción entre documentación histórica y vigente, prevalecen:
1. `docs/01_documentacion_maestra/Estado-Actual.md`
2. `docs/01_documentacion_maestra/Documento-Proyecto-Localito.md`
3. documentación Scrum/Trello vigente.



## Revisión ampliada del 04 de octubre de 2026

La entrega Word vigente está en [entregables/evaluacion_profesor](../../entregables/evaluacion_profesor/README.md): 22 documentos y 220 páginas revisadas. Incluye cinco complementos académicos y los registros de la campaña de verificación.

Los estados «Cubierto» de la tabla identifican presencia documental; no equivalen a aceptación del docente ni a todas las pruebas aprobadas. La interpretación del criterio SRS se conserva en su documento, sin afirmar que Scrum prohíba una especificación formal.

Tipos y build completados, 78 pruebas automatizadas y 12 casos HTTP locales aprobados. El comando check se bloqueó por IPC de tsx y se utilizaron ejecuciones separadas. PostgreSQL real, restauración, dispositivos físicos y evaluación con comerciantes siguen pendientes. Consulte el Informe de verificación y el Control de entrega para condiciones y evidencias.
