# Visión del producto Localito

# Resumen ejecutivo

La visión de Localito es facilitar que un comercio de barrio controle sus operaciones desde una plataforma accesible, con información relacionada y trazable. El producto reúne procesos que el dueño necesita reconciliar diariamente: ventas, existencias, caja, compras y fiado. La asistencia visual se integra para preparar información que el usuario confirma.

La visión establece dirección y criterios de valor, sin prometer adopción comercial, ahorros medidos ni prestaciones tributarias inexistentes. El Product Goal se mantiene alineado con el backlog vigente del proyecto. Los indicadores de impacto definidos aquí son propuestas de evaluación y todavía no resultados obtenidos.

# Introducción y propósito

Una visión ayuda a decidir qué funciones aportan al objetivo del comercio y cuáles pueden quedar fuera del MVP. Localito busca un flujo comprensible para atender y una base consistente para que el dueño revise su negocio. Agregar una capacidad aislada no es suficiente si introduce doble digitación o dificulta conciliar operaciones.

El documento toma Product Goal de la documentación Scrum y lo relaciona con necesidades y objetivos específicos (Equipo Localito, 2026). La Guía Scrum permite fundamentar la función de ese objetivo dentro del Product Backlog (Schwaber y Sutherland, 2020). La visión aquí expresada es una formulación del equipo, no una cita de una empresa o producto externo.

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

# Evidencias relacionadas con esta versión

El Informe Académico conecta objetivos, método, antecedentes y resultados. La Matriz de Trazabilidad identifica requisitos e historias asociados a la implementación. El Informe de Verificación conserva las ejecuciones del 04 de octubre de 2026 y distingue su alcance local de la aceptación en PostgreSQL y con usuarios. Control de Entrega reúne la cobertura de los 17 artefactos y los pendientes de cierre.

# Conclusiones

La visión propone una herramienta concreta para relacionar la operación del comercio y mejorar el control del dueño. Su evaluación debe centrarse en tareas y datos, no en promesas. El siguiente aprendizaje relevante consiste en comprobar comprensión, consistencia y utilidad de la ayuda visual con usuarios y ambientes controlados.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

Schwaber, K., y Sutherland, J. (2020). *The Scrum Guide*. https://scrumguides.org/scrum-guide.html

