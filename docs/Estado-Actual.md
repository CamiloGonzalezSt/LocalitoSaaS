# Estado actual de Localito

Última comprobación de código: **9 de septiembre de 2026**. Este índice reúne lo implementado, la evidencia disponible y las limitaciones. La revisión visual del nuevo diseño es parcial y se detalla en [Diseño de interfaz](Diseno-Interfaz.md). No equivale a una certificación de producción ni a validación con comerciantes reales.

## Qué está implementado

| Área | Comportamiento actual | Dónde encontrarlo |
| --- | --- | --- |
| Cobro | Tres medios principales configurables, extras en Más, efectivo recibido y vuelto, confirmación externa, pago mixto y fiado con cliente. | Vender → Cobrar |
| Configuración | Habilitar y ordenar medios, datos bancarios, plazo del proveedor y cobertura. Solo el dueño edita. | Configuración → Cobros y reposición |
| Fotos | Archivo o cámara, encuadre, escala, reemplazo y eliminación. Salida WebP de 512 × 512; conserva transparencia si el original la tiene. | Inventario → Crear/editar producto |
| Continuidad | Ticket, espera y favoritos por cuenta; catálogo guardado en IndexedDB y cola de ventas por negocio/usuario. | Vender e indicador de sincronización |
| Reintentos | Exclusión entre pestañas, clave idempotente y detalle por venta. Los rechazos de datos quedan pendientes de revisión; otras ventas pueden seguir. | Sincronización |
| Respaldo local | Descarga JSON de la cola de la cuenta activa, sin token de sesión. No borra ni importa operaciones automáticamente. | Sincronización → icono de descarga |
| Caja | Cuatro pestañas según permisos. Apertura, conciliación, contado/diferencia y turnos que cruzan medianoche. | Caja → Turno |
| Movimientos | Ingresos, retiros y gastos; historial y resumen por categoría limitados al turno abierto. | Caja → Movimientos |
| Reposición | Demanda de 30 días, mínimos, stock y unidades aún por recibir; cobertura editable y propuesta de compra revisable. | Caja → Compras → Reposición por ventas |
| Auditoría | Consulta completa paginada, búsqueda, acción y fechas. Antes/después de precio y stock, autor y motivo. | Caja → Historial → Historial de cambios |
| Fiado | Deudas, vencimientos, abonos, saldo y recordatorio editable antes de abrir WhatsApp. | Clientes → Estado de cuenta |
| Integridad | La API rechaza cantidades no positivas/no finitas, productos duplicados o inactivos, clientes ajenos, descuentos inválidos y pagos incompatibles. | API y repositorios |

Las funciones conservan los permisos de rol y plan. Ver una capacidad en esta lista no concede acceso a todos los usuarios. Los pagos externos siguen siendo registros manuales; las simulaciones académicas no procesan dinero.

## Contratos y persistencia

- `PATCH /tenant/preferences`: preferencias del negocio; campo `negocios.preferencias` JSONB creado por la migración idempotente de `db/schema.sql`.
- Fotos: `productos.imagen_url` TEXT almacena URL o imagen inline validada. No existe un servicio nuevo de almacenamiento de archivos ni eliminación automática de fondo.
- `GET /cash/reconciliation`: desglose del turno abierto o `null`.
- `GET /customers/:id/statement`: estado de cuenta aislado por negocio, sujeto a permisos.
- `GET /audit/history`: filtros `search`, `action`, `from`, `to`, `cursor`, `limit`. Fechas ISO UTC; `from` inclusivo, `to` exclusivo. La interfaz convierte los días locales a esos límites. Límite predeterminado 25, máximo 100 por página.
- La respuesta del historial es `{ data: { events, nextCursor? } }`. El cursor es el ID del último evento, resuelto dentro del mismo negocio y ordenado por fecha e ID; los empates no saltan registros. Cambiar filtros o actualizar comienza una consulta nueva.
- `GET /audit` conserva los últimos 100 eventos por compatibilidad; el historial nuevo no depende de ese recorte. El bootstrap mantiene un resumen, no todo el historial.
- Ventas: entre 1 y 500 líneas, un producto por línea y cantidades positivas finitas. Se admiten fracciones cuando el total queda en pesos enteros. Descuento y partes del pago deben ser pesos enteros, no negativos; cada parte debe ser positiva, sin repetir medios y sumar el total. Mixto requiere al menos dos medios.
- En memoria, reiniciar la API pierde los datos del servidor. PostgreSQL es obligatorio en producción. IndexedDB y localStorage son ayudas de continuidad, no sustitutos de la base ni de sus respaldos.

## Recuperación de ventas pendientes

1. Abrir Sincronización en la misma cuenta, navegador y origen donde se creó la venta. Cambiar dominio o puerto no traslada su almacenamiento local.
2. Revisar ID, cantidades, hora, intentos y error; descargar el respaldo antes de intervenir datos del navegador.
3. Los HTTP 400, 404, 409, 413 y 422 quedan marcados para revisión y no se reintentan automáticamente. Resolver stock, producto o datos y usar Reintentar esta venta, o Reintentar para la cola.
4. Errores de red, sesión/permisos, límite de solicitudes o servidor detienen ese ciclo. Recuperar conexión/acceso y reintentar sin volver a cobrar fuera de Localito.
5. Confirmar en ventas y stock que la operación fue registrada una vez. No crear otra venta para sustituir una dudosa sin revisar antes la original.

No se borran rechazos ni se editan los cuerpos de tickets desde este panel. Las colas antiguas sin cuenta identificada se conservan, pero no se envían automáticamente. Un almacenamiento corrupto se informa y se conserva para revisión; nunca se reemplaza silenciosamente por una cola vacía.

## Verificación realizada

| Comprobación | Evidencia y resultado |
| --- | --- |
| Lógica y diseño | 61 pruebas aprobadas el 09-09-2026: `localito.test.ts`, `improvements.test.ts`, `hardening.test.ts` y cinco comprobaciones CSS en `design.test.ts`. |
| Tipos | TypeScript de web, API y contratos compartidos aprobado. |
| Compilación | API/shared y build Vite de producción aprobados. |
| Mejoras integradas | `test-improvements.cjs`: siete áreas, permisos, recarga offline, separación de cuentas y concurrencia; 20 capturas. |
| Confiabilidad | `test-hardening.cjs`: rechazos HTTP sin mutaciones, valores reales antes/después, más de 100 eventos sin duplicados, respaldo sin token y reintento individual; 12 capturas. |
| Cobro | `test-checkout.cjs`: efectivo/vuelto, montos inválidos, errores/reintento, confirmación externa, mixto y fiado; 30 capturas. Todas las ventas de esta suite son interceptadas. |

Las tres suites de navegador y sus 62 capturas corresponden a la ejecución del **08-09-2026**, anterior al último rediseño. Sus recorridos de Caja fueron actualizados, pero la revisión completa posterior sigue pendiente. La inspección visual parcial y sus límites están en [Diseño de interfaz](Diseno-Interfaz.md). Las capturas históricas son de Chromium/Chrome con viewports móviles y ambos temas; no prueban un teléfono físico, Safari, una pasarela real ni la migración PostgreSQL. Las dos suites integradas crean negocios sintéticos en una API local en memoria; no usan datos de un negocio real.

### Reproducir

Desde la raíz, con Node.js y npm disponibles:

```powershell
npm ci
npm run check
```

`check` ejecuta tipos, pruebas y build. `.github/workflows/ci.yml` configura esa misma secuencia en pushes a `main` y pull requests. El resultado remoto debe consultarse en Actions; añadir el workflow no demuestra por sí solo una ejecución aprobada.

Para navegador, disponer de Playwright y Chrome. Instalar Playwright en una carpeta de herramientas separada o indicar un módulo ya disponible mediante `PLAYWRIGHT_MODULE`; no forma parte de las dependencias de producción. Iniciar una API **de pruebas** y la web conectada a ella. Valores de esta ejecución: API `43201`, web `43200`, `API_PORT=43201` y `VITE_API_BASE_URL=http://127.0.0.1:43201`.

```powershell
$env:LOCALITO_TEST_URL = 'http://127.0.0.1:43200'
$env:LOCALITO_TEST_API = 'http://127.0.0.1:43201'
node scripts/test-improvements.cjs
node scripts/test-hardening.cjs
node scripts/test-checkout.cjs
```

`LOCALITO_TEST_OUTPUT` cambia la carpeta de capturas y respaldos. Sin ella, cada suite usa su subcarpeta de `output`. No versionar respaldos con información real. En la sesión de desarrollo se invocaron `tsc`, `tsx` y Vite directamente con el runtime disponible, equivalentes a las etapas anteriores; no se ejecutó `npm ci` ni se verificó una instalación limpia aquí.

## Pendientes reales

- Completar la regresión visual del incremento del 09-09-2026, incluyendo teclado, conservación de formularios y todos los tamaños/temas. El acceso a la cuenta demo quedó pendiente de autorización durante esta continuación.
- Probar migración, consultas, concurrencia e idempotencia contra PostgreSQL en un ambiente separado; restaurar un respaldo antes de habilitar datos reales.
- Cierre de turno concurrente con varias cajas: la UI reconsulta el esperado, pero falta verificar su atomicidad frente a ventas simultáneas. El bloqueo por cola pendiente revisa solo la cuenta y origen actuales, no todos los dispositivos.
- Resolver comercialmente diferencias de precio entre una venta offline y el catálogo al sincronizar: actualmente el servidor usa el precio vigente, no una cotización congelada.
- Reposición: usa el historial disponible y excluye ventas parcialmente devueltas del cálculo de demanda. No es un pronóstico avanzado ni una garantía de abastecimiento.
- Migrar imágenes inline a almacenamiento de objetos si crece el catálogo. La transparencia requiere una imagen con fondo ya eliminado; no hay recorte automático con IA.
- Resolución asistida de tickets rechazados y migración de colas antiguas. El respaldo JSON es para diagnóstico, no un importador automático.
- Safari/iPhone y Android físicos, instalación PWA y métricas con usuarios representativos.
- Pagos reales, emisión tributaria, QR propio, suscripciones recurrentes y mensajes automáticos siguen fuera de esta entrega.
- Rotar cualquier credencial administrativa publicada anteriormente; retirarla del Markdown no la elimina del historial de Git.

## Mapa documental

- [Diseño de interfaz](Diseno-Interfaz.md): paleta, pestañas, catálogo, cobro y alcance de la verificación visual.
- [README](../README.md): instalación y visión general.
- [Mejoras](../MEJORAS.md): resumen de esta entrega.
- [Alcance de tesis](Alcance-Tesis.md): incluido, simulado y excluido.
- [Documento del proyecto](Documento-Proyecto-Localito.md): requisitos, arquitectura y evolución.
- [Backlog](Backlog-Scrum-Jira.md): historias, avances y trabajo pendiente.
- [Matriz funcional](Matriz-Pruebas-Localito.md) y [regresión visual](Matriz-Regresion-Rediseno.md): casos y evidencias.
- [Operación](Operacion-Produccion.md): despliegue, respaldo y recuperación.
- [Guion de demostración](Guion-Demostracion-Tesis.md): recorrido para la defensa.
- [Revisión tesis/mercado](Revision-Integral-Tesis-Mercado.md): evaluación histórica y actualización técnica.
- [Usuarios](../usuarios.md): cuentas exclusivamente demo y manejo de credenciales.

Los `artifact.md` de entregables y plantillas son contratos históricos de formato. Se enlazan a este estado, pero sus DOCX/PDF no se regeneraron ni se declararon verificados nuevamente.
