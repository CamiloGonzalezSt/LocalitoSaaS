# Definition of Done de Localito

# Resumen ejecutivo

La Definition of Done de Localito establece condiciones comunes para considerar terminado un incremento. Incluye aceptación funcional, integración, pruebas pertinentes, permisos, persistencia, revisión de interfaz y documentación. Su aplicación impide que una pantalla implementada se confunda con una operación validada.

El documento amplía los criterios existentes con mecanismos verificables y ejemplos del proyecto. Las nuevas precisiones se presentan como propuesta documental de operación; el equipo debe utilizarlas al revisar su trabajo. No se añade una aprobación histórica ni un acta inexistente.

# Introducción y fundamento

La Guía Scrum asocia la DoD con la calidad del incremento (Schwaber y Sutherland, 2020). En Localito, una venta afecta varias partes y puede ejecutarse con reintentos. Su término exige confirmar comportamiento y datos, además de compilar. Los criterios de aceptación de la historia describen el resultado específico; la DoD define condiciones de calidad que se aplican a distintos elementos.

Una HU puede satisfacer el flujo visible y fallar aislamiento por negocio. En ese caso el resultado no está terminado. También puede tener pruebas en memoria y carecer de comprobación PostgreSQL cuando modifica transacciones. La evidencia debe indicar su alcance; el estado no se decide por el número de pruebas ni por una captura aislada.

# Criterios comunes de terminado

| Criterio | Comprobación | Evidencia a conservar |
| --- | --- | --- |
| Aceptación | Cada criterio de la HU tiene resultado | Identificador y resultado por criterio |
| Integración | La capacidad usa contratos vigentes | Commit y flujo completo |
| Calidad técnica | Tipos, pruebas y build pertinentes | Comando, salida y ambiente |
| Seguridad | Rol y pertenencia de recursos revisados | Casos positivos y negativos |
| Persistencia | Efectos esperados y rechazo consistente | Datos antes y después |
| Interfaz | Estados y errores comprensibles | Capturas o revisión del dispositivo |
| Documentación | Cambios de contrato o uso explicados | Documento y versión |
| Demostración | El incremento puede repetirse | Procedimiento y datos de prueba |

# Aplicación por dominio

## Ventas y pagos

Se comprueba que el total se obtiene de precios vigentes en servidor, que descuento y pagos son coherentes y que los productos pertenecen al negocio. El reintento con la misma clave no crea otra venta. Un rechazo no debe dejar descuento parcial de stock o deuda. Cuando la respuesta es ambigua, se consulta el estado sin cobrar otra vez en la terminal externa.

Los escenarios de Webpay y Mercado Pago académicos se identifican como simulaciones. La DoD de la historia de registro de pagos no acredita integración bancaria real. Si el usuario confirma manualmente un pago externo, se evalúa ese registro y su relación con caja, sin atribuir una confirmación automática del banco.

## Inventario y compras

Se verifica pertenencia del producto, cantidades válidas y estado de la operación. Una recepción actualiza existencias y cantidades recibidas de manera consistente. Las devoluciones no reponen más unidades de las descontadas. Cambios en controla_stock de ventas históricas deben considerarse al conciliar; el comportamiento necesita evidencia de casos que atraviesan distintas fechas y estados.

## Caja y fiado

La apertura respeta la regla de una sesión abierta por negocio. El cierre compara efectivo esperado y contado y exige motivo cuando hay diferencia. Un abono no debe exceder o duplicar el efecto autorizado sobre saldo. Se revisan pendientes de todas las cuentas y dispositivos del turno, ya que una cola de navegador no es una lista global.

## IA visual

La propuesta debe quedar editable, asociada al catálogo permitido y sin efectos de venta o recepción antes de confirmar. Se prueban imagen inválida, proveedor no configurado, respuesta incompleta y producto no encontrado. La evaluación visual real se registra separada de la normalización automatizada. No se declara precisión por aprobar un parser.

## PWA y offline

Se conserva ticket o cola ante error, se utiliza la clave original y se distingue pendiente de sincronizado. La sesión no debe enviar ventas de otra cuenta. Se revisa falta de Web Locks, almacenamiento no disponible, rechazos permanentes y reconexión. La instalación y cámara se prueban en dispositivos físicos; un navegador de escritorio no acredita uso en iPhone.

# Procedimiento de revisión

Antes de mover un elemento a Hecho, el responsable relaciona criterios de aceptación con evidencias. Otra persona del equipo revisa el flujo cuando sea posible y registra observaciones. Los resultados pendientes se mantienen explícitos. No es necesario reproducir todas las pruebas del sistema para un cambio menor; se seleccionan las pertinentes y la regresión afectada.

Para cambios que afectan ventas, stock o permisos se recomienda una ejecución integral sobre datos controlados. El registro incluye commit, fecha, ambiente, usuario de prueba y resultado. Las credenciales y datos sensibles quedan fuera de GitHub. Un error detectado después del cierre se documenta como defecto sin alterar retrospectivamente la evidencia original.

# Ejemplos de cumplimiento y no cumplimiento

Una historia de descuento cumple cuando se demuestra cálculo válido, rechazo del descuento fuera de rango y total coherente en la venta persistida. Una captura del campo descuento sin comprobar servidor y base no acredita el mismo resultado. Una historia de offline necesita comprobar recuperación y ausencia de duplicados, además de almacenar una entrada en la cola.

Un build exitoso con un caso de acceso cruzado fallando no cumple DoD. Tampoco cumple una prueba cuyo resultado no pueda relacionarse con el commit entregado. Si el caso productivo no se ejecutó, se conserva el resultado local y se aclara esa limitación; no se cambia su etiqueta a producción por conveniencia académica.

# Versionado de la definición

La versión 3.0 de esta documentación integra criterios detallados al 03 de octubre. Cambiar la DoD requiere dejar qué condición se añadió y cómo afecta trabajo pendiente. Las historias cerradas bajo un criterio anterior conservan su evidencia; las nuevas comprobaciones se incorporan como trabajo explícito si aún faltan.

# Registro de decisión por incremento

Para cada historia se registra identificador, criterio comprobado, versión, evidencia, defecto abierto y decisión del responsable de aceptación. Un resultado automatizado aprobado se acompaña de su alcance. Si exige PostgreSQL o un dispositivo real, la prueba con memoria o un doble de navegador se conserva como evidencia parcial.

La revisión del 04 de octubre aporta 78 pruebas automatizadas y 12 comprobaciones HTTP en memoria, además de compilación. Estos resultados se consultan en Informe de Verificación. La aplicación de DoD a cada historia requiere seleccionar sus criterios y completar las evidencias faltantes; las cifras globales no sustituyen esa decisión.

# Conclusiones

La DoD traduce calidad en verificaciones concretas del producto. En Localito su utilidad principal es conectar resultado funcional, integridad de datos y evidencia. Mantenerla visible permite explicar con precisión por qué offline sigue en curso y qué debe comprobarse antes de cerrar pagos o caja.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

Schwaber, K., y Sutherland, J. (2020). *The Scrum Guide*. https://scrumguides.org/scrum-guide.html

