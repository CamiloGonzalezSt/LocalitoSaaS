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
| Duena/admin | `caj.gonzalezs@duocuc.cl` | `Duoc2026` |
| Duena/admin | `sam.solis@duocuc.cl` | `Duoc2026` |
| Duena/admin | `al.patino@duocuc.cl` | `Duoc2026` |
| Vendedor | `caj.gonzalezs+vendedor@duocuc.cl` | `Duoc2026V` |
| Vendedor | `sam.solis+vendedor@duocuc.cl` | `Duoc2026V` |
| Vendedor | `al.patino+vendedor@duocuc.cl` | `Duoc2026V` |

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
| CP-15 | IA | Reconocer por pista | Ir a Camara, escribir `pan`, detectar. | Devuelve producto, confianza y pide confirmacion. | Pendiente evidencia |
| CP-16 | Codigo de barras | Reconocer por codigo | Crear producto con codigo real, entrar a Camara y usar **Tomar foto** o ingresar `7801610001347`. | La app lee o recibe el codigo, busca el producto y devuelve confianza alta con fuente `barcode`. | Pendiente evidencia |
| CP-17 | IA | Guardar correccion | Detectar producto, elegir correccion y guardar. | Historial IA registra confirmacion/correccion. | Pendiente evidencia |
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
| CP-45 | Vision | Reconocer envase | Configurar `OPENAI_API_KEY`, fotografiar un producto catalogado. | La API propone coincidencia con confianza y permite corregir. | Pendiente evidencia |
| CP-46 | Seguridad | Recuperar contraseña | Solicitar el enlace, cambiar la clave y volver a usar el enlace. | La nueva clave funciona, sesiones anteriores quedan revocadas y el enlace no puede reutilizarse. | Automatizada aprobada |

## 5. Pruebas no funcionales sugeridas

| ID | NRF | Prueba | Resultado esperado |
| --- | --- | --- | --- |
| PNF-01 | Usabilidad movil | Ejecutar venta completa desde celular. | Flujo entendible, botones tactiles y sin desbordes. |
| PNF-02 | Rendimiento | Cargar dashboard con datos demo. | Carga inicial rapida en red local. |
| PNF-03 | Seguridad basica | Intentar login con clave incorrecta. | Acceso rechazado. |
| PNF-04 | Separacion por negocio | Alterar o inventar `x-tenant-id` con un token valido. | No cambia el negocio: el tenant se deriva de la sesion. |
| PNF-05 | Disponibilidad demo | Reiniciar frontend manteniendo API. | PWA vuelve a cargar datos. |

## 6. Evidencias recomendadas

- Captura de pantalla del login.
- Captura de dashboard con caja diaria.
- Captura de creacion/edicion de producto.
- Captura de venta con ticket.
- Captura del dialogo de impresion.
- Captura de venta anulada.
- Captura de cierre de caja.
- Captura de IA con confianza y correccion.
- Captura de lectura de codigo de barras desde foto en celular.
- Captura desde iPhone.

## 7. Observaciones

El comprobante generado por Localito es interno y no tributario. La emision de boleta electronica legal queda fuera del alcance del MVP academico y requiere integracion con SII o proveedor autorizado.
