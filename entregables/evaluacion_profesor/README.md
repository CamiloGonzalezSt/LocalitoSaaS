# Documentos especializados de Localito

Entrega revisada: 17 documentos Word, sin prefijos numéricos en sus nombres. Contienen portada, índice navegable, resumen ejecutivo, introducción, desarrollo, conclusiones y referencias. El conjunto suma 184 páginas en la renderización revisada; Word puede variar ligeramente la paginación según fuentes y versión.

## Documentos

| Documento | Páginas revisadas | Descarga editable | Versión legible en GitHub |
| --- | ---: | --- | --- |
| Arquitectura de software de Localito | 16 | [Word](Arquitectura_Localito.docx) | [Texto y referencias](fuentes/Arquitectura_Localito.md) |
| Definition of Done de Localito | 6 | [Word](Definition_of_Done_Localito.docx) | [Texto y referencias](fuentes/Definition_of_Done_Localito.md) |
| Diagramas UML de Localito | 10 | [Word](Diagramas_UML_Localito.docx) | [Texto y referencias](fuentes/Diagramas_UML_Localito.md) |
| Docker y entorno local de Localito | 6 | [Word](Docker_Localito.docx) | [Texto y referencias](fuentes/Docker_Localito.md) |
| Documento de inicio del proyecto Localito | 9 | [Word](Documento_Inicio_Proyecto_Localito.docx) | [Texto y referencias](fuentes/Documento_Inicio_Proyecto_Localito.md) |
| Innovación y valor agregado de Localito | 7 | [Word](Innovacion_Valor_Agregado_Localito.docx) | [Texto y referencias](fuentes/Innovacion_Valor_Agregado_Localito.md) |
| Manual técnico de Localito | 10 | [Word](Manual_Tecnico_Localito.docx) | [Texto y referencias](fuentes/Manual_Tecnico_Localito.md) |
| Metodología Scrum de Localito | 8 | [Word](Metodologia_Scrum_Localito.docx) | [Texto y referencias](fuentes/Metodologia_Scrum_Localito.md) |
| Modelo de datos de Localito | 18 | [Word](Modelo_Datos_Localito.docx) | [Texto y referencias](fuentes/Modelo_Datos_Localito.md) |
| Plan de pruebas de Localito | 25 | [Word](Plan_Pruebas_Localito.docx) | [Texto y referencias](fuentes/Plan_Pruebas_Localito.md) |
| Product Backlog de Localito | 12 | [Word](Product_Backlog_Localito.docx) | [Texto y referencias](fuentes/Product_Backlog_Localito.md) |
| Visión del producto Localito | 7 | [Word](Product_Vision_Localito.docx) | [Texto y referencias](fuentes/Product_Vision_Localito.md) |
| README profesional de Localito | 18 | [Word](README_Profesional_Localito.docx) | [Texto y referencias](fuentes/README_Profesional_Localito.md) |
| Requisitos no funcionales de Localito | 8 | [Word](Requisitos_No_Funcionales_Localito.docx) | [Texto y referencias](fuentes/Requisitos_No_Funcionales_Localito.md) |
| Retrospectivas de Localito | 6 | [Word](Retrospectivas_Localito.docx) | [Texto y referencias](fuentes/Retrospectivas_Localito.md) |
| Aplicabilidad de SRS y gestión de requisitos de Localito | 5 | [Word](SRS_No_Aplica_Localito.docx) | [Texto y referencias](fuentes/SRS_No_Aplica_Localito.md) |
| Sprint Backlog de Localito | 13 | [Word](Sprint_Backlog_Localito.docx) | [Texto y referencias](fuentes/Sprint_Backlog_Localito.md) |

## Base y alcance de la revisión

La descripción de implementación corresponde al [commit base 05a6f34](https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/05a6f34b749cdc97dd560d91bb9be057a1197fbf), con corte del proyecto al 03 de octubre de 2026. Se contrastaron 59 archivos relevantes del repositorio y se revisó la pauta disponible del profesor. El formato académico común se adapta al propósito de cada artefacto; no se presenta como una plantilla institucional oficialmente aprobada.

Arquitectura desarrolla tres capas lógicas, vistas 4+1, siete figuras, cinco decisiones arquitectónicas, escenarios y límites. Modelo de Datos incorpora el diccionario de 24 tablas y 233 campos del SQL. El Plan de Pruebas desarrolla los 113 casos de la matriz y conserva sus estados históricos.

La metodología declarada es Scrum. El documento SRS explica la no aplicabilidad del criterio condicionado a Cascada en la pauta; no afirma que Scrum prohíba una especificación de requisitos.

Se revisaron contenido, coherencia con el código, referencias, archivos DOCX, índices y las 184 páginas renderizadas. La revisión fue documental y estática: no ejecutó una nueva campaña funcional, una auditoría productiva ni pruebas con usuarios. Los pendientes de PostgreSQL, concurrencia, restauración, dispositivos y aceptación se mantienen explícitos. Los resultados históricos conservan su contexto y no se atribuyen a esta revisión.

## Fuentes y mantenimiento

[Fuentes consultadas](FUENTES.md). Las referencias principales incluyen Kruchten, arc42, documentación oficial de PostgreSQL, Docker, Supabase, Express, Node.js, Scrum Guide, OWASP, W3C y OMG. Las fuentes se utilizan para fundamentar estructura y conceptos; las capacidades específicas de Localito se describen desde su código.

La carpeta `fuentes/` conserva textos y figuras para revisión y actualización. Si cambia el código, deben revisarse mecanismos, enlaces, estados y evidencias antes de actualizar los Word. En Word se puede actualizar el índice con **Actualizar toda la tabla**.
