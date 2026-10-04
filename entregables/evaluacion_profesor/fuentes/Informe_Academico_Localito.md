# Informe académico del proyecto Localito

# Resumen ejecutivo

Localito es un proyecto Capstone de Ingeniería en Informática que integra ventas, inventario, clientes, fiados, caja, compras y reportes en una aplicación web progresiva para pequeños comercios. El objetivo es desarrollar y validar una solución multi-negocio accesible desde dispositivos comunes. El proyecto combina una arquitectura de tres capas con asistencia visual para preparar ventas y recepciones, siempre con revisión humana antes de confirmar cambios.

La construcción se organiza mediante Scrum y se respalda con requisitos, historias, decisiones de arquitectura, modelo de datos y pruebas. Al 04 de octubre de 2026 se completaron el análisis de tipos, la compilación, 78 pruebas automatizadas y 12 comprobaciones HTTP sobre una instancia local en memoria. Los resultados demuestran reglas y comportamientos delimitados: permisos, separación entre negocios, venta, descuento de stock, fiado, abonos y revocación de sesión. El conjunto conserva 34 requisitos funcionales, 15 requisitos no funcionales del documento maestro y 33 historias de usuario.

La validación de concurrencia y restauración en PostgreSQL, el uso en dispositivos físicos y la evaluación con comerciantes siguen pendientes. El aporte académico comprobado está en el diseño, la implementación y las verificaciones ejecutadas. El ahorro de tiempo, la facilidad de uso y la disposición a pagar son hipótesis para evaluar mediante instrumentos incluidos en la entrega. Este informe integra los documentos especializados y permite revisar cada conclusión junto con su evidencia.

Palabras clave: punto de venta, PWA, SaaS, arquitectura de software, inventario, trazabilidad.

# Introducción

El control de un comercio exige relacionar operaciones que ocurren en momentos distintos. La recepción aumenta existencias; la venta las disminuye; el fiado genera una cuenta por cobrar; un abono cambia deuda y dinero recibido; el cierre permite contrastar efectivo esperado y contado. Un sistema que almacena esas acciones sin relacionarlas puede conservar registros y aun así entregar saldos inconsistentes.

Localito aborda esa relación mediante una aplicación web con reglas centralizadas y separación de datos por negocio. Su diseño considera la experiencia móvil, conectividad variable y mecanismos de ayuda para ingresar productos. El proyecto se desarrolla en Duoc UC Plaza Norte por Camilo González, Alexander Patiño y Samuel Solís, con el docente Álvaro Andrés Mellado Pimentel.

El periodo del proyecto comprende del 10 de agosto al 04 de diciembre de 2026. Este informe corresponde a un avance consolidado. Los estados de Scrum se conservan según el corte documental del 03 de octubre; las verificaciones técnicas adicionales se realizaron el 04 de octubre. Esta distinción permite añadir evidencia actual sin cambiar retrospectivamente el estado de los Sprints.

# Problema y pregunta de evaluación

El segmento definido por el equipo es el comercio pequeño administrado directamente por su dueño, con venta presencial e inventario. La situación problemática planteada es la dispersión de ventas, existencias, caja y fiados en registros separados. Se trata de una hipótesis de necesidad que requiere comprobar frecuencia, impacto y disposición al cambio en los negocios seleccionados.

La pregunta de evaluación es: ¿en qué medida Localito permite realizar tareas de venta y control de inventario con datos consistentes, separación entre negocios y una interacción comprensible para sus usuarios objetivo? Una pregunta complementaria examina si la fotografía asistida aporta utilidad frente a búsqueda manual o código de barras, considerando tiempo total, correcciones y conectividad.

El problema tiene dos dimensiones. La técnica se comprueba mediante estados y respuestas del sistema. La de uso se comprueba observando personas que realizan tareas y explican sus dificultades. Una compilación correcta no informa si el dueño comprende un cierre de caja; una opinión favorable no demuestra que dos ventas concurrentes conserven el stock.

# Objetivos del proyecto

## Objetivo general

Desarrollar y validar técnica y comercialmente una PWA SaaS multi-negocio para pequeños comercios de barrio, que integre ventas, inventario, clientes, fiados, caja y compras con seguridad, trazabilidad y un modelo de suscripción sujeto a validación.

## Objetivos específicos

- Analizar las necesidades del segmento mediante entrevistas y observación de sus procesos.
- Definir el alcance, requisitos, criterios de aceptación y backlog del MVP.
- Diseñar e implementar una arquitectura y un modelo de datos que resguarden separación e integridad.
- Integrar módulos operacionales, experiencia PWA, cola de ventas, códigos de barras y asistencia visual revisable.
- Verificar calidad mediante pruebas automatizadas, casos de integración y evidencia reproducible.
- Evaluar usabilidad y propuesta de valor, documentando resultados y limitaciones.

## Criterios para evaluar objetivos

| Objetivo | Producto o evidencia | Situación al corte |
| --- | --- | --- |
| Necesidades del segmento | Entrevistas, observación y síntesis del problema | Instrumentos preparados; trabajo de campo pendiente |
| Requisitos y planificación | RF, NRF, HU, backlog y matriz de trazabilidad | Documentados; aceptación por historia conserva sus pendientes |
| Arquitectura y datos | Tres capas, vistas 4+1, decisiones y diccionario SQL | Diseño e implementación inspeccionados |
| Integración funcional | Código y flujos verificables | Verificación automatizada y HTTP local disponible |
| Calidad | Logs, resultados y defectos | Tipos, build, 78 pruebas y 12 casos HTTP aprobados en su alcance |
| Valor y usabilidad | Tareas observadas y comparación de métodos | Protocolo preparado; resultados pendientes |

# Alcance y delimitaciones

El MVP comprende autenticación, roles, negocios, productos, stock, ventas, clientes, fiado, caja, proveedores, compras, auditoría y reportes. Incluye importación CSV, apoyo para leer facturas y reconocimiento visual de productos. Los pagos externos se confirman manualmente y los mecanismos demostrativos de suscripción permanecen diferenciados del cobro productivo.

La cola local conserva ventas pendientes por negocio y usuario. Su existencia no implica edición offline de todos los módulos. Al sincronizar, el servidor aplica reglas y precios vigentes, por lo que pueden aparecer rechazos que el usuario debe resolver. La IA necesita conectividad y sus propuestas son revisables.

El comprobante del MVP es interno. La emisión tributaria ante el SII, la conciliación automática con pasarelas, los terminales de pago integrados y una operación empresarial de múltiples sucursales no forman parte del alcance validado. Tampoco se declara disponibilidad comercial, adopción o ahorro medido.

# Antecedentes y análisis de alternativas

## Criterio de selección

Se seleccionaron fuentes primarias que permiten comparar capacidades cercanas al problema: documentación de proveedores de POS, registros de proyectos académicos y documentación técnica. La comparación es documental y se refiere a las funciones expresamente descritas por cada fuente. No constituye una prueba de sus productos ni un estudio exhaustivo del mercado.

## Soluciones existentes

Bsale documenta inventario en línea, reportes y conteo mediante códigos desde el teléfono (Bsale, s. f.). Loyverse documenta ventas y turnos sin conexión, sincronización posterior y restricciones para clientes, devoluciones y terminales integrados (Loyverse, s. f.). Odoo describe un POS web con capacidades offline y métodos de pago divididos (Odoo, s. f.). Estos antecedentes muestran que la integración operativa y la continuidad limitada son capacidades conocidas del sector.

| Alternativa | Capacidad documentada | Criterio que aporta a Localito |
| --- | --- | --- |
| Bsale | Stock y reportes por sucursal; conteo móvil | Verificar que movimientos y consultas coincidan con existencias |
| Loyverse | Venta offline con recibos pendientes y límites explícitos | Hacer visibles sincronización, rechazos y operaciones disponibles |
| Odoo POS | Interfaz web y pago dividido | Evaluar consistencia del ticket y de los medios registrados |
| Localito | Núcleo multi-negocio con fiado y apoyo visual revisable | Comprobar utilidad para el segmento y mantener trazabilidad del resultado |

La selección de Localito como proyecto académico se justifica por la oportunidad de diseñar y verificar esas relaciones con un alcance propio. La comparación no demuestra superioridad ni exclusividad de sus funcionalidades. Su diferenciación debe apoyarse en el ajuste del flujo al usuario objetivo y en resultados observables.

## Antecedentes académicos

La ficha de la memoria de Monardes Silva describe la implementación de un sistema de inventario con Odoo en una desarmaduría. Su resumen relaciona diagnóstico en terreno, entrevistas y medición de procesos (Monardes Silva, 2025). Para Localito aporta un criterio metodológico: documentar el problema de uso y la línea base antes de atribuir mejoras al software. La unidad de análisis y el rubro son distintos, por lo que sus resultados no pueden trasladarse al comercio de barrio.

El repositorio de la Universidad Técnica Federico Santa María también describe Sis_IPGA para Provisiones Lucy, orientado a inventario, precios, ventas y administración de usuarios (Universidad Técnica Federico Santa María, s. f.). El antecedente confirma la pertinencia de relacionar control de productos y operación del negocio. La consulta corresponde a su ficha y resumen públicos; no se atribuyen métricas, arquitectura o resultados no disponibles en ellos.

# Fundamentos de ingeniería

## Arquitectura de tres capas y vistas

La presentación administra interacción y estado del ticket. La API verifica identidad, permisos y reglas de aplicación. PostgreSQL almacena las operaciones y sus relaciones. Esta distribución permite explicar dónde debe resolverse una condición crítica: el navegador puede orientar al usuario, pero el servidor debe impedir una venta inválida aun si se altera la interfaz.

Las vistas 4+1 organizan responsabilidades lógicas, paquetes de desarrollo, comportamiento de procesos, despliegue y escenarios (Kruchten, 1995). En Localito complementan el esquema de capas: una venta permite recorrer la interfaz, la API, el repositorio y los registros afectados. El documento Arquitectura contiene los diagramas y decisiones detallados.

## Consistencia y separación de datos

La pertenencia al negocio procede de la sesión autenticada. Las consultas y cambios aplican el identificador del negocio en el backend. El esquema habilita RLS en las tablas, pero no contiene políticas que por sí solas acrediten toda la separación: el rol de conexión y los filtros de aplicación deben verificarse conjuntamente.

La transacción de venta combina validaciones, consulta de precios, bloqueo de productos y persistencia de efectos. La clave de idempotencia evita repetir una operación ya registrada. Las transacciones y bloqueos de PostgreSQL fundamentan ese diseño (PostgreSQL Global Development Group, s. f.d; PostgreSQL Global Development Group, s. f.b). La prueba del mecanismo requiere una base real y solicitudes concurrentes; los casos en memoria verifican solo su implementación alternativa.

## Asistencia visual con revisión

La salida de IA representa una propuesta. El backend normaliza datos y los relaciona con el catálogo permitido; el usuario confirma productos, cantidades y precios antes de persistir. La evaluación debe medir errores de reconocimiento y esfuerzo de corrección. Una prueba con respuesta simulada del proveedor verifica el contrato y la normalización, no la precisión de un modelo remoto.

# Metodología de desarrollo y evaluación

## Desarrollo incremental

Se utiliza Scrum para ordenar trabajo, seleccionar incrementos y revisar resultados (Schwaber y Sutherland, 2020). Alexander mantiene la responsabilidad de Product Owner, Samuel la de Scrum Master y Camilo la de Developer. La colaboración técnica del equipo se organiza alrededor de los entregables y no cambia los permisos de usuarios del producto.

El Product Backlog contiene 33 historias y elementos técnicos. Los Sprints 1 y 2 figuran cerrados; el Sprint 3 conserva una excepción documental y trabajo offline trasladado; el Sprint 4 está en curso. Los Sprints posteriores mantienen su estructura de eventos y esperan selección de historias en Planning.

## Estrategia de evaluación

La evaluación técnica usa tres fuentes: inspección de código y configuración, ejecución automatizada y comprobación HTTP. Se fija un commit para que el resultado tenga una versión identificable. Las salidas se conservan junto con las condiciones del entorno, y cada caso registra qué observó.

La evaluación con usuarios se plantea como estudio exploratorio de tareas, con selección intencional de dueños o vendedores del segmento. El protocolo incluye consentimiento, descripción del proceso actual, tareas comparables, medición de tiempos y errores y preguntas sobre utilidad. La muestra propuesta permite detectar dificultades del piloto; no se presenta como representativa del mercado chileno.

## Validez y límites del método

Los datos técnicos son sintéticos y la API se ejecutó con MemoryRepository. No hubo escrituras en negocios reales ni evaluación de una base productiva. El navegador automatizado no estuvo disponible en el entorno, de modo que no se incorporan capturas nuevas ni resultados de compatibilidad física.

Las pruebas de rendimiento necesitan volumen, concurrencia, dispositivo y red definidos. Las de IA necesitan un conjunto de imágenes con verdad de referencia. La validación comercial necesita participantes y respuestas. Ninguna de esas dimensiones se deduce de la cantidad de casos automatizados aprobados.

# Resultados técnicos

| Comprobación | Resultado | Alcance |
| --- | --- | --- |
| Instalación reproducible | npm ci completado | Dependencias del lockfile |
| Tipos | Web y API aprobados | Consistencia estática TypeScript |
| Compilación | shared, API y web aprobados | Artefactos de construcción |
| Pruebas automatizadas | 78 aprobadas, 0 fallidas | 57 casos principales y 21 subcasos |
| API local | 12 comprobaciones aprobadas | HTTP y efectos sobre datos en memoria |
| PostgreSQL real | Pendiente | Transacciones, concurrencia y restauración |
| Navegador y usuarios | Pendiente | Interacción, dispositivos y utilidad observada |

La campaña HTTP comprobó rechazo sin sesión, clave incorrecta, aislamiento de lectura y escritura, restricciones del vendedor, rechazo de venta inválida, venta por 2000 CLP con stock de 10 a 8, reintento sin duplicado, fiado por 1000 CLP, abono de 400 CLP, auditoría por rol y revocación de sesión. Los montos son datos de prueba y no representan actividad comercial.

El comando npm run check se detuvo al intentar abrir un canal IPC del lanzador tsx. Se completaron los archivos de pruebas mediante Node con el cargador tsx y sin aislamiento por procesos, conservando el resultado TAP. Esta adaptación está registrada para que otro evaluador conozca el comando exacto. Los intentos iniciales del guion HTTP se ajustaron al contrato existente de abono 200 y logout 204; esas correcciones pertenecen al instrumento de prueba.

# Discusión de resultados

Los resultados apoyan que las reglas seleccionadas funcionan en el entorno ejecutado. El aislamiento se observó en consultas y cambios; la venta alteró el stock esperado; el reintento conservó una única operación; el fiado y el abono mantuvieron su relación numérica. Esta evidencia permite sostener afirmaciones concretas durante la demostración.

La principal brecha técnica es verificar la implementación PostgreSQL con una base controlada. Un resultado favorable en memoria no prueba bloqueos, durabilidad o restauración. La principal brecha de producto es observar comerciantes: aún no existe una medida de ahorro de tiempo, satisfacción o disposición a pagar dentro de esta campaña.

La comparación de alternativas orienta la evaluación de innovación. El aporte de Localito se defiende mediante la integración y adaptación de su flujo, su tratamiento del fiado y el control humano de la ayuda visual. Para afirmar una ventaja será necesario comparar tareas completas, incorporando las correcciones y los fallos de la asistencia.

# Viabilidad y sostenibilidad

El código define una prueba Pro de 30 días y valores mensuales de 9990 CLP para Básico y 19990 CLP para Pro. Son parámetros del producto, sujetos a validación comercial. La existencia de esos precios no acredita suscriptores, ingresos ni rentabilidad.

La evaluación económica debe separar desarrollo, operación y adquisición de usuarios. Los principales componentes a registrar son alojamiento, base de datos, solicitudes de IA, correo, soporte y tiempo de mantenimiento. Se debe conservar fuente, moneda, fecha, impuestos y consumo de cada costo antes de calcular un resultado financiero. Esta revisión no añade valores de costo o ventas sin respaldo.

| Factor | Evidencia necesaria | Decisión que permite |
| --- | --- | --- |
| Consumo de IA | Solicitudes, imágenes, errores y costo por periodo | Determinar límites de uso por plan |
| Operación | Facturas o cotizaciones de servicios y uso real | Estimar costo por negocio activo |
| Adopción | Demostraciones, activación y uso posterior | Evaluar interés sostenido |
| Precio | Respuestas de participantes y condiciones de pago | Revisar la oferta del MVP |

# Riesgos y plan de cierre

Los riesgos prioritarios son inconsistencias SQL bajo concurrencia, pérdida de pendientes offline, fallas de proveedores, crecimiento del alcance y falta de evidencia de usuarios. Su seguimiento debe vincular riesgo, prueba o actividad, responsable confirmado y decisión de cierre.

Antes de una entrega final se propone completar CP-114 a CP-123, ejecutar el protocolo de usuarios, conciliar estados del tablero y revisar la pauta definitiva con el docente. Las tareas futuras se incorporan al backlog sin asignarlas anticipadamente a un Sprint. Control de Entrega conserva el registro de comprobación de estos puntos.

# Conclusiones

Localito cuenta con una solución implementada y una descripción técnica que conecta requisitos, arquitectura, datos y comportamiento. La campaña del 04 de octubre aporta evidencia reproducible de tipos, construcción, reglas automatizadas y operaciones HTTP en memoria. Esto respalda una entrega de avance técnicamente fundamentada.

Los objetivos de validación con usuarios y de operación persistente todavía necesitan resultados propios. El siguiente cierre debe aportar pruebas PostgreSQL, comportamiento en dispositivos y observación del segmento. Las conclusiones sobre impacto y viabilidad comercial se actualizarán a partir de esos resultados, conservando también fallas, restricciones y decisiones de mejora.

# Documentos de respaldo

Los 17 documentos especializados desarrollan cada artefacto de la pauta. Matriz de Trazabilidad reúne RF, NRF, HU y casos. Informe de Verificación conserva resultados y comandos. Protocolo e Instrumentos de Validación prepara el trabajo de campo. Control de Entrega permite comprobar presencia, alcance y evidencia pendiente. Las fuentes de implementación corresponden al commit identificado en las referencias (Equipo Localito, 2026).

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Bsale (s. f.). *Sistema de control de inventario*. https://www.bsale.cl/sheet/sistemadeinventario

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

Kruchten, P. (1995). *Architectural Blueprints The 4 plus 1 View Model of Software Architecture*. https://arxiv.org/abs/2006.04975

Loyverse (s. f.). *Modo offline de Loyverse TPV*. https://help.loyverse.com/es/help/offline-work-of-pos

Monardes Silva, J. B. (2025). *Implementación de gestión de un sistema de inventario [Ficha y resumen de memoria, Universidad Técnica Federico Santa María]*. https://repositorio.usm.cl/entities/tesis/c42ddfb1-d845-46ef-837d-cd0b11d55a10/full

Odoo (s. f.). *Point of Sale Shop Features*. https://www.odoo.com/app/point-of-sale-features

PostgreSQL Global Development Group (s. f.b). *PostgreSQL 16 Explicit locking*. https://www.postgresql.org/docs/16/explicit-locking.html

PostgreSQL Global Development Group (s. f.d). *PostgreSQL 16 Transactions*. https://www.postgresql.org/docs/16/tutorial-transactions.html

Schwaber, K., y Sutherland, J. (2020). *The Scrum Guide*. https://scrumguides.org/scrum-guide.html

Universidad Técnica Federico Santa María (s. f.). *Sistema de inventario, precios, generación de boletas y almacén de facturas para negocio de barrio Provisiones Lucy [Ficha y resumen de tesis]*. https://repositorio.usm.cl/entities/tesis/1598823c-8db6-445f-8633-6a64aebec17d

