# Plan de pruebas de Localito

# Resumen ejecutivo

El plan verifica funcionalidades, integridad, permisos, regresión y operación del MVP. La fuente mantiene casos manuales con estados explícitos y pruebas automatizadas en código. Esta versión desarrolla procedimiento, ambiente, criterios de salida y catálogo de casos, conservando pendientes. Incluye una campaña adicional del 04 de octubre: tipos y build aprobados, 78 pruebas automatizadas y 12 casos HTTP locales aprobados. El comando agregado npm run check se bloqueó en el lanzador; el Informe de verificación explica la ejecución alternativa y sus límites.

# Introducción y objetivos

La evaluación requiere relacionar requisitos y resultados. Se prueba venta y efecto sobre stock; fiado y saldo; compra y recepción; permisos y aislamiento. Los tipos, build y pruebas de lógica detectan errores distintos. Node proporciona el ejecutor de pruebas utilizado por el proyecto (Node.js, s. f.), sin que su existencia acredite cobertura suficiente.

# Alcance y niveles de prueba

Las pruebas de lógica revisan funciones de cálculo y validación. Las de integración deben comprobar las relaciones entre API y PostgreSQL. La regresión visual revisa estados y legibilidad; UAT revisa tareas con usuarios. Las pruebas de dispositivo evalúan cámara, PWA y almacenamiento. Cada resultado conserva el nivel y ambiente donde se obtuvo.

Una prueba MemoryRepository no verifica locks ni concurrencia SQL. La ejecución actual se acredita únicamente mediante el TAP y los resultados HTTP identificados en el Informe de verificación. Los registros históricos se describen como históricos y los estados manuales se mantienen según su matriz.

# Ambiente y datos

El ambiente propuesto utiliza una base aislada, dos negocios, owner y seller por negocio, productos activos e inactivos y clientes con distintas condiciones de crédito. Se registran commit, versiones, hora, red y navegador. Las imágenes de factura y productos deben ser sintéticas o autorizadas y no incluir información privada del negocio real.

El stock inicial de cada caso se fija antes de comenzar. Las ventas concurrentes utilizan el mismo producto controlado; los reintentos conservan la clave original. Las pruebas que requieren limpieza deben describirla y evitar alterar datos de producción. Si no hay ambiente seguro, se conserva pendiente.

# Ejecución automatizada y alcance real

```bash
npm ci
npm run check
```

package.json define check como typecheck, test y build. El script test utiliza tsx con el ejecutor Node y archivos de API y scripts. El workflow de CI ejecuta instalación reproducible y ese comando. Su presencia se comprobó estáticamente; para acreditar ejecución se debe consultar la corrida específica y guardar su resultado.

# Criterios de entrada y salida

Se inicia con ambiente accesible, datos preparados y alcance conocido. Se considera salida de una campaña cuando los casos seleccionados tienen resultado y los defectos críticos están resueltos o el incremento permanece pendiente. No se aprueba una campaña porque solo se ejecutaron casos favorables. Rechazos y efectos sobre datos forman parte del resultado.

Los defectos incluyen identificador, pasos, esperado, obtenido, entorno y evidencia. Una respuesta ambigua posterior al commit exige revisar la venta antes de repetir. El fallo de captura no equivale al fallo funcional y debe documentarse por separado.

# Catálogo de casos de la matriz

Cada caso conserva el estado original. Para ejecutarlo se deben completar precondiciones específicas y registrar ambiente, commit, estado anterior y posterior y evidencia. La nueva campaña AUT/HTTP se registra por separado; no se atribuye a los CP manuales una ejecución que no se realizó. Las diferencias de puertos o rutas de las instrucciones históricas se ajustan al ambiente auditado antes de la campaña; Vite utiliza 5173 por defecto.

## CP-01 Inicio de sesión dueño

Módulo. Autenticación.

Procedimiento de la fuente. Ingresar correo y clave demo.

Resultado esperado. El sistema muestra panel del dia y nombre del usuario.

Estado registrado. Pendiente evidencia. 

## CP-02 Rechazo de clave incorrecta

Módulo. Autenticación.

Procedimiento de la fuente. Ingresar usuario válido con clave incorrecta.

Resultado esperado. El sistema responde credenciales inválidas.

Estado registrado. Pendiente evidencia. 

## CP-03 Crear producto

Módulo. Productos.

Procedimiento de la fuente. Ir a Stock, completar formulario y crear.

Resultado esperado. Producto aparece en inventario y puede venderse.

Estado registrado. Pendiente evidencia. 

## CP-04 Editar producto

Módulo. Productos.

Procedimiento de la fuente. Seleccionar editar, cambiar precio o stock minimo, guardar.

Resultado esperado. Producto refleja cambios.

Estado registrado. Pendiente evidencia. 

## CP-05 Desactivar producto

Módulo. Productos.

Procedimiento de la fuente. Presionar desactivar en un producto.

Resultado esperado. Producto deja de aparecer en inventario activo.

Estado registrado. Pendiente evidencia. 

## CP-06 Alerta de stock bajo

Módulo. Stock.

Procedimiento de la fuente. Dejar stock menor o igual al minimo.

Resultado esperado. Dashboard muestra alerta.

Estado registrado. Pendiente evidencia. 

## CP-07 Venta normal

Módulo. Ventas.

Procedimiento de la fuente. Agregar producto al ticket y confirmar con efectivo.

Resultado esperado. Se registra venta, baja stock y se muestra comprobante.

Estado registrado. Pendiente evidencia. 

## CP-08 Venta fiada

Módulo. Ventas.

Procedimiento de la fuente. Seleccionar metodo fiado, elegir cliente y confirmar.

Resultado esperado. Se registra venta y aumenta deuda del cliente.

Estado registrado. Pendiente evidencia. 

## CP-09 Anular venta

Módulo. Ventas.

Procedimiento de la fuente. Ir a Reportes y anular venta activa.

Resultado esperado. Venta queda anulada y stock se restaura.

Estado registrado. Pendiente evidencia. 

## CP-10 Imprimir comprobante

Módulo. Ticket.

Procedimiento de la fuente. Confirmar venta y presionar imprimir.

Resultado esperado. Se abre diálogo de impresión con ticket interno.

Estado registrado. Pendiente evidencia. 

## CP-11 Compartir comprobante

Módulo. Ticket.

Procedimiento de la fuente. Confirmar venta y presionar compartir.

Resultado esperado. En móvil se abre menú nativo o se copia texto.

Estado registrado. Pendiente evidencia. 

## CP-12 Crear cliente

Módulo. Clientes.

Procedimiento de la fuente. Ir a Fiado, ingresar nombre y contacto.

Resultado esperado. Cliente aparece en cuentas por cobrar.

Estado registrado. Pendiente evidencia. 

## CP-13 Editar cliente

Módulo. Clientes.

Procedimiento de la fuente. Seleccionar editar, cambiar teléfono y guardar.

Resultado esperado. Cliente refleja el nuevo dato.

Estado registrado. Pendiente evidencia. 

## CP-14 Registrar abono

Módulo. Clientes.

Procedimiento de la fuente. Ingresar monto y presionar abono.

Resultado esperado. Deuda disminuye.

Estado registrado. Pendiente evidencia. 

## CP-15 Reconocer una fotografía

Módulo. Venta Rápida.

Procedimiento de la fuente. Fotografiar uno o más productos desde Venta Rápida.

Resultado esperado. Propone productos y cantidades usando exclusivamente el catálogo del negocio.

Estado registrado. Normalización automatizada aprobada; visual pendiente. 

## CP-16 Reconocer por código

Módulo. Código de barras.

Procedimiento de la fuente. Crear producto con código real, abrir **Venta Rápida → Vender con código de barras** y leer o ingresar `7801610001347`.

Resultado esperado. Localito encuentra el producto exacto sin depender del análisis visual.

Estado registrado. Pendiente evidencia. 

## CP-17 Corregir propuesta

Módulo. Venta Rápida.

Procedimiento de la fuente. Cambiar cantidad, reemplazar un producto ambiguo y eliminar otro.

Resultado esperado. El total se recalcula con precios del inventario y la propuesta queda bajo control del vendedor.

Estado registrado. Pendiente evidencia. 

## CP-18 Caja en vivo

Módulo. Caja.

Procedimiento de la fuente. Ir a Reportes.

Resultado esperado. Muestra efectivo, tarjeta, transferencia, fiado, total y anuladas.

Estado registrado. Pendiente evidencia. 

## CP-19 Cierre manual

Módulo. Caja.

Procedimiento de la fuente. Escribir observacion y presionar Cerrar caja.

Resultado esperado. Se guarda un cierre con totales, usuario, fecha/hora y observacion.

Estado registrado. Pendiente evidencia. 

## CP-20 Crear usuario interno

Módulo. Usuarios.

Procedimiento de la fuente. Ir a Configuración, crear vendedor.

Resultado esperado. Usuario aparece en lista de usuarios activos.

Estado registrado. Pendiente evidencia. 

## CP-21 Desactivar usuario

Módulo. Usuarios.

Procedimiento de la fuente. Desactivar usuario creado.

Resultado esperado. Usuario deja de aparecer como activo.

Estado registrado. Pendiente evidencia. 

## CP-22 Uso desde iPhone

Módulo. Mobile.

Procedimiento de la fuente. Abrir `http://IP-DEL-PC:5174`.

Resultado esperado. PWA carga y consume API del PC mediante el proxy local.

Estado registrado. Pendiente evidencia. 

## CP-23 Instalabilidad

Módulo. PWA.

Procedimiento de la fuente. Abrir con HTTPS o entorno compatible y agregar a inicio.

Resultado esperado. App se comporta como PWA instalable.

Estado registrado. Pendiente evidencia. 

## CP-24 Vendedor sin reportes completos

Módulo. Permisos.

Procedimiento de la fuente. Iniciar como vendedor y entrar a Caja.

Resultado esperado. Solo ve caja en vivo, cierre y ultimos cierres.

Estado registrado. Pendiente evidencia. 

## CP-25 Vendedor sin administracion de productos

Módulo. Permisos.

Procedimiento de la fuente. Iniciar como vendedor y entrar a Stock.

Resultado esperado. Ve inventario solo lectura, sin crear, editar, ajustar o desactivar.

Estado registrado. Pendiente evidencia. 

## CP-26 API rechaza acción administrativa

Módulo. Permisos.

Procedimiento de la fuente. Llamar endpoint admin con token de vendedor.

Resultado esperado. API responde 403 sin ejecutar acción.

Estado registrado. Pendiente evidencia. 

## CP-27 Editar perfil propio

Módulo. Perfil.

Procedimiento de la fuente. Iniciar como vendedor o dueño, entrar a Mi perfil/Configuración, cambiar nombre o correo y guardar.

Resultado esperado. El perfil se actualiza sin cambiar rol ni permisos.

Estado registrado. Pendiente evidencia. 

## CP-28 Vendedor no administra usuarios

Módulo. Usuarios.

Procedimiento de la fuente. Iniciar como vendedor y entrar a Mi perfil.

Resultado esperado. No aparece el formulario de crear usuarios ni la lista administrativa.

Estado registrado. Pendiente evidencia. 

## CP-29 Compartir simulación

Módulo. Simulación Webpay fiado.

Procedimiento de la fuente. Entrar a Fiado, presionar Simular cobro en cliente con deuda.

Resultado esperado. Se genera una tarjeta de demostración con enlace, compartir, WhatsApp y copiar; no se envía dinero.

Estado registrado. Pendiente evidencia. 

## CP-30 Confirmar simulación

Módulo. Simulación Webpay fiado.

Procedimiento de la fuente. Generar la simulación y presionar Confirmar simulación.

Resultado esperado. La deuda disminuye por el monto de prueba, sin consultar ni cobrar mediante Transbank.

Estado registrado. Pendiente evidencia. 

## CP-31 Crear negocio

Módulo. Administración.

Procedimiento de la fuente. Registrar negocio, dueño y clave desde Crear cuenta o como administrador.

Resultado esperado. Se crea un tenant aislado y una prueba Pro de 30 días.

Estado registrado. Pendiente evidencia. 

## CP-32 Cerrar sesión

Módulo. Seguridad.

Procedimiento de la fuente. Cerrar sesión y reutilizar el token anterior.

Resultado esperado. El token queda revocado y la API responde 401.

Estado registrado. Pendiente evidencia. 

## CP-33 Intentar cambiar negocio por cabecera

Módulo. Multi-tenant.

Procedimiento de la fuente. Enviar una cabecera `x-tenant-id` distinta con un token válido.

Resultado esperado. La API ignora la cabecera y deriva el negocio desde la sesión.

Estado registrado. Pendiente evidencia. 

## CP-34 Pago dividido

Módulo. Ventas.

Procedimiento de la fuente. Vender usando efectivo y tarjeta por montos que sumen el total.

Resultado esperado. La venta queda con metodo mixto y caja separa ambos montos.

Estado registrado. Pendiente evidencia. 

## CP-35 Reintento idempotente

Módulo. Ventas.

Procedimiento de la fuente. Repetir una venta con la misma clave de idempotencia.

Resultado esperado. Se devuelve la misma venta y el stock baja una sola vez.

Estado registrado. Automatizada aprobada. 

## CP-36 Devolución parcial

Módulo. Devoluciones.

Procedimiento de la fuente. Devolver una unidad de una venta de varias unidades.

Resultado esperado. Se repone solo esa unidad y se ajustan venta neta y deuda.

Estado registrado. Automatizada aprobada. 

## CP-37 Evitar doble reposicion

Módulo. Devoluciones.

Procedimiento de la fuente. Devolver parcialmente y luego anular la venta.

Resultado esperado. Solo se repone la cantidad restante.

Estado registrado. Automatizada aprobada. 

## CP-38 Aplicar limite de fiado

Módulo. Credito.

Procedimiento de la fuente. Superar el cupo configurado del cliente.

Resultado esperado. La API rechaza la venta sin descontar stock.

Estado registrado. Automatizada aprobada. 

## CP-39 Apertura y cierre de turno

Módulo. Caja.

Procedimiento de la fuente. Abrir con fondo inicial, registrar gasto, contar y cerrar.

Resultado esperado. Se informa efectivo esperado y diferencia.

Estado registrado. Automatizada aprobada. 

## CP-40 Segundo turno del dia

Módulo. Caja.

Procedimiento de la fuente. Cerrar un turno y abrir otro el mismo dia.

Resultado esperado. El segundo turno no vuelve a sumar ventas del primero.

Estado registrado. Pendiente evidencia. 

## CP-41 Recibir orden

Módulo. Compras.

Procedimiento de la fuente. Crear proveedor y orden, luego recibir mercaderia.

Resultado esperado. Aumenta stock, registra kardex y recalcula costo promedio.

Estado registrado. Automatizada aprobada. 

## CP-42 Alerta de vencimiento

Módulo. Inventario.

Procedimiento de la fuente. Asignar vencimiento dentro de 30 dias.

Resultado esperado. Gestion muestra alerta del producto.

Estado registrado. Pendiente evidencia. 

## CP-43 Importar y exportar CSV

Módulo. Datos.

Procedimiento de la fuente. Exportar catálogo e importar un archivo válido.

Resultado esperado. Se descarga CSV y se crean filas validas.

Estado registrado. Pendiente evidencia. 

## CP-44 Venta sin conexión

Módulo. Offline.

Procedimiento de la fuente. Perder red al confirmar, recargar con API caída y recuperarla.

Resultado esperado. Cola por cuenta y catálogo guardado; venta se sincroniza una vez.

Estado registrado. Automatizada en navegador local aprobada: `test-improvements.cjs`. 

## CP-45 Reconocer envase

Módulo. Vision.

Procedimiento de la fuente. Configurar `GROQ_API_KEY` (o `OPENAI_API_KEY`), fotografiar un producto catalogado.

Resultado esperado. La API propone coincidencia con confianza y permite corregir.

Estado registrado. Pendiente evidencia. 

## CP-46 Recuperar contraseña

Módulo. Seguridad.

Procedimiento de la fuente. Solicitar el enlace, cambiar la clave y volver a usar el enlace.

Resultado esperado. La nueva clave funciona, sesiones anteriores quedan revocadas y el enlace no puede reutilizarse.

Estado registrado. Automatizada aprobada. 

## CP-47 Extraer factura

Módulo. Factura IA.

Procedimiento de la fuente. Fotografiar una factura legible desde Negocio.

Resultado esperado. Propone proveedor, folio, fecha, totales y líneas con confianza y advertencias.

Estado registrado. Esquema automatizado aprobado; visual aprobado. 

## CP-48 Reutilizar catálogo

Módulo. Factura IA.

Procedimiento de la fuente. Leer una línea cuyo código o nombre corresponde a un producto activo.

Resultado esperado. La línea queda marcada En inventario y no crea otro producto.

Estado registrado. Automatizada aprobada. 

## CP-49 Crear producto faltante

Módulo. Factura IA.

Procedimiento de la fuente. Confirmar una línea marcada Producto nuevo con nombre, categoría y precio de venta.

Resultado esperado. Crea el producto y lo recibe con el stock y costo confirmados.

Estado registrado. Automatizada aprobada. 

## CP-50 Exigir revisión

Módulo. Factura IA.

Procedimiento de la fuente. Vaciar cantidad o precio de venta de una línea.

Resultado esperado. Confirmar e ingresar queda deshabilitado y la API rechaza valores inválidos.

Estado registrado. Automatizada aprobada. 

## CP-51 Evitar doble ingreso

Módulo. Factura IA.

Procedimiento de la fuente. Reintentar con la misma clave o volver a cargar el mismo folio.

Resultado esperado. Devuelve la compra previa o rechaza el duplicado; el stock aumenta una sola vez.

Estado registrado. Automatizada aprobada. 

## CP-52 Permisos

Módulo. Factura IA.

Procedimiento de la fuente. Intentar analizar o importar con token de vendedor.

Resultado esperado. La API responde 403 y no cambia inventario.

Estado registrado. Importación CSV comprobada con 403; factura pendiente evidencia. 

## CP-53 Apertura automática

Módulo. Carga inicial.

Procedimiento de la fuente. Crear un local sin productos e iniciar sesión como dueño.

Resultado esperado. Abre automáticamente el asistente y sugiere categorías según el rubro.

Estado registrado. Visual aprobada a 320 px. 

## CP-54 Importación masiva

Módulo. Carga inicial.

Procedimiento de la fuente. Subir una plantilla CSV con dos productos válidos y una fila inválida.

Resultado esperado. Muestra vista previa, omite la fila inválida y crea los dos productos válidos.

Estado registrado. Automatizada y visual aprobadas. 

## CP-55 Evitar duplicados

Módulo. Carga inicial.

Procedimiento de la fuente. Reintentar la misma carga y subir un producto con código o nombre ya existente.

Resultado esperado. No crea duplicados e informa las filas ya existentes.

Estado registrado. Automatizada aprobada. 

## CP-56 Reanudar o posponer

Módulo. Carga inicial.

Procedimiento de la fuente. Elegir un método, recargar y luego presionar Hacerlo después.

Resultado esperado. Recupera el método elegido; al posponer no fuerza nuevamente el asistente y permanece accesible desde el menú.

Estado registrado. Reanudación y acceso posterior aprobados. 

## CP-57 Un producto

Módulo. Venta Rápida A.

Procedimiento de la fuente. Analizar una foto con un producto catalogado.

Resultado esperado. Muestra una línea lista con cantidad 1 y precio obtenido del inventario.

Estado registrado. Automatizada aprobada. 

## CP-58 Varios productos

Módulo. Venta Rápida B.

Procedimiento de la fuente. Analizar una foto con productos distintos.

Resultado esperado. Devuelve líneas separadas y calcula el total con precios locales.

Estado registrado. Automatizada aprobada. 

## CP-59 Unidades repetidas

Módulo. Venta Rápida C.

Procedimiento de la fuente. Analizar varias unidades iguales o una respuesta repetida para el mismo ID.

Resultado esperado. Agrupa el producto y suma las cantidades.

Estado registrado. Automatizada aprobada. 

## CP-60 Producto no encontrado

Módulo. Venta Rápida D.

Procedimiento de la fuente. Analizar un objeto sin coincidencia de catálogo.

Resultado esperado. Lo marca Producto no reconocido y permite buscar o ignorar; no crea inventario.

Estado registrado. Automatizada y visual aprobadas mediante código desconocido y corrección manual. 

## CP-61 Detección ambigua

Módulo. Venta Rápida E.

Procedimiento de la fuente. Devolver una coincidencia de confianza media con varias alternativas.

Resultado esperado. Exige selección o confirmación antes de habilitar Agregar a la venta.

Estado registrado. Automatizada aprobada; visual pendiente. 

## CP-62 Stock insuficiente

Módulo. Venta Rápida F.

Procedimiento de la fuente. Detectar cantidad superior al stock registrado.

Resultado esperado. Advierte detectado versus stock y aplica la misma regla del POS al agregar.

Estado registrado. Automatizada y visual aprobadas; el POS rechazó cantidad 29 con stock 28. 

## CP-63 Falla de IA

Módulo. Venta Rápida G.

Procedimiento de la fuente. Simular error o servicio no configurado.

Resultado esperado. Mantiene la foto y ofrece reintentar sin modificar ticket ni stock.

Estado registrado. Endpoint aprobado sin clave (503 controlado); interacción visual pendiente. 

## CP-64 Cámara rechazada

Módulo. Venta Rápida H.

Procedimiento de la fuente. Rechazar permiso de cámara.

Resultado esperado. Explica brevemente el permiso y ofrece cámara del teléfono o subir foto.

Estado registrado. Pendiente dispositivo real. 

## CP-65 Foto sin productos

Módulo. Venta Rápida I.

Procedimiento de la fuente. Analizar una imagen sin productos claros.

Resultado esperado. Muestra No encontramos productos claramente visibles y permite otra foto.

Estado registrado. Automatizada aprobada; visual pendiente. 

## CP-66 Integración POS

Módulo. Venta Rápida J.

Procedimiento de la fuente. Confirmar productos revisados y presionar Agregar a la venta.

Resultado esperado. Abre el ticket POS existente; stock y kardex no cambian hasta confirmar el cobro.

Estado registrado. Automatizada y visual aprobadas; cantidad 2 llegó al ticket y el stock permaneció en 28. 

## CP-67 Menú por rol

Módulo. Navegación.

Procedimiento de la fuente. Iniciar como dueño y vendedor en móvil/escritorio.

Resultado esperado. Dueño ve 7 áreas; vendedor ve Vender, Inventario, Clientes y Caja; funciones secundarias no duplican navegación.

Estado registrado. Typecheck y revisión móvil aprobados. 

## CP-68 Medios después de Cobrar

Módulo. POS.

Procedimiento de la fuente. Agregar producto y observar ticket antes de pulsar Cobrar.

Resultado esperado. Los medios de pago no aparecen hasta solicitar el cobro.

Estado registrado. Visual móvil aprobada. 

## CP-69 Confirmación de pago externo

Módulo. POS.

Procedimiento de la fuente. Elegir tarjeta, transferencia o Webpay.

Resultado esperado. Registrar venta queda deshabilitado hasta marcar pago aprobado; antes de eso no existe venta ni baja stock.

Estado registrado. Visual y API local aprobadas con tarjeta. 

## CP-70 Prueba Pro al crear local

Módulo. Suscripción.

Procedimiento de la fuente. Crear tenant desde plataforma.

Resultado esperado. Se crea suscripción Pro `trialing` por 30 días y bootstrap entrega entitlements.

Estado registrado. Automatizada aprobada. 

## CP-71 Plan Básico

Módulo. Suscripción.

Procedimiento de la fuente. Cambiar a Básico e intentar clientes, IA o compras desde UI/API.

Resultado esperado. Navegación oculta función y API responde 403; ventas, inventario y caja siguen disponibles.

Estado registrado. UI y HTTP aprobados: productos 200, clientes 403 y Venta Rápida deriva a Mi plan. 

## CP-72 Vencimiento solo lectura

Módulo. Suscripción.

Procedimiento de la fuente. Vencer prueba/período y consultar/modificar datos.

Resultado esperado. Consultas del plan siguen disponibles; mutaciones responden 403 y los datos permanecen.

Estado registrado. HTTP/UI aprobados: productos GET 200, POST 403 y controles POS deshabilitados. 

## CP-73 Métricas SaaS

Módulo. Plataforma.

Procedimiento de la fuente. Entrar como `system_admin`.

Resultado esperado. Muestra locales, pruebas activas, MRR estimado y controles de plan/estado por tenant.

Estado registrado. Visual aprobada; activación Basic actualizó MRR de $59.970 a $49.970. 

## CP-74 Claro, oscuro y sistema

Módulo. Apariencia.

Procedimiento de la fuente. Cambiar el control Apariencia del lateral en escritorio o del menú móvil y recargar.

Resultado esperado. Tema persiste por usuario, mantiene contraste y respeta preferencia del sistema.

Estado registrado. Claro predeterminado y Oscuro persistido tras recarga a 390 px. 

## CP-75 Sin zoom ni desborde

Módulo. Responsive.

Procedimiento de la fuente. Revisar Inicio, Vender, Inventario y formularios a 390 × 844.

Resultado esperado. `scrollWidth` no supera el viewport y la navegación inferior no tapa controles esenciales.

Estado registrado. Aprobada en 390 × 844. 

## CP-76 Jerarquía diaria

Módulo. Inicio.

Procedimiento de la fuente. Entrar como owner.

Resultado esperado. Ventas de hoy domina; muestra acciones Vender/Agregar producto/Ver caja, atención y cuatro métricas útiles.

Estado registrado. Visual aprobada a 390 y 1440 px; sin desborde. 

## CP-77 Editar identidad

Módulo. Negocio.

Procedimiento de la fuente. Cambiar nombre, rubro, dirección y teléfono desde el engranaje de Configuración.

Resultado esperado. API persiste el tenant, actualiza sesión y registra auditoría sin permitir cambiar `active`.

Estado registrado. Automatizada y visual/HTTP aprobadas con mensaje Datos del negocio guardados. 

## CP-78 Solicitud durante trial

Módulo. Suscripción.

Procedimiento de la fuente. Solicitar Basic mientras existe trial Pro.

Resultado esperado. Mantiene Pro `trialing`, registra `pendingPlan=basic` y no corta acceso.

Estado registrado. Automatizada aprobada. 

## CP-79 Activación manual

Módulo. Suscripción.

Procedimiento de la fuente. Como system_admin activar un tenant con plan solicitado.

Resultado esperado. Aplica plan solicitado, crea período, limpia pendiente y audita.

Estado registrado. Visual/HTTP aprobada: solicitud Basic desapareció y plan quedó active. 

## CP-80 Vencido con lectura

Módulo. Suscripción.

Procedimiento de la fuente. Vencer plan Pro y entrar a Clientes/Reportes.

Resultado esperado. Datos del plan siguen visibles; botones operativos deshabilitados y API rechaza mutaciones.

Estado registrado. UI y HTTP aprobados con banner y productos del POS deshabilitados. 

## CP-81 Embudo SaaS

Módulo. Plataforma.

Procedimiento de la fuente. Entrar como system_admin.

Resultado esperado. Muestra Basic, Pro, past_due, expirados, pruebas nuevas, conversión y MRR.

Estado registrado. Visual aprobada en panel system_admin. 

## CP-82 Predeterminado Claro

Módulo. Apariencia.

Procedimiento de la fuente. Iniciar con un usuario sin preferencia guardada.

Resultado esperado. Localito abre en Claro; Oscuro/Sistema quedan como selección explícita persistida.

Estado registrado. Visual aprobada: dataset light inicial y selector Claro presionado. 

## CP-83 Crear empresa nueva

Módulo. Registro público.

Procedimiento de la fuente. Completar negocio, dueño, correo y clave desde el login.

Resultado esperado. Crea tenant aislado, sesión owner y prueba Pro de 30 días.

Estado registrado. Automatizada y HTTP local aprobadas. 

## CP-84 Solicitar enlace sin proveedor de correo

Módulo. Recuperación.

Procedimiento de la fuente. Enviar un correo válido con email transaccional sin configurar.

Resultado esperado. Responde 202 sin revelar cuentas ni producir error 500; informa alternativa administrativa.

Estado registrado. HTTP local aprobada. 

## CP-85 Persistencia de plan

Módulo. Plataforma.

Procedimiento de la fuente. Cambiar Pro a Básico, recargar el panel y volver a Pro.

Resultado esperado. La selección persiste después de la recarga.

Estado registrado. Visual local aprobada. 

## CP-86 Eliminación definitiva de usuario

Módulo. Plataforma.

Procedimiento de la fuente. Restablecer clave y eliminar un vendedor.

Resultado esperado. Sesiones revocadas; historial de venta se conserva sin FK inválida.

Estado registrado. Automatizada aprobada. 

## CP-87 Eliminación definitiva de local

Módulo. Plataforma.

Procedimiento de la fuente. Eliminar tenant de prueba con confirmación reforzada.

Resultado esperado. Se eliminan todos sus datos y no afecta otros tenants.

Estado registrado. Automatizada aprobada. 

## CP-88 Pestañas estables

Módulo. Clientes.

Procedimiento de la fuente. Alternar Clientes, Fiado y Pendientes.

Resultado esperado. La franja conserva 58 px de alto y no mueve la pantalla.

Estado registrado. Visual automatizada en navegador aprobada. 

## CP-89 Registrar abono

Módulo. Fiado.

Procedimiento de la fuente. Ingresar monto y medio en cliente con deuda.

Resultado esperado. Abono se habilita, reduce saldo y no admite monto vacío o superior.

Estado registrado. Lógica y UI aprobadas. 

## CP-90 Explorar por categoría

Módulo. POS.

Procedimiento de la fuente. Entrar a Vender, elegir una categoría y luego volver a Todos.

Resultado esperado. Solo se muestran los productos de la categoría elegida; búsqueda restablece Todos y el ticket no cambia.

Estado registrado. Pendiente evidencia. 

## CP-91 Prioridad contextual

Módulo. Inicio.

Procedimiento de la fuente. Abrir Inicio con stock agotado, stock bajo, fiado pendiente y sin alertas.

Resultado esperado. Muestra una única prioridad con acción directa; las tarjetas de atención aparecen solo cuando hay algo que revisar.

Estado registrado. Pendiente evidencia. 

## CP-92 Productos frecuentes

Módulo. POS.

Procedimiento de la fuente. Registrar ventas, abrir Vender y alternar Más vendidos/Recientes.

Resultado esperado. Muestra hasta seis productos existentes del catálogo; al tocar uno se agrega al ticket sin alterar filtros ni stock.

Estado registrado. Pendiente evidencia. 

## CP-93 Total y cobro fijo

Módulo. POS móvil.

Procedimiento de la fuente. Agregar un producto y desplazarse por el catálogo a 390 px.

Resultado esperado. La barra fija muestra cantidad, total, Revisar ticket y Cobrar sin tapar la navegación; Cobrar abre el paso de pago.

Estado registrado. Pendiente evidencia. 

## CP-110 Carga según plan y rol

Módulo. Caja.

Procedimiento de la fuente. Abrir Caja con Basic/Pro y dueño/vendedor.

Resultado esperado. No muestra el error genérico de API; solicita solo módulos autorizados.

Estado registrado. Visual local aprobada. 

## CP-111 Filtro mensual

Módulo. Reportes.

Procedimiento de la fuente. Cambiar mes y revisar métricas/gráficos/listas.

Resultado esperado. Todos los bloques usan el mismo período y valores netos.

Estado registrado. Typecheck y visual aprobadas. 

## CP-112 Devolución parcial acumulada

Módulo. Ventas.

Procedimiento de la fuente. Devolver unidades en dos operaciones.

Resultado esperado. Nunca supera cantidad original y repone stock exactamente una vez.

Estado registrado. Automatizada aprobada. 

## CP-113 Sin superficies blancas

Módulo. Tema oscuro.

Procedimiento de la fuente. Revisar POS, buscador, clientes, reportes y modales.

Resultado esperado. Fondo #090909, superficie #111111, bordes #292929 y sin sombras blancas.

Estado registrado. CSS computado y visual a 320 px aprobados. 

## CP-94 Controles a 320 px

Módulo. Responsive.

Procedimiento de la fuente. Abrir POS y medir encabezado/navegación.

Resultado esperado. Cuatro botones de 44 px sin superposición y sin overflow horizontal.

Estado registrado. Visual y medición aprobadas. 

## CP-95 Plan oculto

Módulo. Rol vendedor.

Procedimiento de la fuente. Iniciar como vendedor en escritorio y móvil.

Resultado esperado. No ve tarjeta, días, contratación ni reportes del dueño.

Estado registrado. Visual local aprobada. 

## CP-96 Estados vacíos con orientación

Módulo. Experiencia.

Procedimiento de la fuente. Abrir Vender sin ticket, filtrar un catálogo sin resultados, abrir Clientes vacío y elegir un mes sin ventas.

Resultado esperado. Cada estado explica la situación y, cuando corresponde, entrega una acción segura para continuar sin crear datos de prueba.

Estado registrado. Pendiente evidencia. 

## CP-97 Acceso por tarea

Módulo. Inventario.

Procedimiento de la fuente. Abrir Inventario como dueño y usar Revisar catálogo, Agregar producto, Cargar varios e Ingresar factura.

Resultado esperado. Cada tarea dirige al flujo existente correspondiente; no crea un segundo catálogo ni duplica la lógica de recepción.

Estado registrado. Pendiente evidencia. 

## CP-98 Lectura por período

Módulo. Reportes.

Procedimiento de la fuente. Elegir un mes con y sin ventas y recorrer resultado, análisis, caja e historial.

Resultado esperado. El total y las métricas corresponden al período elegido; Caja de hoy declara que es operativa y los historiales muestran su alcance sin mezclar datos.

Estado registrado. Pendiente evidencia. 

## CP-99 Formulario progresivo

Módulo. Productos.

Procedimiento de la fuente. Crear y editar un producto completando solo datos principales y luego desplegando información adicional.

Resultado esperado. Nombre, categoría, precio y stock son claros y suficientes para crear; datos opcionales conservan el mismo comportamiento al guardar.

Estado registrado. Pendiente evidencia. 

## CP-100 Textos y acciones consistentes

Módulo. Experiencia.

Procedimiento de la fuente. Recorrer Inicio, Inventario, Clientes, Reportes y los mensajes de sesión.

Resultado esperado. Las acciones distinguen crear, guardar, revisar y cerrar; etiquetas, búsquedas y mensajes visibles usan español claro y acentuación correcta.

Estado registrado. Pendiente evidencia. 

## CP-101 Foco y reducción de movimiento

Módulo. Accesibilidad.

Procedimiento de la fuente. Navegar con teclado por botones, campos, filtros y enlaces en ambos temas; activar reducción de movimiento del sistema.

Resultado esperado. El foco es visible en cada control y la interfaz elimina transiciones no esenciales cuando el sistema solicita menos movimiento.

Estado registrado. Pendiente evidencia. 

## CP-102 Ayuda contextual

Módulo. Experiencia.

Procedimiento de la fuente. Abrir las ayudas de Vender, Inventario y Clientes.

Resultado esperado. Cada ayuda explica el flujo propio de la sección en lenguaje simple, puede abrirse o cerrarse y no bloquea la tarea principal.

Estado registrado. Pendiente evidencia. 

## CP-103 Puesta en marcha

Módulo. Inicio.

Procedimiento de la fuente. Ingresar como dueño con catálogo vacío y luego con catálogo sin ventas.

Resultado esperado. Inicio muestra únicamente los pasos pendientes para cargar productos y realizar la primera venta; cada paso abre el flujo existente.

Estado registrado. Pendiente evidencia. 

## CP-104 Indicadores operativos

Módulo. Inicio.

Procedimiento de la fuente. Registrar ventas y revisar Inicio.

Resultado esperado. Muestra producto más vendido, tamaño y categorías del catálogo y valor estimado del stock usando datos del negocio.

Estado registrado. Pendiente evidencia. 

## CP-105 Historial del turno

Módulo. Caja.

Procedimiento de la fuente. Abrir caja, registrar ingreso, gasto y retiro.

Resultado esperado. El historial lista tipo, motivo, categoría, monto, hora y usuario de cada movimiento del turno abierto.

Estado registrado. Pendiente evidencia. 

## CP-106 Búsqueda global

Módulo. Búsqueda.

Procedimiento de la fuente. Usar Buscar desde escritorio y menú móvil con producto, cliente, código y venta.

Resultado esperado. Los resultados son del negocio actual y dirigen al módulo correspondiente sin exponer datos no autorizados al vendedor.

Estado registrado. Pendiente evidencia. 

## CP-107 Confirmaciones críticas

Módulo. Seguridad operativa.

Procedimiento de la fuente. Intentar desactivar producto/cliente, eliminar usuario y cerrar caja.

Resultado esperado. Explica el efecto de la acción y permite volver; solo ejecuta después de confirmar explícitamente.

Estado registrado. Pendiente evidencia. 

## CP-108 Guion de demostración

Módulo. Tesis.

Procedimiento de la fuente. Seguir el documento de demostración desde una cuenta demo.

Resultado esperado. El recorrido cubre Inicio, Inventario, Venta, Venta Rápida, Clientes, Caja y Reportes sin requerir cobros reales.

Estado registrado. Pendiente evidencia. 

## CP-109 Filtros, comparativas y exportación

Módulo. Reportes.

Procedimiento de la fuente. Filtrar por mes, vendedor y categoría; guardar una vista; comparar el mes anterior y exportar CSV.

Resultado esperado. Las métricas, gráficos, alertas y CSV reflejan los filtros activos. El filtro guardado solo está disponible en el mismo local y navegador.

Estado registrado. Pendiente evidencia. 

# Casos adicionales de arquitectura y calidad

Se proponen casos PostgreSQL de reintento simultáneo, última unidad con dos vendedores, rechazo sin efecto parcial y aislamiento de recursos. También restauración, pérdida de respuesta después de confirmar, cierre con varias cuentas y cambios de precio mientras una venta permanece offline. Estos casos amplían la campaña y siguen pendientes.

La IA necesita comprobar respuesta desconocida, cantidades inválidas, catálogo vacío, proveedor sin clave y límite externo. La propuesta debe mantenerse editable. Las pruebas de accesibilidad examinan teclado y foco en los flujos principales. Los RNF con umbrales propuestos requieren aceptar primero las condiciones de medición.

# Evidencia histórica y límites

Los documentos de estado y operación describen ejecuciones locales previas con cantidades de pruebas en distintos cortes. Se conservan como antecedentes; no se fusionan en un nuevo total de pruebas aprobadas. Una prueba local de un pool de una conexión no sustituye el caso real productivo de anulación o devolución.

La evidencia pendiente incluye PostgreSQL integral, restauración, dispositivos físicos, usuarios y concurrencia. La documentación desarrollada ayuda a ejecutarlas y a informar el resultado. Un caso con evidencia pendiente no se marca aprobado aunque el mecanismo exista en código.


# Campaña complementaria de integración y validación

Todos los casos siguientes están pendientes de ejecución. Deben conservar fecha, commit, configuración, ejecutor, datos iniciales, resultado real, evidencia y limpieza. Se usan ambientes y datos aislados.

## CP-114 Concurrencia por última unidad

Precondiciones. PostgreSQL de prueba, dos sesiones de venta y producto con stock uno.

Procedimiento. Enviar dos ventas de una unidad a la vez, con claves distintas; repetir al menos veinte veces reiniciando el dato controlado.

Resultado esperado. Una venta confirmada y otra rechazada; stock cero, sin negativos ni doble descuento.

Estado. Pendiente. Resultado obtenido: por registrar. Evidencia: por adjuntar. Restaurar el dato de prueba o destruir el ambiente aislado al finalizar.

## CP-115 Idempotencia concurrente

Precondiciones. PostgreSQL aislado y ticket válido con clave única de campaña.

Procedimiento. Enviar diez solicitudes simultáneas con la misma clave; consultar ventas y movimientos por la operación.

Resultado esperado. Una sola venta y un solo conjunto de efectos; las respuestas se relacionan con la misma operación o con un conflicto controlado recuperable.

Estado. Pendiente. Resultado obtenido: por registrar. Evidencia: por adjuntar. Restaurar el dato de prueba o destruir el ambiente aislado al finalizar.

## CP-116 Rollback de venta inválida

Precondiciones. Dos productos: uno suficiente y otro sin stock.

Procedimiento. Confirmar un ticket que incluya ambos; comparar stock, deuda, caja y ventas antes y después.

Resultado esperado. Rechazo completo y ningún efecto parcial en tablas persistentes.

Estado. Pendiente. Resultado obtenido: por registrar. Evidencia: por adjuntar. Restaurar el dato de prueba o destruir el ambiente aislado al finalizar.

## CP-117 Aislamiento persistente

Precondiciones. Dos negocios con dueños y productos propios en PostgreSQL.

Procedimiento. Con token A consultar y modificar identificadores de B; cambiar cabecera de negocio y probar venta con producto ajeno.

Resultado esperado. Ningún dato de B expuesto o cambiado; rechazo sin efectos y registros atribuibles al negocio correcto.

Estado. Pendiente. Resultado obtenido: por registrar. Evidencia: por adjuntar. Restaurar el dato de prueba o destruir el ambiente aislado al finalizar.

## CP-118 Respaldo y restauración

Precondiciones. Base de prueba con ventas, abonos y compras; destino nuevo vacío.

Procedimiento. Generar pg_dump, registrar hora y hash; restaurar en destino aislado; comparar conteos, sumas, claves y operaciones de lectura.

Resultado esperado. Restauración completa y coherente; medir duración y pérdida temporal respecto al respaldo. Comparar con RTO/RPO acordados, sin inventar aprobación.

Estado. Pendiente. Resultado obtenido: por registrar. Evidencia: por adjuntar. Restaurar el dato de prueba o destruir el ambiente aislado al finalizar.

## CP-119 Respuesta perdida tras confirmar

Precondiciones. Ambiente de prueba y mecanismo controlado para cortar la respuesta sin cancelar el commit.

Procedimiento. Confirmar una venta, interrumpir recepción de respuesta y reintentar con la misma clave; consultar estado definitivo.

Resultado esperado. Una operación, stock descontado una vez y recuperación visible para el usuario.

Estado. Pendiente. Resultado obtenido: por registrar. Evidencia: por adjuntar. Restaurar el dato de prueba o destruir el ambiente aislado al finalizar.

## CP-120 Precio cambiado durante cola offline

Precondiciones. Ticket local pendiente y dueño con capacidad de cambiar el catálogo.

Procedimiento. Crear ticket sin red, cambiar precio o stock desde otra sesión y volver a conectar; registrar propuesta y decisión del servidor.

Resultado esperado. Aplicación explícita de reglas vigentes, sin precio obsoleto aceptado silenciosamente ni doble venta.

Estado. Pendiente. Resultado obtenido: por registrar. Evidencia: por adjuntar. Restaurar el dato de prueba o destruir el ambiente aislado al finalizar.

## CP-121 Cámara e instalación móvil

Precondiciones. Un equipo iOS y uno Android físicos, HTTPS y catálogo sintético.

Procedimiento. Anotar modelo y versión; abrir e instalar PWA; permitir y denegar cámara, buscar código y fotografiar producto; repetir tras reabrir.

Resultado esperado. Flujo usable, errores comprensibles y alternativa manual; documentar diferencias de plataforma, sin extrapolar a todos los equipos.

Estado. Pendiente. Resultado obtenido: por registrar. Evidencia: por adjuntar. Restaurar el dato de prueba o destruir el ambiente aislado al finalizar.

## CP-122 Tareas con comerciantes

Precondiciones. Consentimiento informado, catálogo de prueba e instrumentos UAT01–07.

Procedimiento. Aplicar las tareas sin enseñar previamente la respuesta; registrar finalización, ayuda, errores, tiempo y comentarios según el protocolo.

Resultado esperado. Resultados observados y anonimizados; aceptación solo según criterios previamente acordados, no por una opinión favorable aislada.

Estado. Pendiente. Resultado obtenido: por registrar. Evidencia: por adjuntar. Restaurar el dato de prueba o destruir el ambiente aislado al finalizar.

## CP-123 Carga y latencia

Precondiciones. PostgreSQL de prueba, 1.000 productos sintéticos y 10 usuarios concurrentes; objetivo propuesto p95 menor a 2 s.

Procedimiento. Separar calentamiento de diez minutos medidos; combinar consultas y ventas válidas, registrar latencias, errores y stock; repetir tres veces.

Resultado esperado. Sin errores de integridad; informar p50, p95, p99, tasa de errores y recursos. El umbral requiere acuerdo antes de marcar aprobación.

Estado. Pendiente. Resultado obtenido: por registrar. Evidencia: por adjuntar. Restaurar el dato de prueba o destruir el ambiente aislado al finalizar.

# Campaña ejecutada del 04 de octubre

El Informe de verificación conserva el detalle reproducible de 78 pruebas automatizadas y 12 casos HTTP aprobados. La Matriz de trazabilidad relaciona esas comprobaciones con los RF y HU. La campaña utiliza memoria y dobles de servicios; no cierra los CP persistentes ni la aceptación de usuarios.

# Conclusiones

El plan permite repetir comprobaciones y sostener aceptación por requisito. La entrega mejora la descripción de casos y conserva sus estados. La campaña AUT/HTTP aporta evidencia ejecutada sobre reglas e integración local; los casos manuales y persistentes mantienen sus estados específicos.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

Node.js (s. f.). *Test runner*. https://nodejs.org/api/test.html

