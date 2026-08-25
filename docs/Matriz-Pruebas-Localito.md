# Matriz de pruebas funcionales - Localito

**Proyecto:** Localito  
**Tipo:** PWA SaaS mobile-first para pequenos negocios  
**Objetivo del documento:** Servir como evidencia de validacion funcional para memoria, presentacion y defensa de tesis.

## 1. Alcance de pruebas

Estas pruebas validan el nucleo operacional de Localito. El reconocimiento visual externo es opcional; todos los demas flujos pueden probarse en navegador de escritorio y celular en red local.

## 2. Ambiente de prueba

| Elemento | Valor |
| --- | --- |
| Frontend | React + PWA |
| Backend | Node.js + API REST |
| Base de datos | Memory para demo rapida, PostgreSQL preparado |
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
| CP-29 | Webpay fiado | Compartir cobro | Entrar a Fiado, presionar Cobrar en cliente con deuda. | Se genera tarjeta Cobro listo con link, Compartir, WhatsApp y Copiar. | Pendiente evidencia |
| CP-30 | Webpay fiado | Confirmar pago demo | Generar cobro Webpay y presionar Confirmar demo. | El pago queda aprobado y la deuda del cliente disminuye por el monto cobrado. | Pendiente evidencia |
| CP-31 | Administración | Crear negocio | Iniciar como administrador y registrar negocio, dueño y clave segura. | Se crea un tenant aislado; el login público no permite crear negocios. | Pendiente evidencia |
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
