# Control de entrega y evidencias de Localito

# Resumen ejecutivo

La entrega reúne 22 documentos Word: los 17 documentos del checklist consolidado en el repositorio y cinco complementos para integrar argumentación académica, trazabilidad, verificación, validación con usuarios y control de entrega. Los archivos usan nombres descriptivos sin prefijos numéricos. Cada documento posee portada, índice de títulos, desarrollo y referencias cuando corresponde.

La revisión fortalece la arquitectura de tres capas y las vistas 4+1, mantiene el diccionario de datos y los casos de prueba, elimina duplicaciones extensas y añade evidencia técnica ejecutada. El paquete es apto para revisar el avance y preparar la entrega, pero no autoriza afirmar que todas las exigencias institucionales y todas las validaciones finales estén aprobadas.

# Introducción y autoridad de las fuentes

El inventario de 17 documentos procede de `docs/00_indice/CHECKLIST_EVALUACION_PROFESOR.md`, que consolida la pauta en el repositorio. No se dispuso de una rúbrica oficial íntegra e inalterada para certificar correspondencia literal con todos los criterios del docente. La guía APT ajustada disponible aporta objetivos y estructura de trabajo; sus propuestas de evidencia y fechas deben confirmarse con el docente.

Los cinco complementos son mejoras propuestas para esta entrega, no nuevos requisitos atribuidos al profesor. La presentación editorial utiliza estilos coherentes y referencias autor-fecha apoyadas en una guía bibliográfica (Universidad Central de Chile, s. f.). El tamaño de papel, tipografía y márgenes son decisiones de edición; deben adaptarse si la sede entrega una plantilla obligatoria. La longitud se deriva del contenido útil y las tablas, sin un mínimo de páginas inventado.

# Inventario de los documentos solicitados

| Documento | Contenido revisable | Situación |
| --- | --- | --- |
| Documento de inicio del proyecto Localito | Problema, alcance, objetivos y roles | Documento incluido; aceptación académica pendiente |
| Metodología Scrum de Localito | Marco Scrum y aplicación al equipo | Documento incluido; aceptación académica pendiente |
| Visión del producto Localito | Usuarios, propuesta y límites del MVP | Documento incluido; aceptación académica pendiente |
| Product Backlog de Localito | 33 historias, criterios y prioridades | Documento incluido; aceptación académica pendiente |
| Sprint Backlog de Localito | Trabajo y estados por Sprint | Documento incluido; aceptación académica pendiente |
| Definition of Done de Localito | Criterios verificables de terminado | Documento incluido; aceptación académica pendiente |
| Retrospectivas de Localito | Registros existentes e instrumento de próxima sesión | Documento incluido; aceptación académica pendiente |
| Aplicabilidad de SRS y gestión de requisitos de Localito | Justificación ágil y gestión de requisitos | Documento incluido; aceptación académica pendiente |
| README profesional de Localito | Orientación, instalación y límites operativos | Documento incluido; aceptación académica pendiente |
| Arquitectura de software de Localito | Tres capas, 4+1, decisiones y riesgos | Documento incluido; aceptación académica pendiente |
| Modelo de datos de Localito | 24 tablas, campos, claves e integridad | Documento incluido; aceptación académica pendiente |
| Diagramas UML de Localito | Contexto, clases, secuencia y casos de uso | Documento incluido; aceptación académica pendiente |
| Requisitos no funcionales de Localito | Escenarios de calidad y correspondencia NRF | Documento incluido; aceptación académica pendiente |
| Docker y entorno local de Localito | Servicios, configuración y ejecución local | Documento incluido; aceptación académica pendiente |
| Plan de pruebas de Localito | Catálogo CP, campaña y casos persistentes pendientes | Documento incluido; aceptación académica pendiente |
| Manual técnico de Localito | Operación, mantenimiento y recuperación | Documento incluido; aceptación académica pendiente |
| Innovación y valor agregado de Localito | Diferenciación y contraste con antecedentes | Documento incluido; aceptación académica pendiente |

# Complementos de la entrega

| Archivo | Función |
| --- | --- |
| Informe_Academico_Localito.docx | Integra problema, antecedentes, objetivos, método, resultados y discusión |
| Matriz_Trazabilidad_Localito.docx | Relaciona RF, NRF, HU, diseño y evidencia; registra brechas |
| Informe_Verificacion_Localito.docx | Explica 78 pruebas y 12 casos HTTP, reproducción y limitaciones |
| Validacion_Usuarios_Localito.docx | Incluye consentimiento, entrevista, tareas, observación y análisis |
| Control_Entrega_Localito.docx | Permite revisar cobertura documental y evidencias faltantes |

La carpeta de evidencias conserva resultados y guion de reproducción. El README del paquete indica rutas y orden sugerido de lectura. Los documentos especializados deben citarse dentro del informe principal cuando su contenido resulte necesario para una conclusión; no basta con adjuntarlos sin relacionarlos.

# Control de consistencia

Se mantienen dos fechas explícitas: los estados de Scrum al 03 de octubre y las verificaciones adicionales del 04 de octubre de 2026. Las pruebas se ejecutaron sobre el commit ddb9956, cuya referencia completa aparece en el Informe de verificación. Las revisiones documentales posteriores no cambian el código probado.

El documento maestro conserva 34 RF y 15 NRF. El documento especializado distingue 18 escenarios RNF y publica su correspondencia. Se mantienen 33 HU sin inventar compromisos de Sprints futuros. Los CP históricos conservan su situación; los nuevos CP114–CP123 tienen procedimientos y resultado pendiente. Los casos AUT y HTTP tienen identificadores propios para evitar atribuir a una prueba automatizada la ejecución manual de una pantalla.

La arquitectura separa capas lógicas de nodos de despliegue. Las políticas RLS no se presentan como completas cuando el esquema no las define. La IA se presenta como asistencia revisable; los pagos externos se registran sin afirmar integración bancaria ni tributaria. La suscripción y su conversión comercial requieren validación específica.

# Evidencias necesarias para cerrar la tesis

| Evidencia | Entregable esperado | Coordinación propuesta |
| --- | --- | --- |
| Pauta y plantilla definitiva | Rúbrica vigente y correspondencia firmada o validada | Samuel con el docente |
| Problema y necesidades reales | Entrevistas consentidas y síntesis anonimizada | Alexander con el equipo |
| PostgreSQL e integridad | CP114–117, registros y estado posterior | Camilo |
| Recuperación | Respaldo, restauración aislada y tiempos medidos | Camilo |
| Uso móvil y accesibilidad | CP121, equipo, navegador, capturas y observaciones | Equipo |
| Validación del producto | UAT01–07, métricas y hallazgos con participantes | Alexander y equipo |
| Rendimiento | CP123 con datos, concurrencia y percentiles | Camilo |
| Cierre de Scrum | Aceptación del incremento y retrospectiva real | PO y Scrum Master |
| Reproducibilidad final | CI del commit entregado y revisión del paquete | Camilo y equipo |

Las personas de esta tabla son propuestas según sus roles; no son asignaciones confirmadas ni actas de reunión. Deben acordar fecha y responsable antes de ejecutar. La falta de un participante, equipo o base no se resuelve inventando una evidencia: se registra como pendiente y se limita la conclusión.

# Secuencia recomendada de cierre

Primero confirmar la pauta y localizar los criterios de evaluación de la fase actual. Después ejecutar los casos persistentes críticos en una base aislada y resolver los defectos de integridad antes del trabajo con usuarios. Preparar el catálogo sintético, consentimiento y guion de tareas; realizar sesiones y conservar resultados anónimos. Finalmente integrar esos hallazgos en resultados, discusión y conclusiones, actualizar trazabilidad y hacer la revisión editorial con el commit definitivo.

El plan no presupone que todo deba completarse antes de una entrega parcial. La decisión depende de la fase y de la pauta del docente. Para una memoria final, las afirmaciones de validación técnica y comercial del objetivo general necesitan evidencias de ambas dimensiones.

# Lista de revisión antes de entregar

- Confirmar título, nombres, carrera, sede, docente y periodo en las portadas.
- Comparar el inventario con la rúbrica oficial vigente y resolver diferencias.
- Abrir el ZIP, comprobar sus 22 Word y revisar el archivo de lectura inicial.
- Comprobar índices, numeración de páginas, tablas, figuras y referencias.
- Mantener visibles los estados pendientes y las condiciones del ambiente probado.
- Verificar que cada conclusión se apoye en un resultado o esté formulada como propuesta.
- Retirar credenciales y datos personales innecesarios de anexos y capturas.
- Adjuntar la evidencia técnica y de usuarios exigida para la fase.
- Registrar la revisión y aceptación real del equipo antes del envío al docente.

# Registro de aceptación

Fecha de revisión: ____________________. Versión o commit: ____________________.

Revisor y rol: ____________________. Criterios revisados: ____________________.

Observaciones y acciones: ____________________________________________________.

Decisión: aceptado / aceptado con condiciones / requiere correcciones. Evidencia de la decisión: ____________________.

Estos espacios son un instrumento para completar; no representan aprobación ya obtenida.

# Conclusiones

La entrega amplía sustancialmente el respaldo del proyecto y permite identificar lo que está documentado, lo que fue probado y lo que falta validar. Su fortaleza académica final dependerá de mantener esa trazabilidad y completar las evidencias que sostienen las conclusiones, además de ajustar el formato a la pauta oficial.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

Universidad Central de Chile (s. f.). *Normas APA 7a edición*. https://biblioguias.ucentral.cl/subjects/guide.php?subject=apa

