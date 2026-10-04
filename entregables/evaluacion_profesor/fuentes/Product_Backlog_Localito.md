# Product Backlog de Localito

# Resumen ejecutivo

El Product Backlog de Localito representa capacidades y trabajo de calidad necesarios para la PWA SaaS. La fuente del repositorio mantiene historias HU01 a HU33, elementos técnicos y actividades de entrega. Los elementos futuros se ordenan por valor, riesgo y dependencia; no se comprometen a los Sprints 5 a 8 antes del Planning.

Esta versión conserva los estados y responsables documentados y desarrolla historias con criterios observables. Esos criterios son un refinamiento documental propuesto para revisión del equipo. No se inventan estimaciones aprobadas, actas de aceptación o nuevas fechas reales de término.

# Introducción y criterio de elaboración

La Guía Scrum caracteriza el Product Backlog como trabajo ordenado y emergente del producto [R6]. Localito utiliza identificadores estables para relacionar capacidades con Sprints y pruebas. La historia se formula desde el usuario y el resultado, evitando que una tecnología sea el objetivo por sí sola.

La prioridad responde a dependencias concretas: identidad precede a permisos, catálogo precede a venta, y venta y movimientos preceden a conciliación. La calidad transversal también se incorpora porque una funcionalidad que mezcla negocios o pierde datos no aporta un incremento utilizable. Los identificadores de pruebas propuestos se relacionan por tema con el Plan de Pruebas y no se marcan ejecutados.

# Product Goal y política de refinamiento

El objetivo es entregar una PWA SaaS para gestionar ventas, inventario, clientes, caja, compras y reportes desde una interfaz simple y segura. El refinamiento debe comprobar actor, valor, dependencias y aceptación. Se puede dividir una historia amplia cuando una parte no permite una demostración independiente o mezcla reglas difíciles de validar.

No se asignan puntos históricos sin registro. Las fechas de la fuente pertenecen al seguimiento descrito en Trello. La aparición de funciones de cliente, compras o IA en el código se registra como evidencia técnica; si sus tarjetas siguen en Product Backlog, el documento conserva esa diferencia.

# Historias de usuario y criterios desarrollados

Las condiciones siguientes son un refinamiento documental para validar con el equipo. Cada verificación conserva datos iniciales, acción y resultado, incluyendo rechazos y recursos ajenos. La elaboración de criterios no acredita una nueva ejecución ni modifica el estado histórico de la historia.

## HU01 Autenticarse en Localito

Como usuario, quiero autenticarse en localito para acceder a las operaciones de mi negocio.

Estado al corte: Hecho según el registro documental del Sprint 1. Responsable documental: Camilo. 

- Credenciales válidas devuelven una sesión y contexto del usuario.
- credenciales incorrectas se rechazan sin revelar el hash.
- una sesión ausente no accede a endpoints protegidos.

Evidencia técnica a revisar: auth.ts y server.ts. 

## HU02 Gestionar roles y permisos

Como dueño, quiero gestionar roles y permisos para delimitar las acciones de mis vendedores.

Estado al corte: Hecho según el registro documental del Sprint 1. Responsable documental: Camilo. 

- Un vendedor no obtiene permisos administrativos por alterar el cliente.
- un owner autorizado accede a gestión.
- los endpoints rechazan un rol insuficiente con estado comprensible.

Evidencia técnica a revisar: requireRoles en server.ts. 

## HU03 Aislar datos por negocio

Como dueño, quiero aislar datos por negocio para mantener separados mis registros.

Estado al corte: Hecho según el registro documental del Sprint 1. Responsable documental: Camilo. 

- El negocio se deriva de la sesión.
- un producto ajeno no puede venderse ni modificarse.
- las consultas devuelven únicamente registros permitidos.

Evidencia técnica a revisar: tenantIdFromRequest y repository.ts. 

## HU04 Gestionar negocio y local

Como dueño, quiero gestionar negocio y local para mantener información operativa vigente.

Estado al corte: Hecho según el registro documental del Sprint 2. Responsable documental: Camilo. 

- Se guardan datos del negocio autenticado.
- campos y preferencias inválidos se rechazan.
- la edición no permite modificar otro negocio.

Evidencia técnica a revisar: /tenant y businessPreferences.ts. 

## HU05 Administrar usuarios

Como dueño, quiero administrar usuarios para controlar cuentas del equipo.

Estado al corte: Hecho según el registro documental del Sprint 2. Responsable documental: Camilo. 

- El usuario nuevo se vincula al negocio.
- se valida rol y contraseña.
- la desactivación limita acceso según la gestión de sesión existente.

Evidencia técnica a revisar: /users y repositorio. 

## HU06 Gestionar categorías de productos

Como dueño, quiero gestionar categorías de productos para organizar el catálogo.

Estado al corte: Hecho según el registro documental del Sprint 2. Responsable documental: Camilo. 

- Las categorías corresponden al negocio.
- un producto conserva relación válida.
- la consulta no mezcla categorías ajenas.

Evidencia técnica a revisar: categorias en schema.sql. 

## HU07 Gestionar catálogo de productos

Como dueño, quiero gestionar catálogo de productos para vender productos con información vigente.

Estado al corte: Hecho según el registro documental del Sprint 2. Responsable documental: Camilo. 

- Precio y datos obligatorios se validan.
- la edición queda visible en catálogo.
- un producto desactivado no se vende como activo.

Evidencia técnica a revisar: /products y productos. 

## HU08 Registrar stock inicial

Como dueño, quiero registrar stock inicial para comenzar con existencias controladas.

Estado al corte: Hecho según el registro documental del Sprint 2. Responsable documental: Camilo. 

- Se valida cantidad.
- el ajuste se asocia al producto autorizado.
- se puede comprobar el stock antes y después.

Evidencia técnica a revisar: /products/:id/stock. 

## HU09 Registrar movimientos de stock

Como dueño, quiero registrar movimientos de stock para explicar cambios de existencias.

Estado al corte: Hecho según el registro documental del Sprint 3. Responsable documental: Camilo. 

- Una operación genera movimiento correspondiente.
- el registro conserva cantidad y stock resultante.
- se mantiene negocio y autor cuando aplica.

Evidencia técnica a revisar: movimientos_stock. 

## HU10 Consultar Kardex y trazabilidad

Como dueño, quiero consultar kardex y trazabilidad para revisar el historial de un producto.

Estado al corte: Hecho según el registro documental del Sprint 3. Responsable documental: Camilo. 

- El historial corresponde al producto permitido.
- se muestran tipo y cantidad.
- los límites de consulta se distinguen de historial completo.

Evidencia técnica a revisar: getStockMovements. 

## HU11 Recibir alertas de stock bajo

Como dueño, quiero recibir alertas de stock bajo para identificar reposición necesaria.

Estado al corte: Hecho según el registro documental del Sprint 3. Responsable documental: Camilo. 

- El criterio usa stock mínimo configurado.
- el producto pertenece al negocio.
- se distingue una alerta de una orden de compra confirmada.

Evidencia técnica a revisar: bootstrap y alertas. 

## HU12 Utilizar código de barras

Como vendedor, quiero utilizar código de barras para localizar un producto con menos búsqueda.

Estado al corte: Hecho según el registro documental del Sprint 3. Responsable documental: Camilo. 

- Un código presente identifica un producto permitido.
- un código desconocido informa que no existe.
- se ofrece ingreso o búsqueda manual.

Evidencia técnica a revisar: ZXing y cliente de catálogo. 

## HU13 Operar offline y sincronizar cambios

Como vendedor, quiero operar offline y sincronizar cambios para conservar ventas ante un corte de red.

Estado al corte: En progreso en Sprint 4. Responsable documental: Camilo. 

- La cola guarda venta e idempotencyKey por cuenta.
- la reconexión conserva rechazos sin duplicar.
- un cambio de cuenta no envía pendientes de otra sesión.

Evidencia técnica a revisar: offline.ts y workspaceCache.ts. 

## HU14 Registrar una venta en el POS

Como vendedor, quiero registrar una venta en el pos para atender y registrar el ticket.

Estado al corte: Hecho según el registro documental del Sprint 4. Responsable documental: Camilo. 

- Servidor usa precio vigente.
- la venta aceptada conserva detalles y efecto de stock.
- un error de validación no deja una operación parcial.

Evidencia técnica a revisar: POST /sales y createSaleWithClient. 

## HU15 Aplicar descuentos en una venta

Como vendedor, quiero aplicar descuentos en una venta para ajustar el cobro de forma controlada.

Estado al corte: Hecho según el registro documental del Sprint 4. Responsable documental: Alexander. 

- El descuento válido modifica el total.
- valores fuera de la regla se rechazan.
- pagos y total final permanecen consistentes.

Evidencia técnica a revisar: saleValidation.ts. 

## HU16 Gestionar medios y pagos divididos

Como vendedor, quiero gestionar medios y pagos divididos para registrar cómo se cubrió el total.

Estado al corte: Por hacer en Sprint 4. Responsable documental: Camilo. 

- La suma de porciones coincide con total.
- se conserva cada método.
- los pagos externos y las simulaciones se identifican correctamente.

Evidencia técnica a revisar: settleSale y detalle_pagos. 

## HU17 Abrir caja por turno

Como vendedor, quiero abrir caja por turno para iniciar control de efectivo.

Estado al corte: Por hacer en Sprint 4. Responsable documental: Camilo. 

- Se registra monto inicial y usuario.
- no hay dos sesiones abiertas del mismo negocio.
- la interfaz informa rechazo sin duplicar apertura.

Evidencia técnica a revisar: sesiones_caja e índice parcial. 

## HU18 Cerrar y cuadrar caja

Como vendedor, quiero cerrar y cuadrar caja para comparar efectivo esperado y contado.

Estado al corte: Por hacer en Sprint 4. Responsable documental: Camilo. 

- Se conserva esperado y contado.
- una diferencia exige motivo.
- se revisan pendientes de todas las cuentas del turno antes de conciliar.

Evidencia técnica a revisar: closeCashSession y UI de caja. 

## HU19 Registrar clientes

Como vendedor, quiero registrar clientes para asociar operaciones y deuda.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- Datos obligatorios se validan.
- el cliente pertenece al negocio.
- la consulta y edición respetan permisos.

Evidencia técnica a revisar: clientes y endpoints. 

## HU20 Registrar ventas fiadas

Como vendedor, quiero registrar ventas fiadas para conservar deuda del cliente.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- Fiado necesita cliente activo.
- se revisa bloqueo y límite configurado.
- venta y saldo se conservan en la operación correspondiente.

Evidencia técnica a revisar: cuentas_fiado y createSaleWithClient. 

## HU21 Registrar abonos y pagos de deuda

Como vendedor, quiero registrar abonos y pagos de deuda para actualizar el saldo de un cliente.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- Monto y método se validan.
- se conserva el pago y saldo resultante.
- rechazos no producen un abono parcial.

Evidencia técnica a revisar: abonos_fiado y pagos. 

## HU22 Consultar saldo y estado de cuenta

Como dueño, quiero consultar saldo y estado de cuenta para seguir la deuda vigente.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- El saldo relaciona cuentas y cliente.
- la consulta respeta negocio.
- fecha de vencimiento y estado se interpretan sin alterar deuda.

Evidencia técnica a revisar: getDebts. 

## HU23 Gestionar devoluciones y anulaciones

Como dueño, quiero gestionar devoluciones y anulaciones para corregir ventas con trazabilidad.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- No se devuelve más de lo vendido.
- la reposición considera unidades descontadas.
- un reintento exige consultar estado cuando la respuesta es ambigua.

Evidencia técnica a revisar: devoluciones_venta y repositorio. 

## HU24 Auditar movimientos sensibles

Como dueño, quiero auditar movimientos sensibles para revisar acciones relevantes.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- Se relaciona acción con usuario y negocio.
- se conservan detalle y fecha.
- filtros y paginación se distinguen de una lista limitada.

Evidencia técnica a revisar: auditQuery.ts y auditoria. 

## HU25 Gestionar proveedores

Como dueño, quiero gestionar proveedores para preparar compras con datos conocidos.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- Proveedor pertenece al negocio.
- se guardan contacto y estado.
- ediciones ajenas se rechazan.

Evidencia técnica a revisar: proveedores y /suppliers. 

## HU26 Crear órdenes de compra

Como dueño, quiero crear órdenes de compra para planificar ingreso de mercadería.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- Se vinculan proveedor y productos válidos.
- cantidades y costos se validan.
- la orden conserva detalle y estado.

Evidencia técnica a revisar: ordenes_compra y detalle_ordenes_compra. 

## HU27 Recepcionar mercadería

Como dueño, quiero recepcionar mercadería para registrar lo recibido.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- Se revisan cantidades pendientes.
- recepción parcial conserva estado.
- no se supera sin control lo pedido.

Evidencia técnica a revisar: recepción en repository.ts. 

## HU28 Actualizar inventario desde recepción

Como dueño, quiero actualizar inventario desde recepción para hacer disponible la mercadería recibida.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- El ingreso corresponde al producto.
- cantidad recibida y stock son consistentes.
- el costo se actualiza según regla implementada.

Evidencia técnica a revisar: recepción y movimientos_stock. 

## HU29 Importar datos mediante CSV

Como dueño, quiero importar datos mediante csv para cargar un catálogo de forma controlada.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- Se validan columnas y filas.
- se muestra rechazo comprensible.
- los cambios quedan asociados al negocio y no se aceptan datos arbitrarios.

Evidencia técnica a revisar: productImport.ts y endpoints. 

## HU30 Visualizar dashboard general

Como dueño, quiero visualizar dashboard general para comprender la operación reciente.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- Métricas provienen de datos del negocio.
- rangos y unidades quedan visibles.
- no se equipara fiado con efectivo recibido.

Evidencia técnica a revisar: DashboardView y bootstrap. 

## HU31 Consultar reportes de ventas

Como dueño, quiero consultar reportes de ventas para analizar transacciones y estados.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- El periodo se aplica correctamente.
- anulaciones se distinguen de ventas activas.
- la exportación conserva campos relevantes.

Evidencia técnica a revisar: reportes y getSales. 

## HU32 Consultar reportes de inventario

Como dueño, quiero consultar reportes de inventario para identificar stock y necesidades.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- Producto y existencias son del negocio.
- se muestran mínimos y estados.
- exportación y filtros conservan el conjunto esperado.

Evidencia técnica a revisar: inventario y reportes. 

## HU33 Utilizar apoyo de IA visual

Como vendedor o dueño, quiero utilizar apoyo de ia visual para preparar información con una fotografía.

Estado al corte: Product Backlog sin Sprint futuro comprometido. Responsable documental: Alexander. 

- La propuesta queda editable.
- se valida contra catálogo permitido.
- no se persiste venta o recepción hasta confirmación humana.

Evidencia técnica a revisar: vision.ts e invoiceImport.ts. 

# Elementos técnicos y trabajo de entrega

ET03 mejora responsive; ET04 fortalece seguridad; ET05 prepara release candidate; ET06 verifica integralmente; ET07 corresponde a UAT; DOC01 prepara documentación; REL01 despliega la entrega. Se conservan como trabajo del backlog. El despliegue final necesita revisión de base y pruebas y no se considera aprobado por existir un enlace público.

# Conclusiones

El backlog desarrollado aporta historias legibles y resultados observables, conservando el estado documental vigente. Su siguiente revisión debe validar criterios y prioridades con el equipo y vincular casos reales. Las estimaciones y compromisos futuros se incorporarán únicamente cuando exista decisión de Planning.

# Referencias y evidencia de la versión

Las referencias externas fundamentan conceptos y organización. La descripción específica de Localito procede del repositorio. Se consultaron fuentes públicas el 03 de octubre de 2026. Las fichas públicas ISO se utilizan para alcance y orientación, sin atribuir acceso al texto normativo completo ni conformidad certificada.

[R6] Schwaber K y Sutherland J 2020. The Scrum Guide. https://scrumguides.org/scrum-guide.html

[P] Equipo Localito. Repositorio LocalitoSaaS. Commit base 05a6f34b749cdc97dd560d91bb9be057a1197fbf. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/05a6f34b749cdc97dd560d91bb9be057a1197fbf

Fuentes internas revisadas: README.md; package.json y manifests de apps; apps/api/src/server.ts, repository.ts y auth.ts; db/schema.sql; apps/web/src/lib/offline.ts y workspaceCache.ts; docs de requisitos, calidad, operación y Scrum. La revisión es documental y estática. No crea resultados de pruebas funcionales, reuniones ni aceptación de usuario.
