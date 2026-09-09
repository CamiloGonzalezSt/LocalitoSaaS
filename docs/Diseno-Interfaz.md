# Diseño de interfaz de Localito

Actualización: **09-09-2026**. Implementación local del incremento visual. Este documento distingue los cambios de código de la verificación realizada; no acredita un despliegue ni una certificación de accesibilidad.

## Paleta y tipografía

| Uso | Claro | Oscuro |
| --- | --- | --- |
| Fondo de aplicación | `#F4F6F5` | `#141615` |
| Superficie | `#FFFFFF` | `#1D211F` |
| Superficie secundaria | `#EEF2EF` | `#252A27` |
| Texto principal | `#18221D` | `#EDF2EF` |
| Texto secundario | `#5F6C64` | `#A9B5AE` |
| Acción principal | `#087F6B` | `#36C9A5` |
| Bordes | `#D9E1DB` | `#374139` |

`apps/web/src/themes.css` centraliza los tokens y conserva los alias utilizados por los componentes existentes. Verde para acciones/selecciones, ámbar para advertencias y rojo para errores; los precios se muestran con el color de texto principal. El logotipo original no cambia.

Se conserva Source Sans 3. Texto de lectura de peso normal, etiquetas y encabezados mayormente 600, importes destacados 700 como máximo. El tamaño de fuente no depende de `vw`; el espaciado entre letras es cero. Controles de 6 px de radio, tarjetas y diálogos de hasta 8 px; se conservan formas circulares en interruptores e indicadores.

## Organización de Caja

| Pestaña | Contenido |
| --- | --- |
| Turno | Apertura, monto inicial, conciliación y fiados vencidos para el dueño habilitado. |
| Movimientos | Registrar ingreso, retiro o gasto; historial y gastos agrupados del turno abierto. |
| Compras | Proveedor, propuesta revisable, orden manual, reposición, facturas desplegables, proveedores y vencimientos. |
| Historial | Auditoría paginada, filtros y exportación/importación CSV. |

Compras e Historial conservan la condición de permisos/plan de `canManage`; no se conceden capacidades nuevas al vendedor. Las pestañas implementan `tablist`, `tab`, `tabpanel`, selección, relación entre controles y navegación con flechas, Home y End. Los paneles inactivos permanecen montados, pero ocultos, para conservar formularios al cambiar de pestaña. No se añade persistencia de estos formularios al recargar o abandonar Caja.

Una propuesta recibida desde Inventario abre Compras. Una propuesta preparada en Reposición desplaza el foco a su revisión. Movimientos y órdenes tienen carga progresiva de los registros ya recibidos. El resumen de gastos corresponde al turno abierto, no a todos los turnos históricos.

## Catálogo, inventario y cobro

- Vender utiliza una cuadrícula adaptable: foto completa con `object-fit: contain`, nombre de hasta dos líneas con título completo, categoría, disponibilidad y precio destacado. El favorito es un botón independiente y no agrega productos al ticket.
- Búsqueda y acceso a Venta Rápida con cámara comparten una barra. Las fotos cargan de forma diferida; un error de imagen muestra un icono de producto.
- Inventario conserva las filas compactas, amplía la miniatura y mantiene cifras alineadas. No cambia el modelo de productos ni sus valores.
- El cobro conserva tres medios principales, extras en Más y los requisitos existentes de efectivo, pago mixto, fiado y confirmación externa. La selección añade un check y no depende solo del color.
- Total, efectivo recibido y vuelto tienen jerarquías diferenciadas. Un monto insuficiente muestra Faltan y el importe en rojo; las validaciones siguen bloqueando el cobro.
- Los avisos se muestran dentro del flujo de la página para no cubrir la barra móvil de cobro. Conservan cierre y roles de estado/alerta.

Las imágenes genéricas del catálogo demo pueden incluir fondo blanco dentro del archivo. No son tarjetas claras en modo oscuro ni fotografías específicas de cada SKU. Las fotos cargadas con transparencia la conservan; este incremento no elimina fondos ni obtiene fotos reales automáticamente.

## Verificación del incremento

- **61 pruebas aprobadas:** 56 de lógica previas y cinco nuevas en `scripts/design.test.ts`, incluidas en `npm test` y `npm run check`.
- Las pruebas nuevas usan el parser CSS de Vite y comprueban contraste de al menos 4,5:1 en los pares de tokens seleccionados, capas diferenciadas, texto/check de pago, tipografía y reglas de paneles/pestañas. No sustituyen una auditoría de toda la cascada CSS renderizada.
- TypeScript de web/API/shared y compilación API/shared/Vite aprobados.
- Sintaxis de `test-improvements.cjs`, `test-hardening.cjs` y `test-themes.cjs` aprobada; recorridos actualizados para las pestañas. Las suites completas de navegador no se volvieron a ejecutar en esta continuación.
- Revisión visual parcial durante el desarrollo: catálogo claro/oscuro a 1440 px; cobro oscuro a 320 px, importe insuficiente, check de selección y pagos adicionales. En el cobro móvil observado no hubo desbordamiento horizontal.
- Pendiente: comprobar el último ajuste de pestañas en 320/390/768/1440 px, completar los recorridos de Caja y conservación de formularios, y repetir todas las pantallas en ambos temas. La continuación de la sesión demo quedó detenida por autorización de acceso solicitada al usuario.

Las 62 capturas descritas en documentos anteriores pertenecen a la entrega del **08-09-2026**, no a una nueva ejecución del rediseño. Tampoco se verificaron dispositivos físicos, Safari, PostgreSQL ni pagos reales. No se declara esta revisión visual como terminada.

## Recorrido de regresión pendiente

1. En un negocio reservado a pruebas, abrir Caja y alternar las pestañas con ratón y teclado. Comprobar que solo un panel queda visible y que los controles de los paneles ocultos no reciben foco.
2. Completar parcialmente monto inicial, movimiento, proveedor, compra y conciliación; cambiar de pestaña y volver. Verificar conservación de valores y validación de cantidades/importes.
3. Preparar una propuesta desde Inventario y otra desde Reposición; revisar proveedor, cantidades, costo y foco antes de crear una orden ficticia.
4. Confirmar que el vendedor mantiene únicamente Turno y Movimientos. Comprobar cierre y gastos del turno en un negocio sintético, sin afectar datos reales.
5. Repetir catálogo, inventario, efectivo, mixto, fiado, pagos externos, avisos y diálogos en ambos temas y a 320, 390, 768 y 1440 px. Revisar texto, carga de imágenes, selección y ausencia de superposiciones.

Estado funcional y límites de producción: [Estado actual](Estado-Actual.md).
