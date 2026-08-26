# Matriz de regresión del rediseño Localito

Fecha de revisión: 2026-08-26
Alcance: rediseño Profesional, navegación por rol y modelo SaaS.

Esta matriz demuestra que el rediseño reorganiza capacidades existentes sin sustituir el POS ni duplicar lógica de negocio. La API y PostgreSQL siguen siendo la fuente de verdad para ventas, precios, stock, caja y fiado.

| Funcionalidad anterior | Nueva ubicación | Estado | Prueba realizada |
|---|---|---|---|
| Inicio / dashboard | **Inicio** | Rediseñada | Ventas de hoy, número de ventas, efectivo esperado, margen, ticket promedio y alertas renderizados en escritorio y móvil. |
| Vender / POS | **Vender** | Conservada y simplificada | Selección → ticket → Cobrar → medio de pago; venta demo y stock validados. |
| Venta Rápida | **Vender → Venta Rápida con foto** | Reubicada | La navegación la abre dentro del POS; resultado se agrega al ticket existente. |
| Código de barras | **Vender → Venta Rápida → código** | Conservada | Servicio y vista `QuickSaleView` continúan disponibles sin cambiar endpoints. |
| Carrito suspendido | **Vender → Guardar/Recuperar carrito** | Conservada | Persistencia por tenant en almacenamiento local y recuperación contra catálogo actual. |
| Efectivo | **Vender → Cobrar → Efectivo** | Conservada | Venta automatizada y resumen de caja aprobados. |
| Tarjeta externa | **Vender → Cobrar → Tarjeta** | Reforzada | Registrar permanece bloqueado hasta marcar confirmación explícita. |
| Transferencia / QR | **Vender → Cobrar → Transferencia/QR** | Reforzada | Misma confirmación humana obligatoria que tarjeta. |
| Webpay externo | **Vender → Cobrar → Webpay** | Conservada | No descuenta stock ni registra venta antes de la confirmación humana. |
| Fiado | **Vender → Cobrar → Fiado** y **Clientes → Fiado** | Reubicada | Cliente obligatorio, deuda preservada y endpoint sujeto a entitlement Pro. |
| Pago mixto | **Vender → Cobrar → Mixto** | Conservada | Partes de efectivo/tarjeta deben sumar el total y usan el POS existente. |
| Comprobante | **Vender → Comprobante listo** | Conservada | Área imprimible y compartir siguen conectados a la última venta. |
| Listado de productos | **Inventario** | Rediseñada | Búsqueda por nombre, marca, código y SKU; filtros por categoría y stock. |
| Nuevo producto | **Inventario → Agregar producto** | Reubicada | Formulario básico y opciones avanzadas usan los endpoints originales. |
| Ajuste de stock | **Inventario → tarjeta de producto** | Conservada | Controles de ajuste solo para owner activo; API mantiene kardex. |
| Carga inicial | **Inventario → Importar o carga inicial** | Reubicada | Importador masivo idempotente conserva formato y endpoint. |
| Importación CSV | **Inventario → Importar productos** | Conservada | Validación, vista previa, duplicados y reintento cubiertos por pruebas. |
| Factura con IA | **Inventario → Ingresar factura** | Reubicada | Mantiene análisis, revisión e ingreso mediante flujo de compras existente. |
| Clientes | **Clientes → Clientes** | Rediseñada | Alta rápida, edición owner y estados vacíos conservados. |
| Cuentas de fiado | **Clientes → Fiado** | Reubicada | Saldo, abonos y cobro externo permanecen conectados al cliente. |
| Pagos pendientes | **Clientes → Pendientes** | Nueva organización | Filtro de clientes con deuda, sin duplicar cuentas. |
| Caja en vivo | **Caja** | Reubicada | Efectivo esperado, movimientos, gastos y ventas se obtienen de la API actual. |
| Cierre de caja | **Caja** | Conservada | Apertura/cierre y diferencia mantienen repositorio y endpoints originales. |
| Reportes | **Reportes** | Rediseñada | Ventas, margen, gastos, resultado, productos y detalle conservados para owner/Pro. |
| Perfil propio | **Más → Mi cuenta** | Reubicada | Actualización de nombre/correo conserva sesión y rol. |
| Negocio | **Más → Mi negocio** | Reubicada y completada | Owner edita nombre, rubro, dirección y teléfono mediante `PATCH /tenant`. |
| Usuarios | **Más → Usuarios del local** | Reubicada | Crear/desactivar usuario conserva validación de rol y contraseña. |
| Apariencia | **Más → Configuración → Apariencia** | Ampliada | Claro predeterminado; Oscuro y Sistema persistidos por ID de usuario. |
| Exportación de datos | **Más → Plan y datos** | Reubicada | JSON incluye tenant, productos, clientes, ventas y cierres. |
| Recuperación de contraseña | **Inicio de sesión → Recuperar acceso** | Conservada | Token de un uso, expiración y revocación de sesiones cubiertos por pruebas. |
| Roles owner/seller | Navegación y API | Conservados | Owner ve 7 secciones; seller ve Vender, Inventario, Clientes y Caja. |
| System admin | Panel independiente **Locales y usuarios** | Rediseñado | No entra al POS; administra locales, usuarios, planes y estados. |
| Multi-tenant | Backend/PostgreSQL | Conservado | Operaciones derivan tenant desde sesión; pruebas verifican aislamiento. |
| PWA/offline | Shell y cola existente | Conservado | Cola mantiene idempotencia; IA informa que requiere conexión. |
| Prueba gratuita | **Mi plan** y banner | Nueva | Alta crea Pro `trialing` por 30 días sin tarjeta. |
| Basic/Pro | **Mi plan** | Nueva | Entitlements centralizados y validación API 403 por función. |
| Solicitud de plan | **Mi plan → Solicitar plan** | Nueva | Registra `pendingPlan`; no concede acceso ni corta una prueba activa. |
| Activación manual | **System admin → estado Activo** | Nueva | Aplica el plan solicitado, abre período de 30 días y limpia la solicitud. |
| Suscripción vencida | Toda la aplicación | Nueva | Datos visibles en modo lectura; mutaciones deshabilitadas en UI y rechazadas en API. |

## Criterios de salida

- TypeScript sin errores en `shared`, `api` y `web`.
- Pruebas automatizadas de dominio aprobadas.
- Build de producción aprobado.
- Validación visual en 320, 390, 768 y 1440 px sin desborde horizontal.
- Flujos owner, seller y system_admin comprobados.
- No se detectan emojis en la interfaz.
- Las carpetas ajenas al código no se incluyen en el commit.
