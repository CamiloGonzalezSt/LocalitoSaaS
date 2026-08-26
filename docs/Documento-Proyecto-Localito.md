# Documento de Proyecto - Localito

**Proyecto:** Localito  
**Tipo de solucion:** PWA SaaS para gestion inteligente de pequenos negocios  
**Version del documento:** 2.0
**Estado:** Documento actualizado para tesis, trazabilidad Scrum y operación
**Fecha:** 25-08-2026

## 1. Resumen ejecutivo

Localito es una plataforma PWA de tipo SaaS orientada a pequenos negocios de barrio, tales como almacenes, botillerias, peluquerias, bazares, minimarkets, ferias y comercios familiares. Su objetivo es digitalizar procesos que normalmente se realizan en cuadernos, planillas, memoria o mensajes informales, entregando una herramienta simple para registrar ventas, controlar stock, administrar clientes, manejar fiados, generar alertas y registrar pagos presenciales realizados mediante medios externos.

La propuesta central es entregar una "caja inteligente de bolsillo" que funcione desde el celular, sin exigir infraestructura compleja ni conocimientos tecnicos avanzados. Al ser una PWA, el sistema puede instalarse desde el navegador, funcionar con una experiencia similar a una aplicacion movil y adaptarse a dispositivos de bajo costo.

El elemento diferenciador de Localito es **Venta Rápida**: el vendedor fotografía varios productos en una sola toma, el sistema propone productos y cantidades contra el catálogo del negocio y, después de una revisión humana, los agrega al ticket POS existente. El código de barras continúa disponible como alternativa exacta. La IA nunca fija precios, crea productos ni descuenta stock.

El proyecto busca resolver una necesidad real de digitalizacion en negocios pequenos, con una solucion cercana, economica, progresiva y centrada en el uso diario.

## 2. Planteamiento del problema

Muchos pequenos negocios de poblacion o barrio siguen gestionando sus operaciones de manera manual. Es comun que las ventas se anoten en cuadernos, el stock se controle visualmente, las cuentas fiadas dependan de la memoria del dueno y los reportes no existan o se hagan de forma muy basica.

Esta realidad genera problemas frecuentes:

- Perdida de control sobre el stock disponible.
- Ventas no registradas o registradas con errores.
- Dificultad para saber cuanto se vendio durante el dia.
- Deudas fiadas olvidadas o mal calculadas.
- Falta de alertas cuando un producto se esta agotando.
- Baja adopcion de pagos digitales por falta de herramientas simples.
- Dificultad para tomar decisiones de compra o reposicion.
- Dependencia excesiva del dueno para saber precios, clientes y productos.

Aunque existen sistemas de punto de venta y ERP, muchos estan pensados para empresas mas grandes, requieren computadores, impresoras, configuraciones complejas o costos que no siempre se ajustan a la realidad de un negocio pequeno. Localito busca cubrir ese espacio con una experiencia simple, movil y enfocada en el comercio de barrio.

## 3. Justificacion

Localito se justifica por su impacto practico, tecnologico y academico.

Desde el punto de vista practico, permite que pequenos negocios digitalicen procesos importantes sin depender de sistemas costosos o dificiles de usar. Esto puede mejorar su control financiero, reducir errores y facilitar la atencion a clientes.

Desde el punto de vista tecnologico, el proyecto integra varias areas relevantes para una tesis:

- Desarrollo web moderno con PWA.
- Arquitectura SaaS multi-tenant.
- Backend con API REST.
- Base de datos relacional.
- Integracion con servicios de pago.
- Uso de camara desde dispositivos moviles.
- Reconocimiento visual con IA.
- Gestion de inventario, ventas y clientes.
- Seguridad, autenticacion y roles.

Desde el punto de vista academico, el proyecto permite documentar un ciclo completo de desarrollo de software: levantamiento de requerimientos, diseno, metodologia agil Scrum, implementacion por incrementos, pruebas y evaluacion de usabilidad.

## 4. Objetivos

### 4.1 Objetivo general

Desarrollar una PWA SaaS inteligente para apoyar la gestion de ventas, inventario, clientes fiados y pagos digitales en pequenos negocios locales, incorporando reconocimiento de productos mediante camara e IA para agilizar la operacion diaria.

### 4.2 Objetivos especificos

- Analizar las necesidades operativas de pequenos negocios de barrio.
- Disenar una plataforma multi-tenant que separe la informacion de cada negocio.
- Implementar la gestion de productos, stock, ventas, clientes y fiados.
- Registrar medios de pago presenciales externos sin contratar ni acoplar una pasarela al MVP.
- Incorporar Venta Rápida con cámara para reconocer varios productos y cantidades en una fotografía.
- Usar IA visual para sugerir productos y agilizar la venta.
- Generar alertas de stock bajo, deudas pendientes y eventos relevantes.
- Construir reportes simples para apoyar la toma de decisiones.
- Aplicar metodologia Scrum durante la planificacion y desarrollo del proyecto.
- Evaluar la solucion mediante pruebas funcionales, tecnicas y de usabilidad.

## 5. Publico objetivo

El publico objetivo son pequenos negocios que necesitan una herramienta simple de gestion, especialmente aquellos ubicados en barrios, poblaciones o sectores donde el comercio local cumple un rol importante.

Ejemplos de usuarios:

- Duenos de almacenes.
- Botillerias.
- Peluquerias.
- Bazares.
- Verdulerias.
- Ferias o puestos pequenos.
- Minimarkets familiares.
- Tiendas de barrio.
- Emprendedores que venden productos de forma presencial.

El usuario principal puede no tener conocimientos tecnicos avanzados. Por esto, el sistema debe priorizar claridad, rapidez y baja friccion.

## 6. Propuesta de valor

Localito entrega valor mediante cuatro ideas principales:

1. **Digitalizacion simple:** permite pasar de cuaderno o memoria a una plataforma ordenada.
2. **Operacion desde celular:** no exige computador ni caja fisica tradicional.
3. **Control del fiado:** ayuda a registrar, recordar y cobrar deudas.
4. **Venta Rápida:** convierte una fotografía multiproducto revisada por el vendedor en líneas del ticket POS.

La frase guia del producto es:

> Localito: una caja inteligente de bolsillo para negocios de barrio.

## 7. Alcance del proyecto

### 7.1 Alcance del MVP

El MVP debe permitir que un negocio pequeno pueda operar sus procesos principales:

- Registro e inicio de sesion.
- Registro del negocio.
- Gestion de usuarios internos.
- Gestion de productos.
- Control de inventario.
- Registro de ventas.
- Descuento automatico de stock.
- Registro de clientes.
- Registro de ventas fiadas.
- Pagos parciales o totales de deudas.
- Alertas de stock bajo.
- Reportes basicos.
- Venta Rápida multiproducto con cámara e IA.
- Registro de efectivo, tarjeta en terminal externa, transferencia/QR, Webpay externo, fiado y pago mixto.

### 7.2 Fuera de alcance inicial

Para mantener el proyecto realizable en contexto de tesis, quedan fuera del MVP:

- Facturacion electronica real ante SII.
- Integracion contable avanzada.
- Manejo de multiples sucursales complejas.
- Prediccion avanzada de demanda con modelos entrenados a gran escala.
- Aplicaciones nativas Android/iOS.
- Integracion con impresoras fiscales.
- Marketplace publico de productos.
- Sistema de delivery propio.
- Integracion automática con bancos, Transbank, Mercado Pago o terminales POS.

Estas funciones pueden considerarse como roadmap futuro.

## 8. Roles del sistema

### 8.1 Administrador del sistema

Rol tecnico de la plataforma SaaS. Puede administrar parametros generales, monitorear negocios registrados y revisar informacion operacional global sin invadir datos sensibles.

Responsabilidades:

- Gestionar configuraciones generales.
- Revisar estado de la plataforma.
- Monitorear errores tecnicos.
- Mantener integraciones externas.

### 8.2 Dueno o administrador del negocio

Usuario principal de cada negocio.

Responsabilidades:

- Configurar datos del negocio.
- Crear y editar productos.
- Administrar usuarios del local.
- Crear vendedores cuando cambie el personal del negocio.
- Editar sus propios datos de perfil.
- Revisar ventas y reportes.
- Administrar clientes y fiados.
- Configurar alertas.
- Revisar ventas, caja y conciliación por medio de pago.

### 8.3 Vendedor

Usuario operativo del local.

Responsabilidades:

- Registrar ventas.
- Preparar una venta fotografiando varios productos.
- Consultar stock.
- Registrar clientes en una venta.
- Marcar ventas como pagadas o fiadas.
- Editar sus propios datos de perfil.
- Ver informacion limitada segun permisos.

### 8.4 Cliente del negocio

Persona que compra en el local. No requiere necesariamente una cuenta en la plataforma.

Puede:

- Comprar productos.
- Quedar asociado a una deuda fiada.
- Pagar presencialmente mediante el medio acordado con el negocio.

## 9. Modulos funcionales

### 9.1 Autenticacion y gestion de cuentas

Permite registrar usuarios, iniciar sesion, recuperar acceso y separar la informacion por negocio.

Funciones:

- Registro de usuario administrador.
- Inicio de sesion.
- Cierre de sesion.
- Recuperacion de contrasena.
- Asociacion de usuario a un negocio.
- Control de permisos por rol.
- Edicion de perfil propio para dueno/admin y vendedor.
- Creacion y desactivacion de vendedores por parte del dueno/admin.

### 9.2 Gestion del negocio

Permite configurar la informacion basica del local.

Funciones:

- Nombre del negocio.
- Rubro.
- Direccion.
- Telefono.
- Horario.
- Configuracion de moneda.
- Configuracion de metodos de pago.

### 9.3 Productos e inventario

Permite crear, editar, buscar y controlar productos.

Datos principales:

- Nombre.
- Categoria.
- Marca.
- Codigo de barras.
- Precio de costo.
- Precio de venta.
- Stock actual.
- Stock minimo.
- Imagen.
- Fecha de vencimiento opcional.
- Estado activo/inactivo.

### 9.4 Ventas y ticket

Permite registrar una venta de forma rapida.

Funciones:

- Crear nueva venta.
- Agregar productos por busqueda, codigo de barras o IA visual.
- Editar cantidades.
- Calcular total.
- Seleccionar metodo de pago.
- Confirmar venta.
- Descontar stock.
- Generar comprobante simple.

### 9.5 Clientes y fiado

Permite registrar clientes y controlar cuentas por cobrar.

Funciones:

- Crear cliente.
- Ver deuda total.
- Registrar venta fiada.
- Registrar abonos.
- Cerrar deuda.
- Ver historial.
- Generar recordatorio.
- Preparar recordatorio de deuda por WhatsApp.

### 9.6 Medios de pago externos

Localito es operado por el dueño o vendedor; el cliente no interactúa con la aplicación. En el MVP, los cobros presenciales se realizan fuera de Localito y el vendedor registra manualmente el medio utilizado.

Funciones:

- Registrar efectivo, tarjeta en terminal externa, transferencia o QR, Webpay externo, fiado y pago mixto.
- Mostrar claramente que las terminales y aplicaciones son externas.
- Permitir que el vendedor ingrese manualmente el total en el POS que ya tenga el negocio.
- No transmitir montos a terminales ni almacenar datos de tarjeta.
- Conservar la posibilidad de una integración automática como evolución futura opcional.

### 9.7 Camara e IA

Permite usar la camara como interfaz de venta y consulta.

Funciones:

- Abrir camara desde la PWA.
- Capturar imagen o video frame.
- Detectar producto.
- Leer codigo de barras cuando este disponible.
- Consultar producto en inventario.
- Mostrar stock y precio.
- Agregar producto al ticket.
- Solicitar confirmacion si la confianza de IA es baja.

### 9.8 Alertas

Permite informar eventos importantes.

Tipos de alerta:

- Stock bajo.
- Producto agotado.
- Deuda vencida.
- Producto proximo a vencer.
- Pago externo pendiente de confirmación.
- Producto no reconocido por IA.

### 9.9 Reportes

Permite revisar informacion simple del negocio.

Reportes iniciales:

- Ventas del dia.
- Ventas por semana.
- Productos mas vendidos.
- Total fiado.
- Total recuperado.
- Stock valorizado.
- Metodo de pago mas usado.

## 10. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
| --- | --- | --- |
| RF-01 | El sistema debe permitir registrar una cuenta de usuario administrador. | Alta |
| RF-02 | El sistema debe permitir iniciar y cerrar sesion. | Alta |
| RF-03 | El sistema debe permitir crear y configurar un negocio. | Alta |
| RF-04 | El sistema debe separar los datos por negocio mediante arquitectura multi-tenant. | Alta |
| RF-05 | El administrador del negocio debe poder crear, editar, desactivar y buscar productos. | Alta |
| RF-06 | El sistema debe permitir registrar stock actual y stock minimo por producto. | Alta |
| RF-07 | El sistema debe permitir registrar ventas con uno o mas productos. | Alta |
| RF-08 | El sistema debe descontar automaticamente el stock al confirmar una venta. | Alta |
| RF-09 | El sistema debe permitir registrar efectivo, tarjeta en terminal externa, transferencia/QR, Webpay externo, fiado o pago mixto. | Alta |
| RF-10 | El sistema debe permitir crear clientes asociados a un negocio. | Alta |
| RF-11 | El sistema debe permitir registrar una venta como fiada a un cliente. | Alta |
| RF-12 | El sistema debe permitir registrar abonos o pagos totales de una deuda. | Alta |
| RF-13 | El sistema debe mostrar el historial de compras y deudas de un cliente. | Media |
| RF-14 | El sistema debe generar alertas de stock bajo. | Alta |
| RF-15 | El sistema debe generar reportes basicos de ventas y fiados. | Media |
| RF-16 | El sistema debe permitir abrir la camara desde dispositivos compatibles. | Alta |
| RF-17 | El sistema debe reconocer productos mediante IA visual. | Alta |
| RF-18 | El sistema debe leer codigo de barras cuando el producto lo tenga disponible. | Media |
| RF-19 | El sistema debe mostrar stock, precio y nombre del producto reconocido. | Alta |
| RF-20 | El sistema debe permitir agregar el producto reconocido al ticket de venta. | Alta |
| RF-21 | El sistema debe solicitar confirmacion cuando la IA no tenga confianza suficiente. | Alta |
| RF-22 | El sistema debe registrar medios de pago externos sin enviar automáticamente el monto a un POS o pasarela. | Alta |
| RF-23 | El vendedor debe confirmar el cobro externo antes de finalizar la operación en Localito. | Alta |
| RF-24 | El sistema debe permitir administrar usuarios internos del negocio. | Media |
| RF-25 | El sistema debe permitir filtrar ventas por fecha, metodo de pago y vendedor. | Media |
| RF-26 | El sistema debe permitir importar hasta 500 productos mediante CSV con vista previa, validación e idempotencia. | Alta |
| RF-27 | El sistema debe permitir abrir y cerrar caja por turno, mostrando efectivo esperado, contado y diferencia. | Alta |
| RF-28 | El sistema debe registrar y categorizar gastos operativos. | Alta |
| RF-29 | El sistema debe mostrar ventas netas, margen estimado, gastos y resultado estimado al dueño. | Alta |
| RF-30 | Venta Rápida debe analizar varios productos y agrupar cantidades visibles. | Alta |
| RF-31 | Cada producto y cantidad propuestos por IA deben requerir confirmación humana. | Alta |
| RF-32 | El sistema debe permitir ingresar mercadería desde una factura fotografiada, con revisión previa e idempotencia. | Alta |
| RF-33 | El sistema debe mantener kardex para ventas, devoluciones, compras y ajustes. | Alta |
| RF-34 | El sistema debe exponer un estado de salud sin revelar secretos y usar almacenamiento persistente en producción. | Alta |

## 11. Requerimientos no funcionales

| ID | Requerimiento | Descripcion | Prioridad |
| --- | --- | --- | --- |
| NRF-01 | Usabilidad | La interfaz debe ser clara, simple y usable desde celular. | Alta |
| NRF-02 | Rendimiento | Las pantallas principales deben cargar rapidamente en redes moviles comunes. | Alta |
| NRF-03 | Disponibilidad | El sistema debe estar disponible para operaciones normales durante horarios comerciales. | Alta |
| NRF-04 | Seguridad | Las contrasenas deben almacenarse con hash seguro y nunca en texto plano. | Alta |
| NRF-05 | Privacidad | Los datos de un negocio no deben ser visibles por otros negocios. | Alta |
| NRF-06 | Escalabilidad | La arquitectura debe permitir agregar nuevos negocios sin redisenar el sistema. | Media |
| NRF-07 | Mantenibilidad | El codigo debe estar organizado por modulos y documentado cuando sea necesario. | Media |
| NRF-08 | Compatibilidad | La PWA debe funcionar en navegadores moviles modernos. | Alta |
| NRF-09 | Accesibilidad | La interfaz debe usar contraste adecuado, tamanos legibles y controles faciles de tocar. | Media |
| NRF-10 | Auditabilidad | Las ventas, pagos y cambios de stock deben quedar registrados. | Media |
| NRF-11 | Integridad | El stock no debe quedar inconsistente despues de una venta o anulacion. | Alta |
| NRF-12 | Recuperacion | El sistema debe manejar errores de red o fallos de pago sin perder el estado critico. | Alta |
| NRF-13 | Instalabilidad | La PWA debe poder instalarse en el dispositivo del usuario. | Media |
| NRF-14 | Portabilidad | El frontend y backend deben poder desplegarse en servicios cloud comunes. | Media |
| NRF-15 | Observabilidad | El sistema debe registrar errores relevantes para diagnostico tecnico. | Media |

## 12. Casos de uso

### CU-01 - Registrar negocio

**Actor principal:** Dueno del negocio  
**Objetivo:** Crear el espacio de trabajo del negocio en Localito.  
**Precondiciones:** El usuario debe tener una cuenta creada o estar en proceso de registro.  
**Flujo principal:**

1. El usuario ingresa sus datos de cuenta.
2. El sistema solicita los datos del negocio.
3. El usuario ingresa nombre, rubro, direccion y telefono.
4. El sistema crea el negocio como tenant independiente.
5. El sistema asigna al usuario como administrador del negocio.
6. El sistema redirige al panel principal.

**Flujos alternativos:**

- Si faltan datos obligatorios, el sistema muestra mensajes de validacion.
- Si el correo ya esta registrado, el sistema informa el conflicto.

**Postcondiciones:** El negocio queda creado y asociado al usuario administrador.

### CU-02 - Iniciar sesion

**Actor principal:** Administrador o vendedor  
**Objetivo:** Acceder al sistema.  
**Precondiciones:** El usuario debe estar registrado.  
**Flujo principal:**

1. El usuario ingresa correo y contrasena.
2. El sistema valida credenciales.
3. El sistema identifica el negocio asociado.
4. El sistema carga permisos del rol.
5. El usuario accede al panel principal.

**Flujos alternativos:**

- Si las credenciales son incorrectas, el sistema muestra error.
- Si la cuenta esta desactivada, el sistema bloquea el acceso.

**Postcondiciones:** El usuario queda autenticado.

### CU-03 - Crear producto

**Actor principal:** Administrador del negocio  
**Objetivo:** Registrar un producto en inventario.  
**Precondiciones:** El usuario debe estar autenticado y tener permisos.  
**Flujo principal:**

1. El usuario selecciona la opcion de productos.
2. El sistema muestra formulario de creacion.
3. El usuario ingresa nombre, categoria, precio, stock y stock minimo.
4. Opcionalmente ingresa codigo de barras e imagen.
5. El sistema valida los datos.
6. El sistema guarda el producto.
7. El producto queda disponible para ventas y escaneo.

**Flujos alternativos:**

- Si el codigo de barras ya existe en el negocio, el sistema solicita confirmacion o correccion.
- Si el precio es invalido, el sistema muestra error.

**Postcondiciones:** El producto queda registrado en el inventario del negocio.

### CU-04 - Registrar venta

**Actor principal:** Vendedor  
**Objetivo:** Registrar una venta y descontar stock.  
**Precondiciones:** El usuario debe estar autenticado y existir al menos un producto.  
**Flujo principal:**

1. El usuario selecciona "Nueva venta".
2. El sistema abre el ticket.
3. El usuario agrega productos por busqueda, codigo de barras o IA.
4. El sistema calcula subtotal, total y cantidades.
5. El usuario selecciona metodo de pago.
6. El usuario confirma la venta.
7. El sistema registra la venta.
8. El sistema descuenta el stock.
9. El sistema muestra comprobante simple.

**Flujos alternativos:**

- Si no hay stock suficiente, el sistema alerta y evita vender mas unidades que las disponibles.
- Si el usuario cancela la venta, no se descuenta stock.

**Postcondiciones:** La venta queda registrada y el stock actualizado.

### CU-05 - Registrar venta fiada

**Actor principal:** Vendedor  
**Objetivo:** Registrar una venta que el cliente pagara posteriormente.  
**Precondiciones:** Debe existir un cliente o debe crearse durante la venta.  
**Flujo principal:**

1. El usuario crea una venta.
2. El usuario agrega productos al ticket.
3. El usuario selecciona metodo de pago "Fiado".
4. El sistema solicita seleccionar o crear cliente.
5. El usuario confirma la venta.
6. El sistema registra la deuda asociada al cliente.
7. El sistema descuenta el stock.

**Flujos alternativos:**

- Si el cliente tiene deuda antigua, el sistema muestra advertencia.
- Si no se selecciona cliente, el sistema no permite confirmar como fiado.

**Postcondiciones:** La deuda queda registrada en la cuenta del cliente.

### CU-06 - Registrar abono de deuda

**Actor principal:** Administrador o vendedor autorizado  
**Objetivo:** Registrar un pago parcial o total de una deuda fiada.  
**Precondiciones:** El cliente debe tener deuda pendiente.  
**Flujo principal:**

1. El usuario busca al cliente.
2. El sistema muestra deuda total e historial.
3. El usuario selecciona "Registrar abono".
4. El usuario ingresa monto y metodo de pago.
5. El sistema valida el monto.
6. El sistema registra el abono.
7. El sistema actualiza la deuda pendiente.

**Flujos alternativos:**

- Si el monto supera la deuda, el sistema solicita correccion.
- Si el abono se realiza mediante un servicio externo, el vendedor confirma manualmente que recibió el pago.

**Postcondiciones:** La deuda del cliente queda actualizada.

### CU-07 - Preparar Venta Rápida con una fotografía

**Actor principal:** Vendedor  
**Objetivo:** Reconocer productos y cantidades desde una fotografía y preparar el ticket existente.
**Precondiciones:** El dispositivo debe tener camara disponible y permisos concedidos.  
**Flujo principal:**

1. El usuario abre Venta Rápida y toma o selecciona una fotografía.
2. El sistema comprime la imagen y la envía al backend.
3. El backend entrega a la IA únicamente el catálogo del negocio como contexto.
4. La IA propone todos los productos visibles y agrupa cantidades.
5. El backend valida la respuesta, descarta identificadores ajenos y obtiene precios y stock desde Localito.
6. El sistema muestra una revisión editable con advertencias de ambigüedad, cantidad y stock.
7. El vendedor confirma cada línea, corrige cantidades o cambia el producto.
8. El vendedor agrega el resultado al ticket POS existente.

**Flujos alternativos:**

- Si la confianza es baja, el sistema muestra opciones similares o permite busqueda manual.
- Si no hay conexion, el sistema informa que la IA no esta disponible.
- Si no existe el producto en inventario, el sistema permite buscar otro o ignorarlo; nunca lo crea automáticamente.

**Postcondiciones:** El producto queda identificado y puede ser usado en venta o consulta.

### CU-08 - Registrar un pago externo manual

**Actor principal:** Vendedor
**Objetivo:** Registrar el medio con que se cobró una venta sin integrar una pasarela o terminal.
**Precondiciones:** Debe existir un ticket listo para cobrar.
**Flujo principal:**

1. El vendedor revisa el total calculado por Localito.
2. Selecciona efectivo, tarjeta, transferencia/QR, Webpay externo, fiado o mixto.
3. Si corresponde, digita el monto manualmente en el terminal o aplicación externa.
4. Verifica la confirmación del pago fuera de Localito.
5. Confirma en Localito que recibió el pago.
6. El sistema registra venta, medio de pago, caja y movimiento de stock una sola vez.

**Flujos alternativos:**

- Si el pago externo falla, el vendedor no confirma la venta y puede elegir otro medio.
- Si el pago es mixto, la suma de los montos debe coincidir con el total.
- Si es fiado, debe asociarse un cliente y respetarse la regla de crédito vigente.

**Postcondiciones:** La venta queda registrada con trazabilidad del medio informado por el vendedor.

### CU-09 - Ver alertas de stock

**Actor principal:** Administrador del negocio  
**Objetivo:** Identificar productos que requieren reposicion.  
**Precondiciones:** Los productos deben tener stock minimo configurado.  
**Flujo principal:**

1. El usuario entra al panel principal.
2. El sistema revisa productos con stock menor o igual al minimo.
3. El sistema muestra alertas destacadas.
4. El usuario revisa detalle del producto.
5. El usuario decide reponer o ajustar stock.

**Flujos alternativos:**

- Si no existen productos bajo minimo, el sistema no muestra alerta critica.

**Postcondiciones:** El usuario queda informado del estado de inventario.

### CU-10 - Ver reportes

**Actor principal:** Administrador del negocio  
**Objetivo:** Revisar informacion comercial del local.  
**Precondiciones:** Deben existir ventas o movimientos registrados.  
**Flujo principal:**

1. El usuario ingresa a reportes.
2. El sistema muestra ventas del dia.
3. El usuario selecciona filtros de fecha.
4. El sistema muestra totales, productos mas vendidos y fiado pendiente.
5. El usuario interpreta la informacion para tomar decisiones.

**Flujos alternativos:**

- Si no existen ventas, el sistema muestra estado vacio explicativo.

**Postcondiciones:** El usuario visualiza indicadores del negocio.

### CU-11 - Administrar usuarios del negocio

**Actor principal:** Administrador del negocio  
**Objetivo:** Crear usuarios vendedores y asignar permisos.  
**Precondiciones:** El administrador debe estar autenticado.  
**Flujo principal:**

1. El administrador entra a configuracion.
2. El sistema muestra usuarios del negocio.
3. El administrador crea un nuevo usuario.
4. El administrador asigna rol.
5. El sistema envia o genera credenciales iniciales.
6. El nuevo usuario puede iniciar sesion.

**Flujos alternativos:**

- Si el correo ya existe, el sistema informa el conflicto.
- Si el rol no es valido, el sistema bloquea el guardado.

**Postcondiciones:** El negocio cuenta con un nuevo usuario operativo.

### CU-12 - Crear producto desde reconocimiento IA

**Actor principal:** Administrador del negocio  
**Objetivo:** Agilizar el registro de productos usando una fotografia.  
**Precondiciones:** El usuario debe tener permisos de administracion de productos.  
**Flujo principal:**

1. El usuario selecciona "Crear producto con camara".
2. El sistema abre la camara.
3. El usuario fotografia el producto.
4. La IA sugiere nombre, categoria y marca.
5. El usuario revisa y corrige los datos.
6. El usuario ingresa precio y stock.
7. El sistema guarda el producto.

**Flujos alternativos:**

- Si la IA no reconoce el producto, el sistema permite carga manual.
- Si el producto ya existe, el sistema sugiere actualizar stock.

**Postcondiciones:** El producto queda registrado o actualizado.

## 13. Historias de usuario

| ID | Historia | Criterio de aceptacion principal |
| --- | --- | --- |
| HU-01 | Como dueno, quiero registrar mi negocio para comenzar a usar Localito. | El negocio queda creado y separado de otros negocios. |
| HU-02 | Como vendedor, quiero iniciar sesion para acceder solo a las funciones permitidas. | El sistema carga el panel segun mi rol. |
| HU-03 | Como dueno, quiero registrar productos para venderlos desde la app. | El producto aparece disponible en el inventario. |
| HU-04 | Como vendedor, quiero fotografiar varios productos para preparar una venta con menos pasos. | Los productos y cantidades revisados se agregan al ticket POS existente. |
| HU-05 | Como vendedor, quiero registrar una venta para actualizar el stock automaticamente. | La venta queda guardada y el stock disminuye. |
| HU-06 | Como dueno, quiero ver alertas de stock bajo para reponer a tiempo. | El sistema muestra productos bajo el minimo configurado. |
| HU-07 | Como vendedor, quiero registrar una venta fiada para un cliente frecuente. | La deuda queda asociada al cliente. |
| HU-08 | Como dueno, quiero ver cuanto debe cada cliente para controlar los fiados. | El sistema muestra deuda total e historial. |
| HU-09 | Como vendedor, quiero registrar el medio de un abono recibido para conciliar la deuda. | El sistema actualiza la deuda y conserva el medio informado. |
| HU-10 | Como dueno, quiero ver reportes simples para saber como va mi negocio. | El sistema muestra ventas, productos mas vendidos y fiado pendiente. |
| HU-11 | Como administrador, quiero crear usuarios vendedores para delegar la atencion. | El vendedor puede iniciar sesion con permisos limitados. |
| HU-12 | Como dueno, quiero crear productos desde una foto para ahorrar tiempo. | La IA sugiere datos y el usuario puede confirmarlos. |

## 14. Arquitectura propuesta

Localito se propone como una arquitectura web moderna de tres capas, complementada por integraciones externas. Esta forma de organizar el sistema permite separar responsabilidades, facilitar el mantenimiento y explicar claramente la solucion en contexto academico.

### 14.1 Arquitectura de tres capas

| Capa | Responsabilidad | Tecnologia propuesta |
| --- | --- | --- |
| Presentacion | Interfaz de usuario, experiencia PWA, uso de camara, navegacion movil y captura de acciones del usuario. | React + PWA |
| Logica de negocio | Reglas de venta, stock, fiado, autenticacion, roles, pagos, validaciones e integracion con servicios externos. | Node.js + API REST |
| Datos | Persistencia de negocios, usuarios, productos, clientes, ventas, fiados, pagos, alertas y registros de IA. | PostgreSQL |

Ademas de estas tres capas, el backend se comunica con un proveedor de IA visual para reconocimiento de productos y extracción de facturas. Los cobros con tarjeta, transferencia, QR o Webpay se realizan externamente y Localito solo registra el medio confirmado por el vendedor.

### 14.2 Componentes principales

- **Frontend PWA:** Aplicacion React instalable, optimizada para celular.
- **Backend API REST:** Servicio Node.js responsable de reglas de negocio, autenticacion e integraciones.
- **Base de datos PostgreSQL:** Persistencia de usuarios, negocios, productos, ventas, clientes, deudas y pagos.
- **Servicio de IA:** Componente encargado de reconocimiento visual de productos.
- **Medios de pago externos:** Terminal o aplicación independiente; no existe integración automática en el MVP.
- **Almacenamiento de imagenes:** Servicio para fotos de productos y capturas necesarias.

### 14.3 Diagrama de arquitectura

```mermaid
flowchart TD
    A["Usuario en celular"] --> B["PWA React"]
    B --> C["API REST Node.js"]
    C --> D["PostgreSQL"]
    C --> E["Servicio de IA visual"]
    B -. "Confirmación manual" .-> F["Terminal o app de pago externa"]
    B --> G["Camara del dispositivo"]
    G --> B
    E --> C
    C --> H["Almacenamiento de imagenes"]
```

### 14.4 Principios de diseno

- Separar claramente frontend y backend.
- Mantener reglas de negocio en el backend.
- Usar tenant o identificador de negocio en las entidades principales.
- Priorizar flujos rapidos para celular.
- Evitar que un usuario pueda acceder a datos de otro negocio.
- Disenar la IA como ayuda, no como unica fuente de verdad.
- Mantener los pagos externos desacoplados y exigir confirmación humana antes de registrar la venta.

## 15. Modelo de datos conceptual

### 15.1 Entidades principales

| Entidad | Descripcion |
| --- | --- |
| Usuario | Persona que accede al sistema. |
| Negocio | Tenant o local que usa Localito. |
| Rol | Permisos asociados al usuario dentro del negocio. |
| Producto | Item disponible para venta. |
| Categoria | Agrupacion de productos. |
| MovimientoStock | Registro de entradas, salidas o ajustes de inventario. |
| Venta | Transaccion comercial. |
| DetalleVenta | Productos y cantidades dentro de una venta. |
| Cliente | Persona que compra o puede quedar con deuda. |
| CuentaFiado | Registro agrupado de deuda de un cliente. |
| AbonoFiado | Pago parcial o total de una deuda. |
| Pago | Registro del medio informado: efectivo, transferencia/QR, tarjeta externa, Webpay externo, fiado o mixto. |
| Alerta | Evento que requiere atencion del usuario. |
| ReconocimientoIA | Registro de intentos de reconocimiento de productos. |

### 15.2 Relaciones conceptuales

```mermaid
erDiagram
    NEGOCIO ||--o{ USUARIO : tiene
    NEGOCIO ||--o{ PRODUCTO : administra
    NEGOCIO ||--o{ CLIENTE : registra
    NEGOCIO ||--o{ VENTA : genera
    PRODUCTO ||--o{ DETALLE_VENTA : aparece_en
    VENTA ||--o{ DETALLE_VENTA : contiene
    CLIENTE ||--o{ CUENTA_FIADO : posee
    CUENTA_FIADO ||--o{ ABONO_FIADO : recibe
    VENTA ||--o{ PAGO : se_paga_con
    PRODUCTO ||--o{ MOVIMIENTO_STOCK : tiene
    PRODUCTO ||--o{ RECONOCIMIENTO_IA : puede_ser_detectado
    NEGOCIO ||--o{ ALERTA : genera
```

### 15.3 Campos sugeridos por entidad

**Negocio**

- id
- nombre
- rubro
- direccion
- telefono
- email_contacto
- estado
- fecha_creacion

**Usuario**

- id
- negocio_id
- nombre
- email
- password_hash
- rol
- estado
- fecha_creacion

**Producto**

- id
- negocio_id
- categoria_id
- nombre
- marca
- descripcion
- codigo_barras
- precio_costo
- precio_venta
- stock_actual
- stock_minimo
- imagen_url
- fecha_vencimiento
- activo

**Venta**

- id
- negocio_id
- usuario_id
- cliente_id
- total
- metodo_pago
- estado_pago
- tipo_venta
- fecha_creacion

**DetalleVenta**

- id
- venta_id
- producto_id
- cantidad
- precio_unitario
- subtotal

**Cliente**

- id
- negocio_id
- nombre
- telefono
- email
- direccion
- observacion
- activo

**Pago**

- id
- negocio_id
- venta_id
- cliente_id
- monto
- metodo
- estado
- transaccion_externa_id
- fecha_creacion

## 16. Flujo de venta

```mermaid
flowchart TD
    A["Iniciar nueva venta"] --> B["Agregar productos"]
    B --> C["Calcular total"]
    C --> D["Seleccionar metodo de pago"]
    D --> E{Metodo}
    E -->|Efectivo o medio externo confirmado| F["Confirmar venta"]
    E -->|Fiado| G["Seleccionar cliente"]
    G --> F
    F --> J["Registrar venta"]
    J --> K["Descontar stock"]
    K --> L["Generar comprobante"]
```

### Reglas del flujo

- Una venta solo se confirma si contiene al menos un producto.
- El stock se descuenta al confirmar la venta.
- Si el metodo es fiado, debe existir un cliente asociado.
- Si se usa tarjeta, transferencia, QR o Webpay externo, el vendedor verifica el pago y luego confirma manualmente la venta.
- Si no hay stock suficiente, el sistema debe impedir o advertir segun configuracion definida.

## 17. Flujo de fiado

```mermaid
flowchart TD
    A["Cliente compra"] --> B["Vendedor selecciona Fiado"]
    B --> C["Buscar o crear cliente"]
    C --> D["Confirmar venta"]
    D --> E["Registrar deuda"]
    E --> F["Actualizar cuenta del cliente"]
    F --> G["Mostrar deuda pendiente"]
    G --> H["Registrar abono futuro"]
```

### Reglas del fiado

- Toda venta fiada debe estar asociada a un cliente.
- El sistema debe permitir pagos parciales.
- El historial no debe eliminarse aunque la deuda quede pagada.
- Una deuda puede abonarse con efectivo o con un medio externo registrado manualmente.
- El administrador debe poder ver deuda total por cliente.

## 18. Flujo de pago externo manual

```mermaid
sequenceDiagram
    participant V as Vendedor
    participant L as Localito
    participant P as POS/App externa
    participant C as Cliente

    V->>L: Revisa el total y elige el medio
    V->>P: Ingresa manualmente el monto
    C->>P: Paga con tarjeta, transferencia o QR
    P-->>V: Muestra confirmación externa
    V->>L: Confirma pago recibido
    L->>L: Registra venta, medio y stock
    L-->>V: Muestra comprobante interno
```

### Medios disponibles

- Efectivo.
- Tarjeta en terminal externa.
- Transferencia o QR externo, incluido Mercado Pago estático.
- Webpay externo.
- Fiado.
- Pago mixto.

### Consideraciones

- El vendedor digita el monto en el equipo externo; Localito no requiere integración pagada.
- Nunca se guardan datos sensibles de tarjeta.
- El cliente no necesita cuenta ni acceso a Localito.
- Una integración automática con Transbank o Mercado Pago queda fuera del MVP y requeriría contratación y credenciales propias de cada negocio.

## 19. Flujo de Venta Rápida con IA

```mermaid
flowchart TD
    A["Abrir cámara o subir foto"] --> B["Comprimir y previsualizar"]
    B --> C["Backend entrega catálogo aislado a visión"]
    C --> D["IA propone IDs y cantidades estructuradas"]
    D --> E["Backend valida IDs contra catálogo"]
    E --> F["Localito completa precio y stock desde base de datos"]
    F --> G{Coincidencia clara}
    G -->|Sí| H["Preseleccionar producto"]
    G -->|No| I["Confirmar, buscar o ignorar"]
    H --> J["Revisión de cantidades y stock"]
    I --> J
    J --> K["Agregar líneas al ticket POS existente"]
    K --> L["Cobrar con flujo normal"]
    L --> M["Venta confirmada descuenta stock una vez"]
```

### Reglas del reconocimiento

- La interfaz evita porcentajes técnicos; utiliza estados claros: listo, confirmar o no reconocido.
- El usuario siempre puede corregir cantidad, reemplazar, buscar o ignorar un producto.
- Solo se aceptan IDs existentes y activos del catálogo del negocio autenticado.
- Los precios y el stock provienen de Localito, nunca de la imagen ni del modelo.
- El reconocimiento no debe modificar stock por si solo.
- El stock solo cambia cuando se confirma una venta, entrada o ajuste.
- Si la IA falla, el sistema debe permitir busqueda manual.
- Las imágenes se reducen en el navegador, se procesan con `store: false` y no se persisten en Localito.

### Datos que puede usar la IA

- Imagen del producto.
- Codigo de barras detectado.
- Nombre y marca de productos registrados.
- Imagenes guardadas en el inventario.
- Historial de correcciones del usuario.

### Resultado esperado

El sistema debe mostrar una tarjeta de resultado con:

- Nombre del producto sugerido.
- Imagen o referencia.
- Precio de venta.
- Stock disponible.
- Confianza de IA.
- Boton para agregar al ticket.
- Boton para corregir o buscar manualmente.

## 20. Alertas y reportes

### 20.1 Alertas iniciales

| Alerta | Disparador | Accion sugerida |
| --- | --- | --- |
| Stock bajo | stock_actual menor o igual a stock_minimo | Reponer producto |
| Producto agotado | stock_actual igual a 0 | Ocultar de venta o reponer |
| Deuda pendiente | cliente mantiene deuda abierta | Registrar abono o enviar recordatorio |
| Deuda antigua | deuda supera dias definidos | Contactar cliente |
| Pago externo no confirmado | El vendedor no observa confirmación en el terminal o aplicación | No registrar la venta y usar otro medio |
| IA con baja confianza | reconocimiento bajo umbral | Confirmar manualmente |

### 20.2 Reportes iniciales

- Total de ventas del dia.
- Total de ventas por rango de fechas.
- Ventas por metodo de pago.
- Productos mas vendidos.
- Productos con bajo stock.
- Clientes con mayor deuda.
- Total fiado pendiente.
- Total recuperado de fiados.
- Stock valorizado.

### 20.3 Indicadores sugeridos

- Ingresos diarios.
- Ticket promedio.
- Cantidad de ventas.
- Porcentaje de ventas fiadas.
- Monto pendiente por cobrar.
- Productos criticos por stock.
- Tasa de reconocimiento exitoso de IA.

## 21. Seguridad y privacidad

### 21.1 Principios

- Cada negocio solo puede acceder a sus propios datos.
- El backend debe validar permisos en cada operacion.
- La autenticacion debe usar tokens o sesiones seguras.
- Las contrasenas deben almacenarse usando hash seguro.
- Los pagos con tarjeta se procesan fuera de Localito y nunca se almacenan datos sensibles.
- Las imagenes usadas por IA deben manejarse con criterio de privacidad.

### 21.2 Riesgos de seguridad

- Acceso indebido a datos de otro negocio.
- Robo de credenciales.
- Manipulacion de precios o stock.
- Confirmacion falsa de pagos.
- Exposicion de datos personales de clientes.

### 21.3 Medidas de mitigacion

- Validar `negocio_id` en consultas y operaciones.
- Usar roles y permisos.
- Registrar acciones criticas.
- Exigir confirmación explícita del vendedor e idempotencia al registrar ventas.
- Usar HTTPS en despliegue.
- Limitar informacion sensible visible para vendedores.
- Definir politicas de eliminacion o anonimizado de datos.

## 22. Metodologia agil Scrum

El proyecto se desarrollara usando Scrum, con sprints de 2 semanas. Esta metodologia permite avanzar por incrementos, revisar resultados frecuentemente y ajustar prioridades segun aprendizaje tecnico o feedback de usuarios.

### 22.1 Roles Scrum

**Product Owner**

- Define prioridades.
- Mantiene el product backlog.
- Valida si el incremento cumple el objetivo.
- Representa la vision del producto.

**Scrum Master**

- Facilita ceremonias.
- Ayuda a eliminar bloqueos.
- Cuida que el equipo aplique Scrum.
- Promueve mejora continua.

**Development Team**

- Disena, implementa, prueba y documenta.
- Estima historias.
- Entrega incrementos funcionales.
- Participa en revisiones y retrospectivas.

### 22.2 Ceremonias

| Ceremonia | Frecuencia | Objetivo |
| --- | --- | --- |
| Sprint Planning | Inicio de cada sprint | Definir objetivo y backlog del sprint. |
| Daily Scrum | Diaria o 3 veces por semana segun disponibilidad academica | Sincronizar avance, bloqueos y proximas tareas. |
| Sprint Review | Fin de sprint | Mostrar incremento y recibir feedback. |
| Sprint Retrospective | Fin de sprint | Mejorar forma de trabajo del equipo. |
| Refinamiento de backlog | Una vez por sprint | Aclarar historias futuras. |

### 22.3 Artefactos

- **Product Backlog:** lista priorizada de historias y tareas.
- **Sprint Backlog:** historias comprometidas para el sprint actual.
- **Incremento:** version funcional al cierre del sprint.
- **Definition of Done:** criterios minimos para considerar terminado un item.
- **Burndown o tablero:** seguimiento visual del avance.

### 22.4 Definition of Ready

Una historia esta lista para entrar a sprint cuando:

- Tiene descripcion clara.
- Tiene criterios de aceptacion.
- Su alcance es entendible.
- Sus dependencias estan identificadas.
- Puede completarse dentro del sprint.

### 22.5 Definition of Done

Una historia se considera terminada cuando:

- La funcionalidad esta implementada.
- Cumple criterios de aceptacion.
- Tiene validaciones basicas.
- Fue probada por el equipo.
- No rompe flujos existentes.
- Esta documentada si agrega comportamiento relevante.
- Fue revisada por al menos otro integrante.

## 23. Product backlog inicial

| Prioridad | Historia / Epica | Descripcion |
| --- | --- | --- |
| Alta | Configuracion base del proyecto | Crear estructura frontend, backend, base de datos y repositorio. |
| Alta | Autenticacion | Registro, login, logout y proteccion de rutas. |
| Alta | Multi-tenant | Separar datos por negocio. |
| Alta | Gestion de productos | CRUD de productos con stock y precio. |
| Alta | Registro de ventas | Crear ticket, agregar productos y confirmar venta. |
| Alta | Descuento de stock | Actualizar inventario automaticamente al vender. |
| Alta | Clientes | Crear y consultar clientes del negocio. |
| Alta | Fiado | Registrar deudas, abonos e historial. |
| Alta | Camara | Acceso a camara desde PWA. |
| Alta | IA visual | Reconocer productos mediante imagen. |
| Media | Codigo de barras | Leer codigo como apoyo al reconocimiento. |
| Alta | Pagos externos manuales | Registrar terminal, transferencia/QR, Webpay externo y pago mixto sin enviar montos. |
| Media | Alertas | Stock bajo, deuda antigua y pago fallido. |
| Media | Reportes | Ventas, productos vendidos y fiado pendiente. |
| Media | Usuarios internos | Crear vendedores, editar perfil propio y validar permisos. |
| Media | PWA instalable | Manifest, service worker y experiencia movil. |
| Baja | Productos con vencimiento | Alertas por fecha de vencimiento. |
| Baja | Recomendaciones inteligentes | Sugerencias simples segun ventas y stock. |

## 24. Plan de sprints

Los sprints se planifican con duracion de 2 semanas.

| Sprint | Objetivo | Entregables esperados |
| --- | --- | --- |
| Sprint 0 | Preparacion y diseno | Documento base, backlog, arquitectura, wireframes iniciales y configuracion de repositorio. |
| Sprint 1 | Base tecnica y autenticacion | Frontend React, backend Node.js, base PostgreSQL, login, registro y estructura multi-tenant inicial. |
| Sprint 2 | Productos e inventario | CRUD de productos, categorias, stock actual, stock minimo y busqueda. |
| Sprint 3 | Ventas | Ticket de venta, agregar productos, confirmar venta, descuento de stock y comprobante simple. |
| Sprint 4 | Clientes y fiado | CRUD de clientes, venta fiada, deuda por cliente, abonos e historial. |
| Sprint 5 | Camara e IA | Acceso a camara, captura de imagen, reconocimiento visual, confirmacion de producto y agregado al ticket. |
| Sprint 6 | Caja, pagos y alertas | Medios externos manuales, cierre de caja, gastos, alertas de stock y deuda pendiente. |
| Sprint 7 | Reportes y PWA | Reportes basicos, instalabilidad PWA, ajustes responsive y mejoras de experiencia movil. |
| Sprint 8 | Pruebas, documentacion y cierre | Pruebas funcionales, correcciones, documentacion final, preparacion de demo y memoria. |

## 25. Estrategia de pruebas

### 25.1 Pruebas funcionales

- Registro de usuario y negocio.
- Inicio y cierre de sesion.
- Creacion y edicion de productos.
- Registro de venta normal.
- Registro de venta fiada.
- Registro de abono.
- Generacion de alerta de stock bajo.
- Registro de efectivo, terminal externa, transferencia/QR, fiado y pago mixto.
- Reconocimiento de producto con IA.
- Correccion manual de producto reconocido.

### 25.2 Pruebas no funcionales

- Prueba en navegador movil.
- Prueba de carga inicial de PWA.
- Prueba de permisos de camara.
- Prueba de separacion de datos entre negocios.
- Prueba de roles y permisos.
- Prueba de respuesta ante errores de red.

### 25.3 Pruebas de usabilidad

Escenarios sugeridos para usuarios:

1. Crear un producto nuevo.
2. Registrar una venta.
3. Fotografiar varios productos con Venta Rápida, revisar la propuesta y enviarla al ticket.
4. Registrar una venta fiada.
5. Ver cuanto debe un cliente.
6. Revisar productos con bajo stock.

Indicadores a observar:

- Tiempo para completar la tarea.
- Cantidad de errores.
- Dudas del usuario.
- Claridad de botones y textos.
- Percepcion de utilidad.

## 26. Criterios de aceptacion generales

El MVP se considerara aceptado si:

- Un negocio puede registrarse e iniciar sesion.
- Los datos de cada negocio quedan separados.
- Se pueden crear productos con precio y stock.
- Se puede registrar una venta con descuento de stock.
- Se puede registrar una venta fiada asociada a un cliente.
- Se pueden registrar abonos.
- Se pueden ver alertas de stock bajo.
- Se pueden consultar reportes basicos.
- La camara puede reconocer o sugerir productos mediante IA.
- El usuario puede corregir una sugerencia de IA.
- Se puede registrar y conciliar cada medio de pago manual admitido.
- La PWA funciona correctamente en dispositivos moviles modernos.
- Existe documentacion suficiente para explicar arquitectura, uso y metodologia.

## 27. Riesgos y mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigacion |
| --- | --- | --- | --- |
| La IA no reconoce productos con precision suficiente. | Alto | Media | Usar confirmacion manual, codigo de barras como apoyo y dataset controlado para demo. |
| El vendedor confirma como recibido un pago externo que falló. | Alto | Media | Mensajes explícitos, doble confirmación operativa y conciliación de caja. |
| El alcance crece demasiado. | Alto | Alta | Mantener MVP claro y dejar funciones avanzadas en roadmap. |
| Problemas con permisos de camara en algunos dispositivos. | Medio | Media | Probar en navegadores moviles modernos y ofrecer busqueda manual. |
| Inconsistencias de stock. | Alto | Media | Registrar movimientos de stock y actualizar desde backend. |
| Dificultad del usuario para adoptar la app. | Medio | Media | Priorizar interfaz simple, botones grandes y flujos cortos. |
| Falta de tiempo academico. | Alto | Media | Planificar sprints realistas y priorizar funcionalidades criticas. |
| Datos sensibles mal protegidos. | Alto | Baja | Aplicar autenticacion, roles, HTTPS y separacion multi-tenant. |

## 28. Roadmap futuro

Despues del MVP, Localito podria evolucionar con:

- Facturacion electronica.
- Integracion con proveedores.
- Prediccion de demanda.
- Recomendaciones automaticas de compra.
- Notificaciones push.
- Modo offline parcial.
- Exportacion a Excel o PDF.
- Lectura masiva de productos.
- Panel administrativo para multiples sucursales.
- Integracion con WhatsApp Business.
- Programa de fidelizacion de clientes.
- Analisis avanzado de ventas.

## 29. Glosario

| Termino | Definicion |
| --- | --- |
| PWA | Aplicacion web progresiva que puede instalarse y funcionar con experiencia similar a una app movil. |
| SaaS | Software como servicio, donde varios clientes usan una plataforma centralizada. |
| Tenant | Espacio separado de datos correspondiente a un negocio dentro del SaaS. |
| Fiado | Venta en la que el cliente recibe productos y paga posteriormente. |
| Stock | Cantidad disponible de un producto. |
| Stock minimo | Cantidad definida como umbral para generar alerta de reposicion. |
| Ticket | Resumen de productos incluidos en una venta. |
| Pago externo | Cobro realizado en efectivo, terminal o aplicación independiente y registrado manualmente en Localito. |
| IA visual | Inteligencia artificial aplicada al reconocimiento de imagenes. |
| CRUD | Crear, leer, actualizar y eliminar datos. |
| API REST | Interfaz de comunicacion entre frontend y backend usando HTTP. |
| Sprint | Periodo corto de trabajo en Scrum para entregar un incremento. |
| Backlog | Lista priorizada de funcionalidades, historias y tareas. |
| Definition of Done | Condiciones que debe cumplir una tarea para considerarse terminada. |

## 30. Prompt Maestro Para Disenar y Prototipar Localito

El siguiente prompt puede usarse en una herramienta de IA para generar diseno UI/UX, prototipo visual o una base frontend React/PWA. Puede copiarse y adaptarse segun la herramienta utilizada.

```text
Actua como un equipo senior de producto, UX/UI y frontend especializado en aplicaciones SaaS moviles para pequenos negocios. Necesito disenar y prototipar "Localito", una PWA SaaS para negocios de barrio como almacenes, botillerias, peluquerias, bazares, minimarkets y comercios familiares.

Contexto del producto:
Localito es una caja inteligente de bolsillo. Permite registrar ventas, controlar stock, administrar clientes, manejar fiados, registrar medios de pago presenciales y usar la camara del celular con IA para reconocer productos, consultar unidades disponibles y agregarlos a un ticket de venta.

Publico objetivo:
Usuarios no tecnicos, duenos y vendedores de pequenos negocios. La app debe sentirse simple, rapida, clara y confiable. Debe priorizar el uso desde celular, con botones grandes, textos comprensibles y flujos cortos.

Stack objetivo:
- Frontend React.
- PWA instalable.
- Backend Node.js con API REST.
- Base de datos PostgreSQL.
- Registro manual de pagos realizados en medios externos.
- IA visual para reconocimiento de productos con camara.

Disena una experiencia completa para:
1. Login y registro de negocio.
2. Dashboard principal con ventas del dia, alertas y accesos rapidos.
3. Gestion de productos e inventario.
4. Nueva venta con ticket.
5. Venta Rápida con cámara e IA para proponer productos y cantidades del catálogo.
6. Consulta de stock desde camara.
7. Clientes y fiado.
8. Detalle de deuda de cliente y registro de abono.
9. Cobro presencial con efectivo o medio externo confirmado por el vendedor.
10. Alertas de stock bajo y deudas pendientes.
11. Reportes basicos.
12. Configuracion del negocio y usuarios.

Requisitos de UX:
- La primera pantalla despues del login debe ser el dashboard operativo, no una landing page.
- El flujo de venta debe poder completarse en pocos toques.
- El modo camara debe tener una interfaz clara: producto detectado, confianza, stock, precio y boton para agregar al ticket.
- Si la IA no esta segura, debe pedir confirmacion o mostrar opciones similares.
- Siempre debe existir busqueda manual como alternativa.
- El modulo de fiado debe mostrar claramente quien debe, cuanto debe y desde cuando.
- La app debe usar lenguaje cercano y simple, evitando tecnicismos innecesarios.
- El diseno debe ser profesional, sobrio y orientado a trabajo diario.
- No usar una estetica de landing page de marketing. Debe sentirse como una herramienta real de operacion.

Requisitos visuales:
- Diseno mobile-first.
- Layout claro para pantallas pequenas.
- Botones tactiles grandes.
- Iconos para acciones frecuentes.
- Colores con buen contraste.
- Estados visuales para exito, alerta, error y pendiente.
- Tablas o listas simples para productos, clientes y ventas.
- Dashboard denso pero legible.
- Evitar decoraciones innecesarias.

Pantallas minimas a entregar:
- Login.
- Registro del negocio.
- Dashboard.
- Productos.
- Crear/editar producto.
- Nueva venta.
- Camara IA.
- Resultado de producto detectado.
- Clientes.
- Detalle de cliente y fiado.
- Selector de medio de pago y confirmación manual.
- Reportes.
- Configuracion.

Componentes esperados:
- Barra de navegacion inferior mobile.
- Header con nombre del negocio.
- Boton principal de nueva venta.
- Buscador de productos.
- Tarjeta de alerta.
- Item de producto.
- Ticket de venta.
- Selector de metodo de pago.
- Modal de confirmacion.
- Vista de camara.
- Tarjeta de producto detectado por IA.
- Lista de clientes con deuda.
- Indicadores de dashboard.

Si generas codigo:
- Usa React con componentes reutilizables.
- Organiza la app por modulos.
- Usa datos mock iniciales si no hay backend.
- Deja preparada la estructura para conectar API REST.
- Implementa responsive design.
- Incluye manifest PWA y estructura base de service worker si corresponde.
- Mantiene el codigo claro y facil de explicar en una tesis.

Resultado esperado:
Entrega un prototipo o diseno completo de Localito que permita entender como funcionara la PWA en un negocio real, especialmente el flujo de venta, el manejo de fiado y Venta Rápida multiproducto desde la cámara.
```

## 31. Estado actual de desarrollo

La version actual deja un nucleo operacional conectado entre frontend, API REST y una capa de persistencia intercambiable. Puede ejecutarse en memoria para demostraciones o con PostgreSQL para conservar los datos:

- Carga inicial mediante endpoint `/bootstrap`.
- Registro de negocio, inicio y cierre de sesion seguro para dueno/admin y vendedor.
- Dashboard con ventas, fiado, stock bajo y tickets.
- Inventario con SKU, variantes, unidades, packs, vencimiento, stock minimo, kardex y productos sin control de stock.
- Venta con descuento, notas, pagos divididos, ticket recuperable e idempotencia para evitar duplicados.
- Anulacion y devolucion parcial con restauracion consistente de stock, ventas netas y deuda.
- Comprobante imprimible posterior a la venta.
- Clientes con creacion, edicion, desactivacion, deuda fiada y abonos.
- Gestion protegida de usuarios internos y permisos por rol.
- Clientes con cupo, plazo, bloqueo de fiado, cuentas por cobrar, vencimientos y recordatorios por WhatsApp.
- Caja por turno con apertura, ingresos, gastos, retiros, efectivo esperado, contado y diferencia.
- Proveedores, ordenes de compra, recepcion de mercaderia y costo promedio ponderado.
- Alertas de reposicion y vencimiento, auditoria de operaciones e importacion/exportacion CSV.
- Cola local para ventas y ajustes de stock cuando se pierde la conexion.
- Reconocimiento visual real opcional mediante OpenAI, con historial, confianza, confirmacion y correccion.
- Lector de codigo de barras con ZXing: lectura desde foto en celular y camara en vivo cuando el navegador permite `getUserMedia`.
- Registro manual de pagos externos: tarjeta, transferencia/QR y Webpay; Localito no envía montos a terminales.
- Gastos operativos categorizados y conciliación de caja por turno.
- Reportes de ventas netas, margen bruto estimado, gastos y resultado estimado calculados desde API.
- Capa de persistencia preparada para PostgreSQL mediante `DATABASE_URL`.
- Acceso desde celular en red local usando la IP del computador de desarrollo.
- Catalogo demo amplio con cientos de productos de supermercado chileno para probar ventas, stock, busqueda, fiado y escaneo por codigo.

La API puede operar en dos modos. En modo `memory`, usa almacenamiento en memoria para demos rapidas y desarrollo sin base de datos local. En modo `postgres`, cuando existe `DATABASE_URL` y la base responde, inicializa tablas desde `db/schema.sql`, siembra datos demo si la base esta vacia y persiste las entidades operacionales. Los datos se aislan por negocio usando el usuario de la sesion; el cliente ya no envia ni decide el identificador del negocio.

El reconocimiento intenta primero leer el codigo de barras mediante ZXing. Si no lo encuentra y existe `GROQ_API_KEY` (o `OPENAI_API_KEY` como alternativa), el frontend reduce la imagen y el backend usa un modelo con vision para compararla contra el catalogo del negocio. Para la tesis se recomienda Groq con su cuota gratuita. Sin clave externa se conserva el flujo controlado por pista o codigo. En iPhone, la camara en vivo requiere HTTPS; por eso la prueba local prioriza el boton **Tomar foto**.

La lectura de codigos de barra se implementa en el frontend con la libreria `@zxing/browser`. Si el navegador permite camara en vivo en un contexto seguro, el sistema puede leer el codigo desde video. Si se prueba desde iPhone por HTTP local, se usa captura de foto porque iOS bloquea `getUserMedia` fuera de HTTPS. Si la foto no permite leer el codigo, la PWA mantiene entrada manual de codigo y pista como respaldo. Esto permite defender el flujo sin contratar servicios externos.

La autenticacion usa contrasenas derivadas con `scrypt`, tokens aleatorios de sesion almacenados como hash, expiracion, cierre de sesion, limitacion de intentos y autorizacion por rol en cada endpoint. El negocio se deriva de la sesion autenticada para impedir acceso cruzado entre tenants.

### 31.1 Permisos actuales por rol

| Accion | Dueno/admin | Vendedor |
| --- | --- | --- |
| Registrar ventas | Si | Si |
| Generar, imprimir y compartir comprobante | Si | Si |
| Venta Rápida multiproducto con cámara/IA | Si | Si |
| Ver inventario | Si | Si, solo lectura |
| Crear, editar o desactivar productos | Si | No |
| Ajustar stock manualmente | Si | No |
| Crear clientes para fiado | Si | Si |
| Editar o desactivar clientes | Si | No |
| Registrar abonos de fiado | Si | Si |
| Abrir, operar y cerrar caja | Si | Si |
| Ver reportes completos | Si | No |
| Anular ventas | Si | No |
| Editar perfil propio | Si | Si |
| Administrar usuarios internos | Si | No |

El vendedor cuenta con una experiencia operativa. Puede atender clientes, cerrar caja y actualizar sus datos personales, pero no accede a reportes completos ni a funciones administrativas que podrian alterar la informacion critica del negocio. El dueno/admin puede crear o desactivar vendedores cuando cambie el personal del local. Estas reglas se aplican en la interfaz y tambien en endpoints protegidos de la API.

El comprobante generado por Localito debe entenderse como un ticket interno o comprobante no tributario. Para emitir boletas legales en Chile se requiere integracion con SII o con un proveedor autorizado de boleta electronica.

Se agrega una matriz de pruebas funcionales en `docs/Matriz-Pruebas-Localito.md`, orientada a generar evidencia para memoria, presentacion y defensa.

## 32. Guia para ejecutar el proyecto en un PC personal

Esta guia permite mover la carpeta del proyecto a otro computador y levantar Localito con frontend, backend y base de datos.

### 32.1 Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- PostgreSQL 16 o superior, o Docker Desktop para levantar PostgreSQL con `docker compose`.
- Git opcional para versionar avances.

Verificacion:

```bash
node --version
npm --version
```

### 32.2 Instalacion inicial

Desde la raiz del proyecto:

```bash
npm install
```

No es necesario copiar `node_modules` entre computadores. Es mejor instalar dependencias nuevamente en el equipo donde se ejecutara el proyecto.

### 32.3 Variables de entorno

Copiar el archivo de ejemplo:

```bash
copy .env.example .env
```

Contenido esperado para desarrollo:

```env
NODE_ENV=development
API_PORT=3000
API_HOST=0.0.0.0
WEB_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://localito:localito@localhost:5432/localito
OWNER_DEMO_PASSWORD=Duoc2026
SELLER_DEMO_PASSWORD=Duoc2026V
SESSION_SECRET=change-this-in-production-with-a-long-random-value
VISION_PROVIDER=groq
GROQ_API_KEY=
GROQ_VISION_MODEL=qwen/qwen3.6-27b
# Alternativa opcional:
OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-5.6
```

El archivo `.env` no debe subirse al repositorio.

### 32.4 Base de datos PostgreSQL

Si se usa Docker Desktop:

```bash
npm run db:up
```

Esto levanta PostgreSQL usando `docker-compose.yml` con:

- Base de datos: `localito`
- Usuario: `localito`
- Password: `localito`
- Puerto: `5432`

Si se usa PostgreSQL instalado directamente en el PC, se debe crear la base `localito`, configurar un usuario con permisos y ajustar `DATABASE_URL`.

La API crea las tablas automaticamente desde `db/schema.sql` cuando logra conectarse a PostgreSQL.

### 32.5 Levantar backend

En una terminal:

```bash
npm run dev:api
```

En Windows tambien se puede usar:

```cmd
scripts\dev-api.cmd
```

Verificar:

```text
http://localhost:3000/health
```

Si la conexion a PostgreSQL funciona, el endpoint debe indicar:

```json
{
  "data": {
    "storage": "postgres"
  }
}
```

Si indica `"storage": "memory"`, el backend esta funcionando en modo demo, pero no esta persistiendo datos en PostgreSQL.

### 32.6 Levantar frontend PWA

En otra terminal:

```bash
npm run dev:web
```

En Windows tambien se puede usar:

```cmd
scripts\dev-web.cmd
```

Abrir la PWA en:

```text
http://localhost:5173
```

### 32.7 Credenciales demo

Para probar el acceso de usuarios del local:

| Rol | Correo | Clave |
| --- | --- | --- |
| Duena Donde Juanita | `juanita@localito.demo` | `Duoc2026` |
| Vendedor Donde Juanita | `juanita+vendedor@localito.demo` | `Duoc2026V` |
| Dueno Botilleria Don Pepe | `donpepe@localito.demo` | `Duoc2026` |
| Vendedor Botilleria Don Pepe | `donpepe+vendedor@localito.demo` | `Duoc2026V` |
| Duena Peluqueria La Esquina | `peluqueria@localito.demo` | `Duoc2026` |
| Vendedor Peluqueria La Esquina | `peluqueria+vendedor@localito.demo` | `Duoc2026V` |

El dueno/admin representa a la persona responsable del negocio, con acceso a gestion general. El vendedor representa al usuario operativo que registra ventas, revisa productos y atiende clientes. Los correos de vendedor usan `+vendedor` para mantener usuarios separados sin inventar dominios externos.

### 32.8 Probar desde un iPhone en la misma red Wi-Fi

Para usar Localito desde un iPhone durante desarrollo, el computador y el iPhone deben estar conectados a la misma red Wi-Fi. Luego se deben levantar backend y frontend normalmente:

```bash
npm run dev:api
npm run dev:web
```

En Windows se puede obtener la IP local del computador ejecutando:

```powershell
ipconfig
```

Luego, desde Safari en el iPhone, se debe abrir:

```text
http://IP-DEL-PC:5174
```

Ejemplo:

```text
http://192.168.4.85:5174
```

La PWA esta preparada para llamar automaticamente a la API usando la misma IP del computador. Para la prueba con iPhone se recomienda usar el puerto `5174` para la web y `3001` para la API, porque el script de acceso movil reenvia esos puertos hacia `5173` y `3000` dentro del PC.

Si la pagina carga pero no aparecen datos, se debe revisar que el firewall permita los puertos `5174` y `3001`, o ejecutar el script `scripts\enable-iphone-access.ps1` como administrador.

Para instalar Localito como PWA real desde el iPhone se requiere una URL con HTTPS. La prueba por red local permite validar navegacion y flujos, pero la instalacion completa tipo aplicacion requiere despliegue publico o tunel HTTPS.

### 32.9 Validacion del reconocimiento por camara e IA

La version actual puede reconocer el envase con un modelo de vision cuando el backend tiene `GROQ_API_KEY` o, alternativamente, `OPENAI_API_KEY`. Groq es el proveedor recomendado para la demostracion academica sin costo, sujeto a su cuota gratuita. Sin una clave externa, la lectura de codigo de barras y la pista manual permiten demostrar el flujo controlado.

Pruebas sugeridas:

- Entrar a la vista **Camara**.
- Crear o editar un producto con su codigo de barras real.
- En iPhone por red local, presionar **Tomar foto** y fotografiar el codigo completo, con buena luz y lo mas horizontal posible.
- Verificar que el campo de codigo se complete automaticamente si la lectura fue exitosa.
- Probar pistas como `coca`, `pan`, `shampoo`, `arroz` o `detergente`.
- Probar el codigo de barras demo `7801610001347`.
- Verificar que el sistema muestre producto, confianza, stock y precio.
- Verificar que si la confianza es baja, el sistema solicite confirmacion del usuario.

Nota para pruebas reales: el catalogo masivo usa nombres, formatos y precios de referencia de supermercado chileno, pero sus codigos de barra son demo salvo casos puntuales como Coca-Cola `7801610001347`. Para escanear un producto fisico de la casa, se debe crear o editar el producto y guardar el codigo real impreso bajo el codigo de barras.

Resultados esperados:

- Codigo de barras exacto: fuente `barcode`, confianza cercana a `0.98`.
- Pista textual: fuente `vision`, confianza cercana a `0.86`.
- Sin coincidencia clara: producto no reconocido, confianza menor y confirmacion/correccion requerida.

La imagen se reduce antes de enviarse, se procesa exclusivamente en el backend y se compara contra el inventario del negocio. La lectura de codigos de barra queda como primera opcion por ser mas rapida, barata y precisa cuando el producto tiene codigo impreso.

### 32.10 Ticket imprimible y boleta legal

Despues de confirmar una venta, la PWA permite imprimir un comprobante. Este documento incluye datos del local, numero de venta, fecha, usuario que atendio, productos, cantidades, medio de pago y total.

Este comprobante no reemplaza una boleta legal. Para emitir boleta electronica valida en Chile se debe integrar Localito con SII o con un proveedor autorizado. Para el MVP de tesis, el alcance corresponde a ticket interno imprimible.

### 32.11 Verificacion antes de presentar

Ejecutar:

```bash
npm run typecheck
npm run build
```

Ambos comandos deben terminar sin errores.

### 32.12 Despliegue en Vercel con HTTPS

El proyecto queda preparado para desplegar la PWA en Vercel. Se agrega `vercel.json` en la raiz y una funcion serverless catch-all en `api/[...path].ts`, que recibe las llamadas `/api/*` y las entrega al backend Express. En produccion, el frontend detecta HTTPS y usa `/api` como base de la API, por lo que no depende de `localhost`, IP local ni puertos de desarrollo.

Configuracion recomendada en Vercel:

```text
Framework Preset: Other
Install Command: npm install
Build Command: npm run build
Output Directory: apps/web/dist
```

Variables de entorno minimas:

```env
NODE_ENV=production
OWNER_DEMO_PASSWORD=Duoc2026
SELLER_DEMO_PASSWORD=Duoc2026V
SESSION_SECRET=reemplazar-por-un-secreto-largo
DATABASE_URL=postgresql://usuario:clave@host:5432/localito
VISION_PROVIDER=groq
GROQ_API_KEY=reemplazar-por-la-clave-del-proyecto
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

El modo memoria se admite únicamente en desarrollo local y pierde sus datos al reiniciar. En Vercel y cualquier entorno productivo, `DATABASE_URL` o `POSTGRES_URL` es obligatorio: la API falla de forma explícita si no dispone de almacenamiento persistente. La integración de Supabase debe usar una URL compatible con funciones serverless.

HTTPS es relevante para la PWA porque iOS y otros navegadores bloquean `getUserMedia` en origenes inseguros. Al estar en Vercel, el boton **Leer codigo** puede solicitar camara en vivo en dispositivos compatibles. El boton **Tomar foto** sigue funcionando como respaldo.

## 33. Conclusiones

Localito propone una solucion concreta para un problema cotidiano de pequenos negocios: la dificultad de controlar ventas, stock, fiados y pagos de manera ordenada. Su enfoque como PWA permite reducir barreras de instalacion, mientras que el modelo SaaS facilita escalar la plataforma a multiples negocios.

La incorporacion de IA visual convierte la camara del celular en una herramienta de trabajo, no solo en un accesorio. Esto diferencia al proyecto frente a sistemas tradicionales de punto de venta y permite plantear una tesis con valor practico y tecnologico. La IA propone y el vendedor confirma siempre producto y cantidad.

El MVP se desarrolló por incrementos: plataforma multi-tenant, catálogo, inventario, ventas, caja, fiado, compras, Venta Rápida, gastos, reportes, PWA y producción persistente. Los pagos externos permanecen manuales por decisión de alcance y costos. El backlog ejecutable, la reconstrucción de sprints y la guía de importación a Jira viven en `docs/Backlog-Scrum-Jira.md` y `docs/Jira-Import.csv`.

## 33. Evolución SaaS y rediseño profesional

La versión vigente agrega una suscripción individual por negocio. Todo local nuevo inicia una prueba Pro de 30 días y posteriormente puede operar con Localito Básico ($9.990/mes) o Localito Pro ($19.990/mes). El backend mantiene una matriz central de entitlements, por lo que ocultar un botón nunca es la única defensa: las operaciones no permitidas también reciben rechazo HTTP 403. Cuando una prueba o periodo vence, la información permanece guardada y consultable, pero las escrituras se pausan hasta la reactivación.

El administrador de plataforma puede observar locales activos, pruebas, MRR estimado y plan/estado de cada tenant, además de administrar credenciales y eliminar definitivamente usuarios o locales mediante confirmaciones reforzadas. El cobro recurrente automático queda como integración futura; la arquitectura ya conserva proveedor e identificadores externos sin exponer claves al frontend.

La navegación deja de presentar herramientas técnicas como módulos aislados. Venta Rápida se abre desde Vender; creación, importación y carga inicial viven dentro de Inventario; configuración, usuarios, plan, cuenta y exportación se abren desde el engranaje, sin una sección “Más” duplicada. El POS aplica el flujo `productos → ticket → Cobrar → medio → confirmación`: en pagos externos el vendedor debe verificar el terminal, QR o comprobante antes de que la venta y el stock se registren.

El cierre del rediseño agrega un Inicio centrado en ventas y atención diaria, edición segura de los datos del negocio desde Configuración, alta pública con prueba Pro de 30 días y contratación académica mediante Webpay/Mercado Pago sandbox o transferencia pendiente. El entorno sandbox no mueve dinero; una integración comercial real requerirá credenciales y contratos propios. La matriz de no regresión documenta la ubicación nueva de cada capacidad anterior.

La capa visual utiliza Source Sans 3, verde principal, sidebar azul premium en claro y grafito en oscuro, switch claro/oscuro persistido, controles táctiles y diseño responsive sin zoom inicial ni desborde horizontal.

## 34. Trazabilidad Scrum y Jira

La documentación de gestión se separa de este documento extenso para mantenerla operativa:

- `docs/Backlog-Scrum-Jira.md`: configuración de Jira, épicas, 63 historias, Story Points, prioridades, sprints, Definition of Ready, Definition of Done y roadmap.
- `docs/Jira-Import.csv`: épicas e historias vigentes para importación mediante CSV.
- `docs/Matriz-Pruebas-Localito.md`: casos funcionales y no funcionales que sirven como evidencia de aceptación.
- `docs/Operacion-Produccion.md`: monitoreo, respaldos, incidentes, costos y seguridad.

Cada historia Jira debe enlazar su requerimiento funcional, caso de prueba, commit y evidencia de Sprint Review. El estado `Terminado` exige cumplir la Definition of Done y no solamente disponer de código implementado.
