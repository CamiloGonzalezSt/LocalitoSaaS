# Guion de demostración de tesis — Localito

> Recorrido actualizado el 09-09-2026: apertura y conciliación en Caja → Turno; gastos/retiros en Movimientos; reposición, proveedores y facturas en Compras; auditoría/CSV en Historial. Verificar antes de la demostración los formularios y ambos temas: la nueva regresión visual completa está pendiente. [Diseño y verificación](Diseno-Interfaz.md).

Revisión: **08-09-2026**. Este guion usa una cuenta o negocio reservado para demostración. Nunca realizar pruebas que alteren stock, caja o deuda en el local de un usuario real. El [estado actual](Estado-Actual.md) identifica qué fue comprobado y qué sigue pendiente.

## Antes de comenzar

1. Ingresar con una cuenta demo de dueño, por ejemplo `donpepe@localito.demo`.
2. Verificar que el navegador esté en la versión publicada y que la sesión esté abierta.
3. Desde Inicio, abrir **Guion rápido para presentar Localito** si se requiere recordar el orden.
4. Verificar medios habilitados, datos bancarios de prueba y foto de al menos un producto. No mostrar contraseñas, tokens ni información bancaria real en las capturas.
5. Confirmar que no haya ventas pendientes de otra demostración. La API en memoria pierde datos al reiniciarse; para demostrar persistencia se necesita PostgreSQL.

## Recorrido sugerido (5 a 7 minutos)

1. **Inicio:** explicar ventas del día, prioridad contextual e indicadores del catálogo.
2. **Inventario:** mostrar las tareas separadas: revisar catálogo, crear producto, carga masiva e ingreso por factura.
3. **Vender:** buscar por categoría o producto frecuente, agregar productos y revisar el ticket.
4. **Venta Rápida:** explicar que la foto propone productos, pero el vendedor siempre revisa cantidades y confirma antes de agregar a la venta.
5. **Clientes:** crear o revisar un cliente, explicar límite de fiado y registrar un abono de demostración si corresponde.
6. **Caja:** abrir un turno, registrar un gasto o ingreso y revisar el historial del turno.
7. **Reportes:** seleccionar un mes, mostrar resultado, medios de pago, productos vendidos, cierres y acciones de anulación/devolución.

## Extensión operativa opcional

1. En Configuración, ordenar medios de cobro y mostrar los datos bancarios de prueba en Transferencia.
2. En Inventario, encuadrar una foto PNG con transparencia, guardar y comprobar su visualización. Explicar que Localito conserva el fondo transparente, no lo elimina automáticamente.
3. Cobrar en efectivo, introducir recibido y mostrar vuelto; un importe insuficiente no habilita confirmar. No simular un pago externo como si fuera dinero recibido realmente.
4. En Clientes, abrir Estado de cuenta y editar el recordatorio sin enviarlo.
5. En Caja, mostrar abonos de fiado en efectivo, contar y explicar por qué una diferencia exige motivo.
6. Buscar un cambio antiguo en Historial y desplegar Antes/Después. Los filtros consultan el servidor completo, no solo los últimos 100 registros.
7. Solo en el negocio de pruebas, cortar y recuperar red; mostrar venta pendiente, sincronización y registro único. Para un rechazo, mostrar revisión, respaldo y reintento sin crear otra venta ni repetir el cobro externo.

## Mensajes clave para la defensa

- Localito mantiene una sola fuente de verdad: el ticket confirma la venta y recién entonces se descuenta stock.
- La IA propone productos o extrae facturas; no fija precios ni modifica stock sin revisión humana.
- Los cobros externos se registran como confirmación manual de un terminal, QR o transferencia; las integraciones académicas no procesan dinero real.
- La aplicación separa cada negocio, maneja roles de dueño/vendedor y conserva trazabilidad operacional.

## Evidencia a capturar

- Inicio con prioridad y métricas.
- Inventario filtrado por categoría.
- Ticket móvil con total y botón Cobrar visibles.
- Resultado revisable de Venta Rápida.
- Formulario progresivo de producto.
- Historial de movimientos de caja.
- Reporte mensual y detalle de cierre.
- Foto de producto, configuración de cobro, estado de cuenta, historial antes/después y revisión offline en claro/oscuro.

La ejecución automática está descrita en [Estado actual](Estado-Actual.md). Las capturas de viewports móviles no sustituyen pruebas en un teléfono físico.

## Alcance académico

Los usuarios demo, pagos simulados y servicios de IA disponibles en el entorno se usan solo para fines de evaluación. La emisión tributaria, cobros reales y uso comercial requieren configuración y aprobaciones externas posteriores a la tesis.
