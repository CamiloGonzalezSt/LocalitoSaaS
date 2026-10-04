# Innovación y valor agregado de Localito

# Resumen ejecutivo

Localito propone integrar gestión operacional de pequeños comercios con asistencia visual para preparar ventas e ingreso de mercadería. El aporte se presenta como innovación aplicada al flujo del proyecto, sin declarar una invención mundial ni resultados comerciales no medidos. React PWA, SaaS y visión son tecnologías existentes; su valor depende de cómo se combinan y verifican en la operación.

# Introducción y criterio de evaluación

La innovación debe explicar el cambio que recibe el usuario y cómo se comprobará. El Manual de Oslo se utiliza como referencia general para distinguir cambios de producto y proceso y su puesta en uso [R27]. Este documento no acredita difusión de mercado; analiza una propuesta implementada en un MVP académico y establece un plan de evaluación.

Localito relaciona procesos que suelen tratarse de manera separada en la formulación del problema: venta, existencias, caja y deuda. La propuesta añade reconocimiento de imágenes y revisión humana. Las afirmaciones del equipo se contrastan con módulos y reglas del repositorio [P]. No se incorporan estadísticas de adopción, entrevistas o comparaciones comerciales inventadas.

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

El alcance tiene restricciones: IA necesita conexión; no todos los módulos pueden modificarse offline; el servidor usa precios vigentes al sincronizar. La documentación MDN sirve para contextualizar operación offline en PWA [R18], mientras los mecanismos específicos se explican desde offline.ts y workspaceCache.ts.

# Integración de trazabilidad y gestión

Una venta se relaciona con producto, usuario y negocio. Kardex, auditoría y cuentas de deuda permiten revisar efectos, y el tablero mantiene el trabajo pendiente de aceptación. El valor añadido se sostiene en esas relaciones y en pruebas, no en la cantidad de pantallas.

La arquitectura de tres capas conserva reglas en API y permite tratar la IA como servicio auxiliar. Los riesgos de salida no confiable y agencia excesiva se toman como referencias de OWASP para revisión [R21]. En Localito la autorización y la persistencia dependen de código determinista y confirmación humana.

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

# Capacidades visuales documentadas en el README
## Propuesta de valor e innovación

Localito no se limita a digitalizar un POS. La propuesta combina gestión operativa tradicional con capacidades orientadas a reducir fricción en tareas repetitivas.

### Elementos innovadores del MVP

- **Venta Rápida con IA:** una fotografía puede proponer varios productos y cantidades utilizando exclusivamente el catálogo del negocio.
- **Ingreso de mercadería desde factura:** la IA propone proveedor, productos, cantidades y costos para que el usuario revise antes de confirmar.
- **Human-in-the-loop:** la IA nunca vende, descuenta stock ni crea recepciones por sí sola; solamente propone información.
- **PWA instalable:** experiencia similar a una aplicación sin exigir distribución por App Store o Play Store.
- **Soporte parcial offline:** cola local exclusiva para ventas y catálogo en IndexedDB para escenarios de conectividad inestable.
- **Modelo SaaS multi-negocio:** separación lógica de datos, usuarios, planes y permisos por comercio.
- **Trazabilidad completa:** auditoría, kardex, movimientos de caja, cuentas por cobrar y estados de operación.
- **Arquitectura orientada a bajo costo:** frontend web, backend Node.js, PostgreSQL administrado y despliegue serverless.

El valor agregado no está en reemplazar la decisión del usuario, sino en **reducir pasos manuales manteniendo control y trazabilidad**.


## Venta Rápida, cámara y código de barras

**Venta Rápida** permite tomar o subir una foto con varios productos. El navegador reduce la imagen y la API solicita una respuesta estructurada contra el catálogo aislado del negocio. Los IDs que no pertenecen al catálogo se descartan; precios y stock siempre se completan desde la base de Localito. Coincidencias ambiguas y productos no reconocidos deben confirmarse, cambiarse, buscarse o ignorarse antes de continuar.

Cada producto y cantidad requieren confirmación humana antes de habilitar el envío al ticket. Los conteos repetidos o visualmente dudosos muestran una alerta específica. La API aplica un límite preventivo de 40 análisis por usuario y hora y, si Groq alcanza su cuota gratuita, informa el tiempo de espera indicado por el proveedor cuando está disponible.

Al presionar **Agregar a la venta**, Localito incorpora las cantidades al ticket existente. La detección no crea una venta, no descuenta stock y no escribe kardex: esas operaciones siguen ocurriendo únicamente cuando el POS confirma el cobro. Si la cantidad supera el stock y el producto controla existencias, se muestra una advertencia y se aplica la misma restricción del POS.

La lectura exacta de código de barras con ZXing se mantiene dentro de Venta Rápida y puede utilizarse sin análisis visual. El reconocimiento multiproducto necesita conexión y un proveedor configurado (`GROQ_API_KEY` recomendado para la tesis u `OPENAI_API_KEY` como alternativa); búsqueda, código, ticket y el resto del soporte offline continúan funcionando sin ella.

La cámara en vivo requiere HTTPS en iPhone y en la mayoría de los navegadores móviles. Como alternativa se puede usar **Cámara del teléfono** o **Subir foto**. Para probar un código físico, guarde antes su valor real en el catálogo.

### Ingreso desde factura

El dueño puede abrir la carga de factura desde la gestión de inventario y tomar una foto JPG, PNG o WebP. La IA propone proveedor, folio, fecha, productos, categorías, cantidades y costos; los productos de baja confianza quedan advertidos y cada precio de venta debe quedar confirmado antes de ingresar. Al confirmar, Localito reutiliza o crea el proveedor, reutiliza o crea productos, registra una orden recibida y aumenta el stock. El folio y una clave de importación evitan dobles ingresos por reintentos.

Este flujo organiza inventario a partir de un documento comercial; no emite, valida ni contabiliza facturas electrónicas ante el SII.


## Medios de pago presenciales

Localito registra efectivo, tarjeta en terminal externa, transferencia, Webpay externo, Mercado Pago externo, fiado y pago mixto. El vendedor cobra fuera de Localito, ingresa manualmente el monto en el terminal o aplicación correspondiente y confirma en la app que recibió el pago. El MVP no envía montos a un POS, no genera QR de Mercado Pago y no almacena datos de tarjeta.

Para la tesis, la contratación de planes usa simulaciones sandbox: Webpay y Mercado Pago activan una prueba sin mover dinero, mientras que la transferencia queda pendiente de aprobación manual. El cobro Webpay mostrado desde fiados también es una simulación académica; no debe utilizarse para cobrar a clientes reales.

# Conclusiones

No se acreditan ventas comerciales, precisión general de IA, retorno financiero ni cumplimiento tributario. El aporte demostrable es una integración funcional con catálogo, revisión humana y reglas de negocio, acompañada de un protocolo para evaluar utilidad.

La tesis puede defender esa contribución mostrando un escenario completo y sus límites. La calidad del argumento requiere explicar por qué cada mecanismo responde al problema y qué evidencia sostiene su resultado. Esta versión prepara esa explicación sin sustituir resultados pendientes por afirmaciones favorables.

# Referencias y evidencia de la versión

Las referencias externas fundamentan conceptos y organización. La descripción específica de Localito procede del repositorio. Se consultaron fuentes públicas el 03 de octubre de 2026. Las fichas públicas ISO se utilizan para alcance y orientación, sin atribuir acceso al texto normativo completo ni conformidad certificada.

[R18] MDN Web Docs. Offline and background operation for PWAs. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation

[R21] OWASP Gen AI Security Project 2025. Top 10 risks for LLMs and Gen AI. https://genai.owasp.org/llm-top-10/

[R27] OECD y Eurostat 2018. Oslo Manual 2018. https://www.oecd.org/en/publications/oslo-manual-2018_9789264304604-en.html

[P] Equipo Localito. Repositorio LocalitoSaaS. Commit base 05a6f34b749cdc97dd560d91bb9be057a1197fbf. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/05a6f34b749cdc97dd560d91bb9be057a1197fbf

Fuentes internas revisadas: README.md; package.json y manifests de apps; apps/api/src/server.ts, repository.ts y auth.ts; db/schema.sql; apps/web/src/lib/offline.ts y workspaceCache.ts; docs de requisitos, calidad, operación y Scrum. La revisión es documental y estática. No crea resultados de pruebas funcionales, reuniones ni aceptación de usuario.
