# Innovación y valor agregado de Localito

# Resumen ejecutivo

Localito propone integrar gestión operacional de pequeños comercios con asistencia visual para preparar ventas e ingreso de mercadería. El aporte se presenta como innovación aplicada al flujo del proyecto, sin declarar una invención mundial ni resultados comerciales no medidos. React PWA, SaaS y visión son tecnologías existentes; su valor depende de cómo se combinan y verifican en la operación.

# Introducción y criterio de evaluación

La innovación debe explicar el cambio que recibe el usuario y cómo se comprobará. El Manual de Oslo se utiliza como referencia general para distinguir cambios de producto y proceso y su puesta en uso (OECD y Eurostat, 2018). Este documento no acredita difusión de mercado; analiza una propuesta implementada en un MVP académico y establece un plan de evaluación.

Localito relaciona procesos que suelen tratarse de manera separada en la formulación del problema: venta, existencias, caja y deuda. La propuesta añade reconocimiento de imágenes y revisión humana. Las afirmaciones del equipo se contrastan con módulos y reglas del repositorio (Equipo Localito, 2026). No se incorporan estadísticas de adopción, entrevistas o comparaciones comerciales inventadas.

# Problema y línea base del proyecto

La línea base descrita por el equipo utiliza registros y herramientas desconectados. Para evaluar una mejora deben conservarse tareas comparables: preparar un ticket conocido, registrar mercadería y consultar una deuda. Una evaluación válida no compara un usuario experto con un principiante sin explicar la diferencia.

La mejora buscada es disminuir digitación y búsquedas y mantener datos consistentes. El ahorro real depende del catálogo, cámara, conectividad y correcciones. No se declara reducción porcentual de tiempo porque no se ejecutó ese estudio en esta revisión.

# Venta Rápida con fotografía

La imagen se procesa desde backend mediante un proveedor visual. La propuesta se normaliza y se relaciona con productos del catálogo permitido. El vendedor revisa cantidades, corrige coincidencias y decide qué incorporar al ticket. El total se calcula con precios del inventario, y la venta final pasa por las mismas reglas de stock, pagos e idempotencia que una venta manual.

El aporte reside en preparar varias líneas con una interacción visual y conservar control del operador. La alternativa manual y el código de barras permanecen útiles para imágenes ambiguas o falta de servicio. No se afirma que el reconocimiento funcione con cualquier producto ni que aprenda automáticamente un modelo propio del negocio.

# Ingreso de mercadería desde factura

La fotografía puede proponer proveedor, productos, cantidades y costos. La revisión del dueño es necesaria para corregir errores y asociar líneas. La recepción definitiva debe pasar por validaciones de invoiceImport y repositorio. La IA no confirma por sí sola una compra ni altera existencias.

Las facturas pueden contener datos privados. En evaluación se utilizan ejemplos sintéticos o autorizados y se revisa qué se envía al proveedor. El hecho de que Localito no construya un repositorio permanente de esas imágenes no demuestra retención externa nula. Se deben revisar condiciones del proveedor si se pretende operar comercialmente.

# PWA y continuidad operativa acotada

La aplicación web puede instalarse y conservar snapshots y ventas pendientes. La cola por negocio y usuario evita mezclar cuentas. La idempotencia trata el riesgo de reintento. El aporte se demuestra si un corte de red conserva la tarea y luego la sincronización resuelve su estado sin duplicar.

El alcance tiene restricciones: IA necesita conexión; no todos los módulos pueden modificarse offline; el servidor usa precios vigentes al sincronizar. La documentación MDN sirve para contextualizar operación offline en PWA (MDN Web Docs, s. f.), mientras los mecanismos específicos se explican desde offline.ts y workspaceCache.ts.

# Integración de trazabilidad y gestión

Una venta se relaciona con producto, usuario y negocio. Kardex, auditoría y cuentas de deuda permiten revisar efectos, y el tablero mantiene el trabajo pendiente de aceptación. El valor añadido se sostiene en esas relaciones y en pruebas, no en la cantidad de pantallas.

La arquitectura de tres capas conserva reglas en API y permite tratar la IA como servicio auxiliar. Los riesgos de salida no confiable y agencia excesiva se toman como referencias de OWASP para revisión (OWASP Gen AI Security Project, 2025). En Localito la autorización y la persistencia dependen de código determinista y confirmación humana.

# Comparación de enfoques de tarea

| Enfoque | Ventaja en la tarea | Condición o limitación |
| --- | --- | --- |
| Búsqueda manual | Control explícito y funciona sin IA | Requiere localizar cada producto |
| Código de barras | Coincidencia precisa si está registrado | Necesita código y catálogo correcto |
| Fotografía asistida | Puede preparar varias líneas | Requiere revisión y servicio remoto |
| Digitación de factura | Control completo de campos | Tiempo y errores dependen del operador |
| Factura asistida | Propone líneas y costos | Asociación y corrección son necesarias |

La comparación analiza enfoques del propio flujo y no atribuye funciones o precios a competidores sin investigación específica. La elección del método depende del caso; la IA debe aportar una ventaja medible para justificar su consumo y complejidad.

# Protocolo propuesto de evaluación

Se preparan tareas equivalentes con catálogo y cantidades conocidos. Cada participante realiza búsqueda manual, código y fotografía con orden alternado para reducir aprendizaje. Se mide inicio a ticket revisado, errores de producto y cantidad, correcciones y fallos de proveedor. La muestra y experiencia se registran y los resultados se presentan con denominadores.

Para factura se mide preparación y corrección hasta datos revisados, sin ejecutar recepción real. Después se realiza un caso de recepción aislado para confirmar integridad. Se utilizan imágenes con iluminación y calidad documentadas y se conserva la versión de proveedor y configuración. El éxito del parser y el de la propuesta visual se reportan separados.

| Métrica propuesta | Unidad | Interpretación |
| --- | --- | --- |
| Tiempo hasta ticket revisado | Segundos por tarea | Beneficio frente a otro método |
| Líneas corregidas | Cantidad y porcentaje | Carga de revisión de IA |
| Coincidencias aceptadas | Correctas sobre propuestas | Calidad en la muestra evaluada |
| Errores de cantidad | Errores por ticket | Riesgo operativo |
| Solicitudes fallidas | Fallas sobre solicitudes | Dependencia del proveedor |
| Venta persistida sin duplicado | Casos satisfactorios | Integridad tras preparación |

# Modelo SaaS y sostenibilidad

Los planes definidos por el proyecto separan prestaciones y costo mensual. El precio es un supuesto comercial de Localito, no una validación de disposición a pagar. El costo de IA es variable y necesita límites y seguimiento. Los límites en memoria de una función no equivalen a presupuesto global distribuido; ese control debe fortalecerse para crecimiento comercial.

La sostenibilidad también depende de soporte, disponibilidad, respaldo y seguridad. Una función visual que requiere demasiada corrección puede afectar adopción. La evaluación debe registrar problemas y reflejarlos en el backlog, conservando posibilidades de simplificar el flujo.

# Conclusiones

No se acreditan ventas comerciales, precisión general de IA, retorno financiero ni cumplimiento tributario. El aporte demostrable es una integración funcional con catálogo, revisión humana y reglas de negocio, acompañada de un protocolo para evaluar utilidad.

La tesis puede defender esa contribución mostrando un escenario completo y sus límites. La calidad del argumento requiere explicar por qué cada mecanismo responde al problema y qué evidencia sostiene su resultado. Esta versión prepara esa explicación sin sustituir resultados pendientes por afirmaciones favorables.

# Contraste con antecedentes y validación del aporte

La comparación documental del Informe académico considera Bsale, Loyverse y Odoo (Bsale, s. f.; Loyverse, s. f.; Odoo, s. f.). La existencia de esas alternativas impide presentar ventas, stock u operación offline como invenciones exclusivas. El aporte de Localito se formula como integración adaptada al comercio de barrio, con fiado y asistencia visual revisable, cuya utilidad todavía debe medirse.

El protocolo compara tareas equivalentes mediante búsqueda, código de barras y fotografía. Debe registrar tiempo total, correcciones, ayudas y fallos; la fotografía solo aporta si su preparación y revisión no anulan la mejora esperada. También se consulta disposición a adoptar y pagar sin tratar la intención declarada como una venta real. Los antecedentes académicos se usan para orientar diagnóstico y medición, sin trasladar resultados ajenos al proyecto (Monardes Silva, 2025; Universidad Técnica Federico Santa María, s. f.).

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Bsale (s. f.). *Sistema de control de inventario*. https://www.bsale.cl/sheet/sistemadeinventario

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

Loyverse (s. f.). *Modo offline de Loyverse TPV*. https://help.loyverse.com/es/help/offline-work-of-pos

MDN Web Docs (s. f.). *Offline and background operation for PWAs*. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation

Monardes Silva, J. B. (2025). *Implementación de gestión de un sistema de inventario [Ficha y resumen de memoria, Universidad Técnica Federico Santa María]*. https://repositorio.usm.cl/entities/tesis/c42ddfb1-d845-46ef-837d-cd0b11d55a10/full

Odoo (s. f.). *Point of Sale Shop Features*. https://www.odoo.com/app/point-of-sale-features

OECD y Eurostat (2018). *Oslo Manual 2018*. https://www.oecd.org/en/publications/oslo-manual-2018_9789264304604-en.html

OWASP Gen AI Security Project (2025). *Top 10 risks for LLMs and Gen AI*. https://genai.owasp.org/llm-top-10/

Universidad Técnica Federico Santa María (s. f.). *Sistema de inventario, precios, generación de boletas y almacén de facturas para negocio de barrio Provisiones Lucy [Ficha y resumen de tesis]*. https://repositorio.usm.cl/entities/tesis/1598823c-8db6-445f-8633-6a64aebec17d

