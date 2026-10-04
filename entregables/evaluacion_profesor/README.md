# Documentos de tesis de Localito

Revisión del 04 de octubre de 2026: **22 documentos Word y 220 páginas** en la renderización revisada. Los nombres no tienen prefijos numéricos. Word puede repaginar si cambia la versión o las fuentes.

## Lectura sugerida

Comenzar por **Informe académico**, **Control de entrega** y **Matriz de trazabilidad**. Continuar con **Arquitectura**, **Modelo de datos**, **Plan de pruebas** e **Informe de verificación**. Los demás documentos desarrollan cada aspecto de la gestión y la solución.

## Inventario

| Documento | Páginas | Archivo editable | Versión de consulta |
| --- | ---: | --- | --- |
| Arquitectura de software de Localito | 16 | [Word](Arquitectura_Localito.docx) | [Texto](fuentes/Arquitectura_Localito.md) |
| Control de entrega y evidencias de Localito | 7 | [Word](Control_Entrega_Localito.docx) | [Texto](fuentes/Control_Entrega_Localito.md) |
| Definition of Done de Localito | 6 | [Word](Definition_of_Done_Localito.docx) | [Texto](fuentes/Definition_of_Done_Localito.md) |
| Diagramas UML de Localito | 10 | [Word](Diagramas_UML_Localito.docx) | [Texto](fuentes/Diagramas_UML_Localito.md) |
| Docker y entorno local de Localito | 6 | [Word](Docker_Localito.docx) | [Texto](fuentes/Docker_Localito.md) |
| Documento de inicio del proyecto Localito | 6 | [Word](Documento_Inicio_Proyecto_Localito.docx) | [Texto](fuentes/Documento_Inicio_Proyecto_Localito.md) |
| Informe académico del proyecto Localito | 10 | [Word](Informe_Academico_Localito.docx) | [Texto](fuentes/Informe_Academico_Localito.md) |
| Informe de verificación de Localito | 9 | [Word](Informe_Verificacion_Localito.docx) | [Texto](fuentes/Informe_Verificacion_Localito.md) |
| Innovación y valor agregado de Localito | 6 | [Word](Innovacion_Valor_Agregado_Localito.docx) | [Texto](fuentes/Innovacion_Valor_Agregado_Localito.md) |
| Manual técnico de Localito | 10 | [Word](Manual_Tecnico_Localito.docx) | [Texto](fuentes/Manual_Tecnico_Localito.md) |
| Matriz de trazabilidad de Localito | 8 | [Word](Matriz_Trazabilidad_Localito.docx) | [Texto](fuentes/Matriz_Trazabilidad_Localito.md) |
| Metodología Scrum de Localito | 8 | [Word](Metodologia_Scrum_Localito.docx) | [Texto](fuentes/Metodologia_Scrum_Localito.md) |
| Modelo de datos de Localito | 18 | [Word](Modelo_Datos_Localito.docx) | [Texto](fuentes/Modelo_Datos_Localito.md) |
| Plan de pruebas de Localito | 28 | [Word](Plan_Pruebas_Localito.docx) | [Texto](fuentes/Plan_Pruebas_Localito.md) |
| Product Backlog de Localito | 12 | [Word](Product_Backlog_Localito.docx) | [Texto](fuentes/Product_Backlog_Localito.md) |
| Visión del producto Localito | 6 | [Word](Product_Vision_Localito.docx) | [Texto](fuentes/Product_Vision_Localito.md) |
| README profesional de Localito | 18 | [Word](README_Profesional_Localito.docx) | [Texto](fuentes/README_Profesional_Localito.md) |
| Requisitos no funcionales de Localito | 8 | [Word](Requisitos_No_Funcionales_Localito.docx) | [Texto](fuentes/Requisitos_No_Funcionales_Localito.md) |
| Retrospectivas de Localito | 6 | [Word](Retrospectivas_Localito.docx) | [Texto](fuentes/Retrospectivas_Localito.md) |
| Aplicabilidad de SRS y gestión de requisitos de Localito | 5 | [Word](SRS_No_Aplica_Localito.docx) | [Texto](fuentes/SRS_No_Aplica_Localito.md) |
| Sprint Backlog de Localito | 9 | [Word](Sprint_Backlog_Localito.docx) | [Texto](fuentes/Sprint_Backlog_Localito.md) |
| Protocolo e instrumentos de validación de Localito | 8 | [Word](Validacion_Usuarios_Localito.docx) | [Texto](fuentes/Validacion_Usuarios_Localito.md) |

## Cambios y alcance

Se mantienen los 17 documentos del checklist del repositorio y se añaden cinco complementos: informe académico, trazabilidad, informe de verificación, protocolo de usuarios y control de entrega. Arquitectura desarrolla tres capas, vistas 4+1, siete figuras, decisiones, contratos y deuda técnica. El diccionario conserva 24 tablas y 233 campos. El Plan reúne los 113 CP históricos y diez casos nuevos pendientes; la matriz relaciona 34 RF, 15 NRF y 33 HU.

La descripción técnica y la campaña corresponden al [commit ddb9956](https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c). Se recuperaron 105 archivos de código y configuración, verificados contra sus hashes Git. Los estados de Scrum se conservan al 03 de octubre; no se inventan compromisos de Sprints posteriores.

**Resultados ejecutados:** tipos y compilación aprobados, 78 pruebas automatizadas aprobadas y 12 comprobaciones HTTP locales aprobadas. `npm run check` se bloqueó en el lanzador tsx por EPERM; los componentes se ejecutaron por separado mediante el runner descrito en el Informe de verificación. La API utilizó memoria y datos sintéticos. Las pruebas emplean también dobles de servicios; no son una campaña PostgreSQL ni una evaluación de precisión de IA.

**Pendientes:** concurrencia, persistencia y restauración en PostgreSQL; navegador y dispositivos físicos; validación con comerciantes; carga bajo condiciones acordadas; CI del commit entregado. El protocolo incluye consentimiento, entrevistas, siete tareas UAT y fichas para resultados reales. La pauta y la plantilla oficiales deben confirmarse con el docente: el checklist consolidado y la guía APT ajustada no acreditan por sí solos aceptación institucional.

## Evidencias y fuentes

[Registros de verificación](evidencias/README.md) y [fuentes consultadas](FUENTES.md). Cada Word incluye las referencias utilizadas, con citas autor-fecha. Se distinguen resúmenes públicos de normas, fichas académicas y documentación de proveedores. No se atribuyen resultados ajenos a Localito.

La revisión incluyó contenido, coherencia, índices, tablas, figuras y páginas renderizadas. Los resultados históricos se mantienen separados de la campaña nueva. La cantidad de páginas no se presenta como criterio suficiente de tesis final.

## Uso de los archivos

Descargar y extraer el ZIP antes de editar. Abrir los `.docx` en Microsoft Word o un editor compatible. Si se modifica el contenido, elegir **Actualizar toda la tabla** en el índice. `fuentes/` conserva los textos y diagramas editables en el repositorio. Los registros de `evidencias/` permiten revisar los resultados sin ejecutar nada.
