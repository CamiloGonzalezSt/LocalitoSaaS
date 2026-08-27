# Matriz de pruebas funcionales - Localito

**Proyecto:** Localito  
**Tipo:** PWA académica mobile-first para pequeños negocios
**Objetivo del documento:** Servir como evidencia de validacion funcional para memoria, presentacion y defensa de tesis.

## 1. Alcance de pruebas

Estas pruebas validan el núcleo operacional de Localito. El reconocimiento visual externo es opcional; todos los demás flujos pueden probarse en navegador de escritorio y celular en red local. El estado de cada caso es evidencia disponible, no una certificación comercial del sistema.

## 2. Ambiente de prueba

| Elemento | Valor |
| --- | --- |
| Frontend | React + PWA |
| Backend | Node.js + API REST |
| Base de datos | Memoria solo para desarrollo local; PostgreSQL persistente en producción |
| URL web local | `http://localhost:5173` |
| URL API local | `http://localhost:3000` |
| URL movil en red local | `http://IP-DEL-PC:5174` |

## 3. Credenciales demo

| Rol | Correo | Clave |
| --- | --- | --- |
| Duena Donde Juanita | `juanita@localito.demo` | `Duoc2026` |
| Vendedor Donde Juanita | `juanita+vendedor@localito.demo` | `Duoc2026V` |
| Dueno Botilleria Don Pepe | `donpepe@localito.demo` | `Duoc2026` |
| Vendedor Botilleria Don Pepe | `donpepe+vendedor@localito.demo` | `Duoc2026V` |
| Duena Peluqueria La Esquina | `peluqueria@localito.demo` | `Duoc2026` |
| Vendedor Peluqueria La Esquina | `peluqueria+vendedor@localito.demo` | `Duoc2026V` |

## 4. Casos de prueba

| ID | Modulo | Prueba | Pasos resumidos | Resultado esperado | Estado |
| --- | --- | --- | --- | --- | --- |
| CP-01 | Autenticacion | Inicio de sesion dueno | Ingresar correo y clave demo. | El sistema muestra panel del dia y nombre del usuario. | Pendiente evidencia |
| CP-02 | Autenticacion | Rechazo de clave incorrecta | Ingresar usuario valido con clave incorrecta. | El sistema responde credenciales invalidas. | Pendiente evidencia |
| CP-03 | Productos | Crear producto | Ir a Stock, completar formulario y crear. | Producto aparece en inventario y puede venderse. | Pendiente evidencia |
| CP-04 | Productos | Editar producto | Seleccionar editar, cambiar precio o stock minimo, guardar. | Producto refleja cambios. | Pendiente evidencia |
| CP-05 | Productos | Desactivar producto | Presionar desactivar en un producto. | Producto deja de aparecer en inventario activo. | Pendiente evidencia |
| CP-06 | Stock | Alerta de stock bajo | Dejar stock menor o igual al minimo. | Dashboard muestra alerta. | Pendiente evidencia |
| CP-07 | Ventas | Venta normal | Agregar producto al ticket y confirmar con efectivo. | Se registra venta, baja stock y se muestra comprobante. | Pendiente evidencia |
| CP-08 | Ventas | Venta fiada | Seleccionar metodo fiado, elegir cliente y confirmar. | Se registra venta y aumenta deuda del cliente. | Pendiente evidencia |
| CP-09 | Ventas | Anular venta | Ir a Reportes y anular venta activa. | Venta queda anulada y stock se restaura. | Pendiente evidencia |
| CP-10 | Ticket | Imprimir comprobante | Confirmar venta y presionar imprimir. | Se abre dialogo de impresion con ticket interno. | Pendiente evidencia |
| CP-11 | Ticket | Compartir comprobante | Confirmar venta y presionar compartir. | En movil se abre menu nativo o se copia texto. | Pendiente evidencia |
| CP-12 | Clientes | Crear cliente | Ir a Fiado, ingresar nombre y contacto. | Cliente aparece en cuentas por cobrar. | Pendiente evidencia |
| CP-13 | Clientes | Editar cliente | Seleccionar editar, cambiar telefono y guardar. | Cliente refleja el nuevo dato. | Pendiente evidencia |
| CP-14 | Clientes | Registrar abono | Ingresar monto y presionar abono. | Deuda disminuye. | Pendiente evidencia |
| CP-15 | Venta Rápida | Reconocer una fotografía | Fotografiar uno o más productos desde Venta Rápida. | Propone productos y cantidades usando exclusivamente el catálogo del negocio. | Normalización automatizada aprobada; visual pendiente |
| CP-16 | Codigo de barras | Reconocer por codigo | Crear producto con código real, abrir **Venta Rápida → Vender con código de barras** y leer o ingresar `7801610001347`. | Localito encuentra el producto exacto sin depender del análisis visual. | Pendiente evidencia |
| CP-17 | Venta Rápida | Corregir propuesta | Cambiar cantidad, reemplazar un producto ambiguo y eliminar otro. | El total se recalcula con precios del inventario y la propuesta queda bajo control del vendedor. | Pendiente evidencia |
| CP-18 | Caja | Caja en vivo | Ir a Reportes. | Muestra efectivo, tarjeta, transferencia, fiado, total y anuladas. | Pendiente evidencia |
| CP-19 | Caja | Cierre manual | Escribir observacion y presionar Cerrar caja. | Se guarda un cierre con totales, usuario, fecha/hora y observacion. | Pendiente evidencia |
| CP-20 | Usuarios | Crear usuario interno | Ir a Configuracion, crear vendedor. | Usuario aparece en lista de usuarios activos. | Pendiente evidencia |
| CP-21 | Usuarios | Desactivar usuario | Desactivar usuario creado. | Usuario deja de aparecer como activo. | Pendiente evidencia |
| CP-22 | Mobile | Uso desde iPhone | Abrir `http://IP-DEL-PC:5174`. | PWA carga y consume API del PC mediante el proxy local. | Pendiente evidencia |
| CP-23 | PWA | Instalabilidad | Abrir con HTTPS o entorno compatible y agregar a inicio. | App se comporta como PWA instalable. | Pendiente evidencia |
| CP-24 | Permisos | Vendedor sin reportes completos | Iniciar como vendedor y entrar a Caja. | Solo ve caja en vivo, cierre y ultimos cierres. | Pendiente evidencia |
| CP-25 | Permisos | Vendedor sin administracion de productos | Iniciar como vendedor y entrar a Stock. | Ve inventario solo lectura, sin crear, editar, ajustar o desactivar. | Pendiente evidencia |
| CP-26 | Permisos | API rechaza accion administrativa | Llamar endpoint admin con token de vendedor. | API responde 403 sin ejecutar accion. | Pendiente evidencia |
| CP-27 | Perfil | Editar perfil propio | Iniciar como vendedor o dueno, entrar a Mi perfil/Configuracion, cambiar nombre o correo y guardar. | El perfil se actualiza sin cambiar rol ni permisos. | Pendiente evidencia |
| CP-28 | Usuarios | Vendedor no administra usuarios | Iniciar como vendedor y entrar a Mi perfil. | No aparece el formulario de crear usuarios ni la lista administrativa. | Pendiente evidencia |
| CP-29 | Simulación Webpay fiado | Compartir simulación | Entrar a Fiado, presionar Simular cobro en cliente con deuda. | Se genera una tarjeta de demostración con enlace, compartir, WhatsApp y copiar; no se envía dinero. | Pendiente evidencia |
| CP-30 | Simulación Webpay fiado | Confirmar simulación | Generar la simulación y presionar Confirmar simulación. | La deuda disminuye por el monto de prueba, sin consultar ni cobrar mediante Transbank. | Pendiente evidencia |
| CP-31 | Administración | Crear negocio | Registrar negocio, dueño y clave desde Crear cuenta o como administrador. | Se crea un tenant aislado y una prueba Pro de 30 días. | Pendiente evidencia |
| CP-32 | Seguridad | Cerrar sesion | Cerrar sesion y reutilizar el token anterior. | El token queda revocado y la API responde 401. | Pendiente evidencia |
| CP-33 | Multi-tenant | Intentar cambiar negocio por cabecera | Enviar una cabecera `x-tenant-id` distinta con un token valido. | La API ignora la cabecera y deriva el negocio desde la sesion. | Pendiente evidencia |
| CP-34 | Ventas | Pago dividido | Vender usando efectivo y tarjeta por montos que sumen el total. | La venta queda con metodo mixto y caja separa ambos montos. | Pendiente evidencia |
| CP-35 | Ventas | Reintento idempotente | Repetir una venta con la misma clave de idempotencia. | Se devuelve la misma venta y el stock baja una sola vez. | Automatizada aprobada |
| CP-36 | Devoluciones | Devolucion parcial | Devolver una unidad de una venta de varias unidades. | Se repone solo esa unidad y se ajustan venta neta y deuda. | Automatizada aprobada |
| CP-37 | Devoluciones | Evitar doble reposicion | Devolver parcialmente y luego anular la venta. | Solo se repone la cantidad restante. | Automatizada aprobada |
| CP-38 | Credito | Aplicar limite de fiado | Superar el cupo configurado del cliente. | La API rechaza la venta sin descontar stock. | Automatizada aprobada |
| CP-39 | Caja | Apertura y cierre de turno | Abrir con fondo inicial, registrar gasto, contar y cerrar. | Se informa efectivo esperado y diferencia. | Automatizada aprobada |
| CP-40 | Caja | Segundo turno del dia | Cerrar un turno y abrir otro el mismo dia. | El segundo turno no vuelve a sumar ventas del primero. | Pendiente evidencia |
| CP-41 | Compras | Recibir orden | Crear proveedor y orden, luego recibir mercaderia. | Aumenta stock, registra kardex y recalcula costo promedio. | Automatizada aprobada |
| CP-42 | Inventario | Alerta de vencimiento | Asignar vencimiento dentro de 30 dias. | Gestion muestra alerta del producto. | Pendiente evidencia |
| CP-43 | Datos | Importar y exportar CSV | Exportar catalogo e importar un archivo valido. | Se descarga CSV y se crean filas validas. | Pendiente evidencia |
| CP-44 | Offline | Venta sin conexion | Perder red al confirmar y recuperarla. | La venta queda en cola y se sincroniza sin duplicarse. | Pendiente evidencia |
| CP-45 | Vision | Reconocer envase | Configurar `GROQ_API_KEY` (o `OPENAI_API_KEY`), fotografiar un producto catalogado. | La API propone coincidencia con confianza y permite corregir. | Pendiente evidencia |
| CP-46 | Seguridad | Recuperar contraseña | Solicitar el enlace, cambiar la clave y volver a usar el enlace. | La nueva clave funciona, sesiones anteriores quedan revocadas y el enlace no puede reutilizarse. | Automatizada aprobada |
| CP-47 | Factura IA | Extraer factura | Fotografiar una factura legible desde Negocio. | Propone proveedor, folio, fecha, totales y líneas con confianza y advertencias. | Esquema automatizado aprobado; visual aprobado |
| CP-48 | Factura IA | Reutilizar catálogo | Leer una línea cuyo código o nombre corresponde a un producto activo. | La línea queda marcada En inventario y no crea otro producto. | Automatizada aprobada |
| CP-49 | Factura IA | Crear producto faltante | Confirmar una línea marcada Producto nuevo con nombre, categoría y precio de venta. | Crea el producto y lo recibe con el stock y costo confirmados. | Automatizada aprobada |
| CP-50 | Factura IA | Exigir revisión | Vaciar cantidad o precio de venta de una línea. | Confirmar e ingresar queda deshabilitado y la API rechaza valores inválidos. | Automatizada aprobada |
| CP-51 | Factura IA | Evitar doble ingreso | Reintentar con la misma clave o volver a cargar el mismo folio. | Devuelve la compra previa o rechaza el duplicado; el stock aumenta una sola vez. | Automatizada aprobada |
| CP-52 | Factura IA | Permisos | Intentar analizar o importar con token de vendedor. | La API responde 403 y no cambia inventario. | Importación CSV comprobada con 403; factura pendiente evidencia |
| CP-53 | Carga inicial | Apertura automática | Crear un local sin productos e iniciar sesión como dueño. | Abre automáticamente el asistente y sugiere categorías según el rubro. | Visual aprobada a 320 px |
| CP-54 | Carga inicial | Importación masiva | Subir una plantilla CSV con dos productos válidos y una fila inválida. | Muestra vista previa, omite la fila inválida y crea los dos productos válidos. | Automatizada y visual aprobadas |
| CP-55 | Carga inicial | Evitar duplicados | Reintentar la misma carga y subir un producto con código o nombre ya existente. | No crea duplicados e informa las filas ya existentes. | Automatizada aprobada |
| CP-56 | Carga inicial | Reanudar o posponer | Elegir un método, recargar y luego presionar Hacerlo después. | Recupera el método elegido; al posponer no fuerza nuevamente el asistente y permanece accesible desde el menú. | Reanudación y acceso posterior aprobados |
| CP-57 | Venta Rápida A | Un producto | Analizar una foto con un producto catalogado. | Muestra una línea lista con cantidad 1 y precio obtenido del inventario. | Automatizada aprobada |
| CP-58 | Venta Rápida B | Varios productos | Analizar una foto con productos distintos. | Devuelve líneas separadas y calcula el total con precios locales. | Automatizada aprobada |
| CP-59 | Venta Rápida C | Unidades repetidas | Analizar varias unidades iguales o una respuesta repetida para el mismo ID. | Agrupa el producto y suma las cantidades. | Automatizada aprobada |
| CP-60 | Venta Rápida D | Producto no encontrado | Analizar un objeto sin coincidencia de catálogo. | Lo marca Producto no reconocido y permite buscar o ignorar; no crea inventario. | Automatizada y visual aprobadas mediante código desconocido y corrección manual |
| CP-61 | Venta Rápida E | Detección ambigua | Devolver una coincidencia de confianza media con varias alternativas. | Exige selección o confirmación antes de habilitar Agregar a la venta. | Automatizada aprobada; visual pendiente |
| CP-62 | Venta Rápida F | Stock insuficiente | Detectar cantidad superior al stock registrado. | Advierte detectado versus stock y aplica la misma regla del POS al agregar. | Automatizada y visual aprobadas; el POS rechazó cantidad 29 con stock 28 |
| CP-63 | Venta Rápida G | Falla de IA | Simular error o servicio no configurado. | Mantiene la foto y ofrece reintentar sin modificar ticket ni stock. | Endpoint aprobado sin clave (503 controlado); interacción visual pendiente |
| CP-64 | Venta Rápida H | Cámara rechazada | Rechazar permiso de cámara. | Explica brevemente el permiso y ofrece cámara del teléfono o subir foto. | Pendiente dispositivo real |
| CP-65 | Venta Rápida I | Foto sin productos | Analizar una imagen sin productos claros. | Muestra No encontramos productos claramente visibles y permite otra foto. | Automatizada aprobada; visual pendiente |
| CP-66 | Venta Rápida J | Integración POS | Confirmar productos revisados y presionar Agregar a la venta. | Abre el ticket POS existente; stock y kardex no cambian hasta confirmar el cobro. | Automatizada y visual aprobadas; cantidad 2 llegó al ticket y el stock permaneció en 28 |
| CP-67 | Navegación | Menú por rol | Iniciar como dueño y vendedor en móvil/escritorio. | Dueño ve 7 áreas; vendedor ve Vender, Inventario, Clientes y Caja; funciones secundarias no duplican navegación. | Typecheck y revisión móvil aprobados |
| CP-68 | POS | Medios después de Cobrar | Agregar producto y observar ticket antes de pulsar Cobrar. | Los medios de pago no aparecen hasta solicitar el cobro. | Visual móvil aprobada |
| CP-69 | POS | Confirmación de pago externo | Elegir tarjeta, transferencia o Webpay. | Registrar venta queda deshabilitado hasta marcar pago aprobado; antes de eso no existe venta ni baja stock. | Visual y API local aprobadas con tarjeta |
| CP-70 | Suscripción | Prueba Pro al crear local | Crear tenant desde plataforma. | Se crea suscripción Pro `trialing` por 30 días y bootstrap entrega entitlements. | Automatizada aprobada |
| CP-71 | Suscripción | Plan Básico | Cambiar a Básico e intentar clientes, IA o compras desde UI/API. | Navegación oculta función y API responde 403; ventas, inventario y caja siguen disponibles. | UI y HTTP aprobados: productos 200, clientes 403 y Venta Rápida deriva a Mi plan |
| CP-72 | Suscripción | Vencimiento solo lectura | Vencer prueba/periodo y consultar/modificar datos. | Consultas del plan siguen disponibles; mutaciones responden 403 y los datos permanecen. | HTTP/UI aprobados: productos GET 200, POST 403 y controles POS deshabilitados |
| CP-73 | Plataforma | Métricas SaaS | Entrar como `system_admin`. | Muestra locales, pruebas activas, MRR estimado y controles de plan/estado por tenant. | Visual aprobada; activación Basic actualizó MRR de $59.970 a $49.970 |
| CP-74 | Apariencia | Claro, oscuro y sistema | Cambiar el control Apariencia del lateral en escritorio o del menú móvil y recargar. | Tema persiste por usuario, mantiene contraste y respeta preferencia del sistema. | Claro predeterminado y Oscuro persistido tras recarga a 390 px |
| CP-75 | Responsive | Sin zoom ni desborde | Revisar Inicio, Vender, Inventario y formularios a 390 × 844. | `scrollWidth` no supera el viewport y la navegación inferior no tapa controles esenciales. | Aprobada en 390 × 844 |
| CP-76 | Inicio | Jerarquía diaria | Entrar como owner. | Ventas de hoy domina; muestra acciones Vender/Agregar producto/Ver caja, atención y cuatro métricas útiles. | Visual aprobada a 390 y 1440 px; sin desborde |
| CP-77 | Negocio | Editar identidad | Cambiar nombre, rubro, dirección y teléfono desde el engranaje de Configuración. | API persiste el tenant, actualiza sesión y registra auditoría sin permitir cambiar `active`. | Automatizada y visual/HTTP aprobadas con mensaje Datos del negocio guardados |
| CP-78 | Suscripción | Solicitud durante trial | Solicitar Basic mientras existe trial Pro. | Mantiene Pro `trialing`, registra `pendingPlan=basic` y no corta acceso. | Automatizada aprobada |
| CP-79 | Suscripción | Activación manual | Como system_admin activar un tenant con plan solicitado. | Aplica plan solicitado, crea período, limpia pendiente y audita. | Visual/HTTP aprobada: solicitud Basic desapareció y plan quedó active |
| CP-80 | Suscripción | Vencido con lectura | Vencer plan Pro y entrar a Clientes/Reportes. | Datos del plan siguen visibles; botones operativos deshabilitados y API rechaza mutaciones. | UI y HTTP aprobados con banner y productos del POS deshabilitados |
| CP-81 | Plataforma | Embudo SaaS | Entrar como system_admin. | Muestra Basic, Pro, past_due, expirados, pruebas nuevas, conversión y MRR. | Visual aprobada en panel system_admin |
| CP-82 | Apariencia | Predeterminado Claro | Iniciar con un usuario sin preferencia guardada. | Localito abre en Claro; Oscuro/Sistema quedan como selección explícita persistida. | Visual aprobada: dataset light inicial y selector Claro presionado |
| CP-83 | Registro público | Crear empresa nueva | Completar negocio, dueño, correo y clave desde el login. | Crea tenant aislado, sesión owner y prueba Pro de 30 días. | Automatizada y HTTP local aprobadas |
| CP-84 | Recuperación | Solicitar enlace sin proveedor de correo | Enviar un correo válido con email transaccional sin configurar. | Responde 202 sin revelar cuentas ni producir error 500; informa alternativa administrativa. | HTTP local aprobada |
| CP-85 | Plataforma | Persistencia de plan | Cambiar Pro a Básico, recargar el panel y volver a Pro. | La selección persiste después de la recarga. | Visual local aprobada |
| CP-86 | Plataforma | Eliminación definitiva de usuario | Restablecer clave y eliminar un vendedor. | Sesiones revocadas; historial de venta se conserva sin FK inválida. | Automatizada aprobada |
| CP-87 | Plataforma | Eliminación definitiva de local | Eliminar tenant de prueba con confirmación reforzada. | Se eliminan todos sus datos y no afecta otros tenants. | Automatizada aprobada |
| CP-88 | Clientes | Pestañas estables | Alternar Clientes, Fiado y Pendientes. | La franja conserva 58 px de alto y no mueve la pantalla. | Visual automatizada en navegador aprobada |
| CP-89 | Fiado | Registrar abono | Ingresar monto y medio en cliente con deuda. | Abono se habilita, reduce saldo y no admite monto vacío o superior. | Lógica y UI aprobadas |
| CP-90 | Caja | Carga según plan y rol | Abrir Caja con Basic/Pro y dueño/vendedor. | No muestra el error genérico de API; solicita solo módulos autorizados. | Visual local aprobada |
| CP-91 | Reportes | Filtro mensual | Cambiar mes y revisar métricas/gráficos/listas. | Todos los bloques usan el mismo período y valores netos. | Typecheck y visual aprobadas |
| CP-92 | Ventas | Devolución parcial acumulada | Devolver unidades en dos operaciones. | Nunca supera cantidad original y repone stock exactamente una vez. | Automatizada aprobada |
| CP-93 | Tema oscuro | Sin superficies blancas | Revisar POS, buscador, clientes, reportes y modales. | Fondo #090909, superficie #111111, bordes #292929 y sin sombras blancas. | CSS computado y visual a 320 px aprobados |
| CP-94 | Responsive | Controles a 320 px | Abrir POS y medir encabezado/navegación. | Cuatro botones de 44 px sin superposición y sin overflow horizontal. | Visual y medición aprobadas |
| CP-95 | Rol vendedor | Plan oculto | Iniciar como vendedor en escritorio y móvil. | No ve tarjeta, días, contratación ni reportes del dueño. | Visual local aprobada |

## 5. Pruebas no funcionales sugeridas

| ID | NRF | Prueba | Resultado esperado |
| --- | --- | --- | --- |
| PNF-01 | Usabilidad movil | Ejecutar venta completa desde celular. | Flujo entendible, botones tactiles y sin desbordes. |
| PNF-02 | Rendimiento | Cargar dashboard con datos demo. | Carga inicial rapida en red local. |
| PNF-03 | Seguridad basica | Intentar login con clave incorrecta. | Acceso rechazado. |
| PNF-04 | Separacion por negocio | Alterar o inventar `x-tenant-id` con un token valido. | No cambia el negocio: el tenant se deriva de la sesion. |
| PNF-05 | Disponibilidad demo | Reiniciar frontend manteniendo API. | PWA vuelve a cargar datos. |
| PNF-06 | Factura IA movil | Revisar extracción a 320, 390 y 768 px. | Sin zoom automático, desborde horizontal ni controles tapados permanentemente. |
| PNF-07 | Carga inicial movil | Revisar asistente y vista previa CSV a 320, 390 y 1280 px. | Las tarjetas se apilan, la tabla desplaza solo dentro de su contenedor y la página no produce zoom ni desborde horizontal. |
| PNF-08 | Venta Rápida movil | Revisar captura y revisión a 320, 390, 768 y 1280 px. | Botones táctiles, cantidades editables, barra inferior libre y sin desborde horizontal. |
| PNF-09 | Privacidad por rol | Ingresar como vendedor y consultar bootstrap. | No recibe ventas históricas, deuda, stock valorizado, gastos ni resultados financieros del dueño. |
| PNF-10 | Cuota de IA | Forzar respuesta 429 con `Retry-After`. | Venta Rápida explica cuánto esperar y no modifica ticket ni inventario. |
| PNF-11 | Resultado financiero | Registrar una venta y un gasto operativo categorizado. | Resultado estimado = margen bruto estimado - gastos operativos. |
| PNF-12 | Accesibilidad visual | Revisar contraste, foco y tamaños táctiles en ambos temas. | Texto legible, foco visible y acciones principales de al menos 44 px. |
| PNF-13 | Autorización SaaS | Alterar interfaz para invocar una función Pro desde Básico. | La API rechaza por entitlement central, aunque el botón se fuerce desde el navegador. |

## 6. Evidencias recomendadas

- Captura de pantalla del login.
- Captura de dashboard con caja diaria.
- Captura de creacion/edicion de producto.
- Captura de venta con ticket.
- Captura del dialogo de impresion.
- Captura de venta anulada.
- Captura de cierre de caja.
- Captura de Venta Rápida con varios productos, una coincidencia ambigua y total detectado.
- Captura de lectura de codigo de barras desde foto en celular.
- Captura de factura con productos coincidentes, nuevos y precio de venta confirmado.
- Captura desde iPhone.

## 7. Observaciones

El comprobante generado por Localito es interno y no tributario. La emision de boleta electronica legal queda fuera del alcance del MVP academico y requiere integracion con SII o proveedor autorizado.
