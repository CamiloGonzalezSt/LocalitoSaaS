# Visión del producto Localito

# Resumen ejecutivo

La visión de Localito es facilitar que un comercio de barrio controle sus operaciones desde una plataforma accesible, con información relacionada y trazable. El producto reúne procesos que el dueño necesita reconciliar diariamente: ventas, existencias, caja, compras y fiado. La asistencia visual se integra para preparar información que el usuario confirma.

La visión establece dirección y criterios de valor, sin prometer adopción comercial, ahorros medidos ni prestaciones tributarias inexistentes. El Product Goal se mantiene alineado con el backlog vigente del proyecto. Los indicadores de impacto definidos aquí son propuestas de evaluación y todavía no resultados obtenidos.

# Introducción y propósito

Una visión ayuda a decidir qué funciones aportan al objetivo del comercio y cuáles pueden quedar fuera del MVP. Localito busca un flujo comprensible para atender y una base consistente para que el dueño revise su negocio. Agregar una capacidad aislada no es suficiente si introduce doble digitación o dificulta conciliar operaciones.

El documento toma Product Goal de la documentación Scrum y lo relaciona con necesidades y objetivos específicos [P]. La Guía Scrum permite fundamentar la función de ese objetivo dentro del Product Backlog [R6]. La visión aquí expresada es una formulación del equipo, no una cita de una empresa o producto externo.

# Formulación de la visión

Para dueños y vendedores de pequeños comercios que necesitan centralizar registros cotidianos, Localito ofrece una PWA SaaS que relaciona venta, stock, caja, compra y deuda. La propuesta prioriza operación desde dispositivos comunes, permisos por rol y ayuda visual sujeta a revisión. La experiencia debe permitir que el usuario comprenda el estado de una operación antes de tomar la siguiente decisión.

El producto se dirige principalmente a almacenes, minimarkets, botillerías y negocios con venta presencial e inventario. Los perfiles se utilizan para diseñar necesidades y tareas. No se presentan como personas entrevistadas ni como un estudio representativo del mercado chileno.

# Necesidades de los usuarios

## Dueño del negocio

El dueño necesita saber qué se vendió, qué falta comprar, qué dinero se registró y qué clientes mantienen deuda. También debe administrar quién puede modificar productos o consultar reportes. Para ese perfil, la calidad de la información pesa tanto como la rapidez de una pantalla: un total atractivo pierde utilidad si mezcla fiado con dinero recibido.

## Vendedor

El vendedor necesita localizar un producto, formar un ticket y cobrar sin pasos innecesarios. Cuando la red falla, debe reconocer si la venta quedó pendiente o confirmada. El flujo debe evitar que una respuesta ambigua lo lleve a cobrar nuevamente en una terminal externa. Los permisos limitan cambios que podrían afectar información sensible del dueño.

## Administrador de plataforma

El administrador necesita gestionar negocios, usuarios y estados de suscripción. Sus atribuciones deben permanecer separadas de la operación ordinaria de cada comercio. El panel de plataforma no implica que todos los vendedores puedan consultar otros negocios ni que los cobros de suscripción estén integrados con bancos reales.

# Propuesta de valor por proceso

| Necesidad | Respuesta del producto | Condición de valor |
| --- | --- | --- |
| Registrar venta sin repetir datos | POS con catálogo y ticket | Precio y total validados por servidor |
| Conocer existencias | Stock y kardex | Movimientos consistentes con operaciones |
| Controlar crédito | Cuenta y abonos | Saldo asociado a cliente y negocio |
| Revisar caja | Turnos y movimientos | Conciliar pagos y pendientes |
| Ingresar mercadería | Compra y factura asistida | Revisar cantidades y costo antes de confirmar |
| Operar con conectividad variable | PWA y cola limitada | Recuperación visible y segura de pendientes |

# Product Goal y límites del MVP

El Product Goal consiste en entregar una PWA SaaS para gestionar ventas, inventario, clientes, caja, compras y reportes de forma simple y segura. Su evaluación requiere casos operativos completos. El producto no debe dispersarse hacia e-commerce, múltiples sucursales o funcionalidades tributarias si eso impide validar las relaciones centrales.

Los planes Básico y Pro forman parte del modelo comercial declarado: 9.990 y 19.990 pesos chilenos mensuales, con prueba de 30 días. Los montos se verificaron en packages/shared/src/subscriptions.ts y coinciden con el README. Son parámetros del proyecto, no precios de mercado verificados ni evidencia de clientes pagando. El control de prestaciones existe en packages/shared y la API; el cobro real recurrente es una expansión distinta.

# Diferenciación y comprobación de valor

La diferencia propuesta se concentra en combinar gestión operacional, acceso web móvil e IA asistida. No se sostiene que los POS o la lectura visual sean una invención inédita. El aporte del equipo es integrar esas capacidades en un flujo delimitado para el problema del comercio y explicar las reglas que mantienen consistencia.

El modelo de producto debe probar el valor de cada función. En Venta Rápida, conviene comparar búsqueda manual, código de barras y fotografía con productos equivalentes. En factura, comparar tiempo de digitación y corrección. Si la revisión de una propuesta tarda más que escribirla, la función requiere mejora; no basta con que el proveedor devuelva texto.

# Indicadores propuestos

| Indicador | Cómo medirlo | Estado |
| --- | --- | --- |
| Tiempo de preparar ticket | Inicio de tarea a ticket revisado | Propuesto sin medición |
| Correcciones de IA | Líneas corregidas entre líneas sugeridas | Propuesto sin medición |
| Consistencia de inventario | Stock esperado frente a stock final | Casos documentados por ejecutar |
| Comprensión del estado offline | Usuario distingue pendiente y confirmado | UAT pendiente |
| Recuperación de deuda | Abono y saldo antes y después | Validación integral pendiente |
| Facilidad de instalación | Pasos completos sin asistencia adicional | Reproducción pendiente |

La muestra, dispositivos, experiencia de usuarios y condiciones de conexión deben registrarse. Un porcentaje sin denominador o una prueba con un único producto no permite generalizar. Las métricas se utilizarán para revisar decisiones y backlog, no para fabricar resultados favorables.

# Criterios de priorización

Se prioriza el núcleo que evita pérdida de datos y permite atender: identidad, catálogo y venta. Después se consolidan stock, caja y fiado. Las capacidades visuales requieren ese catálogo y reglas previas. El backlog también contiene trabajo de calidad y documentación; ambos aportan valor porque hacen verificable y mantenible el incremento.

La priorización utiliza valor, riesgo y dependencia. Los Sprints futuros pueden orientarse por esa dirección, pero sus historias no se comprometen antes de Planning. La visión orienta el producto sin fijar un calendario ficticio de capacidades ya aceptadas.

# Capacidades y usuarios definidos en el repositorio
## Usuarios objetivo

Localito está pensado principalmente para:

- almacenes de barrio;
- minimarkets;
- botillerías;
- pequeños comercios con inventario y venta presencial;
- negocios que trabajan con fiado;
- dueños que necesitan controlar caja, stock y reportes;
- vendedores que requieren una interfaz rápida y simple para atender.

El modelo de roles actual contempla:

| Rol | Responsabilidad principal |
| --- | --- |
| `system_admin` | Administración de la plataforma, locales, usuarios y estado de suscripciones. |
| `owner` | Gestión integral del negocio: inventario, caja, clientes, compras, reportes y configuración. |
| `seller` | Operación diaria de ventas, inventario consultable, clientes y caja según permisos. |


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


## Planes y permisos

Todo negocio nuevo recibe una prueba de **Localito Pro por 30 días**. `suscripciones` es la fuente de verdad para plan, estado, periodos y referencia futura del proveedor de cobro. La API valida los permisos en cada operación y la interfaz oculta o deriva a **Mi plan** cuando una función no corresponde.

- **Básico ($9.990/mes):** ventas, catálogo, inventario, caja e importación masiva.
- **Pro ($19.990/mes):** agrega clientes, fiado, proveedores, compras, reportes avanzados, auditoría, alertas y Venta Rápida con foto.
- Al vencer, los datos no se borran: quedan disponibles en modo lectura y las mutaciones responden `403` hasta reactivar.

La selección por transferencia registra un `pendingPlan`: no activa funciones sin confirmación ni interrumpe una prueba vigente. Las opciones Webpay y Mercado Pago de esta pantalla son únicamente una aprobación sandbox para demostrar el flujo. El cobro recurrente automático con un proveedor externo continúa fuera del MVP académico.


## Alcance pendiente

- Cumplimiento tributario chileno, excluido por decisión de esta iteración.
- Integración real con terminales, Webpay o Mercado Pago, excluida del MVP de tesis: los pagos externos se registran manualmente y las simulaciones no cobran dinero.
- Configuración de un proveedor real de correo en Vercel; el flujo de recuperación está implementado, pero requiere credenciales de Gmail o Resend para enviar correos.
- Avisos automáticos por correo distintos de la recuperación de contraseña.
- Múltiples sucursales, e-commerce público, fidelización y facturación de la suscripción SaaS; son expansiones de producto y no forman parte del núcleo operacional entregado aquí.

El ticket generado por Localito es un comprobante interno no tributario.

# Conclusiones

La visión propone una herramienta concreta para relacionar la operación del comercio y mejorar el control del dueño. Su evaluación debe centrarse en tareas y datos, no en promesas. El siguiente aprendizaje relevante consiste en comprobar comprensión, consistencia y utilidad de la ayuda visual con usuarios y ambientes controlados.

# Referencias y evidencia de la versión

Las referencias externas fundamentan conceptos y organización. La descripción específica de Localito procede del repositorio. Se consultaron fuentes públicas el 03 de octubre de 2026. Las fichas públicas ISO se utilizan para alcance y orientación, sin atribuir acceso al texto normativo completo ni conformidad certificada.

[R6] Schwaber K y Sutherland J 2020. The Scrum Guide. https://scrumguides.org/scrum-guide.html

[P] Equipo Localito. Repositorio LocalitoSaaS. Commit base 05a6f34b749cdc97dd560d91bb9be057a1197fbf. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/05a6f34b749cdc97dd560d91bb9be057a1197fbf

Fuentes internas revisadas: README.md; package.json y manifests de apps; apps/api/src/server.ts, repository.ts y auth.ts; db/schema.sql; apps/web/src/lib/offline.ts y workspaceCache.ts; docs de requisitos, calidad, operación y Scrum. La revisión es documental y estática. No crea resultados de pruebas funcionales, reuniones ni aceptación de usuario.
