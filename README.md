# Localito

Localito es una PWA SaaS multi-negocio para almacenes y comercios de barrio. Reúne punto de venta, inventario, caja, compras, proveedores, fiado y reconocimiento de productos desde el celular.

Esta versión implementa el núcleo operacional solicitado. El cumplimiento tributario chileno (SII, boleta y factura electrónica) queda intencionalmente fuera de esta iteración.

## Funcionalidades implementadas

- Registro de un negocio y primer usuario dueño.
- Inicio y cierre de sesión con contraseñas `scrypt`, tokens aleatorios almacenados como hash, expiración y aislamiento por negocio.
- Roles `owner` y `seller` protegidos tanto en la interfaz como en la API.
- Punto de venta con búsqueda, código de barras, descuento, notas, ticket recuperable y pagos simples o divididos.
- Idempotencia de ventas para evitar cobros duplicados al reintentar desde una red inestable.
- Inventario con SKU, variante, unidad, packs, vencimiento, stock mínimo, productos sin control de stock y kardex de movimientos.
- Alertas de reposición y vencimiento a 30 días.
- Clientes con cupo, plazo, bloqueo de crédito, cuentas por cobrar, vencimientos, abonos y recordatorios por WhatsApp.
- Anulación de venta y devoluciones parciales con reposición de stock y ajuste de deuda.
- Proveedores, órdenes de compra, recepción de mercadería y actualización del costo promedio ponderado.
- Caja por turno: apertura, ingresos, gastos, retiros, cierre, efectivo esperado, contado y diferencia.
- Historial de auditoría para operaciones críticas.
- Importación y exportación de productos en CSV.
- Cola local para ventas y ajustes de stock cuando se pierde la conexión.
- PWA instalable con caché de aplicación y navegación sin conexión.
- Lectura de códigos con ZXing cargado bajo demanda.
- Reconocimiento real de envases mediante OpenAI cuando se configura una clave; sin clave conserva el flujo controlado por código o pista.
- Webpay simulado para la demostración académica y cobro compartible de deudas.

## Requisitos

- Node.js 20 o superior.
- npm 10 o pnpm.
- PostgreSQL 16 o Docker Desktop para persistencia. Sin base disponible, la API usa memoria.

## Puesta en marcha

```powershell
npm install
Copy-Item .env.example .env
npm run db:up
npm run dev:api
```

En otra terminal:

```powershell
npm run dev:web
```

Abrir `http://localhost:5173`. La API escucha por defecto en `http://localhost:3000` y su estado se consulta en `http://localhost:3000/health`.

La API ejecuta [db/schema.sql](db/schema.sql) al conectarse a PostgreSQL. Si PostgreSQL no responde, continúa en modo `memory`; ese modo no conserva información después de reiniciar el proceso.

## Variables de entorno

```env
NODE_ENV=development
API_PORT=3000
API_HOST=0.0.0.0
WEB_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://localito:localito@localhost:5432/localito
OWNER_DEMO_PASSWORD=Duoc2026
SELLER_DEMO_PASSWORD=Duoc2026V
OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-5.6
```

`OPENAI_API_KEY` es opcional. La imagen se reduce en el navegador antes de enviarse y el backend compara la respuesta con el catálogo del negocio. La clave nunca debe exponerse en el frontend ni subirse al repositorio.

## Acceso demo

| Rol | Correo | Clave |
| --- | --- | --- |
| Dueño | `caj.gonzalezs@duocuc.cl` | `Duoc2026` |
| Dueño | `sam.solis@duocuc.cl` | `Duoc2026` |
| Dueño | `al.patino@duocuc.cl` | `Duoc2026` |
| Vendedor | `caj.gonzalezs+vendedor@duocuc.cl` | `Duoc2026V` |
| Vendedor | `sam.solis+vendedor@duocuc.cl` | `Duoc2026V` |
| Vendedor | `al.patino+vendedor@duocuc.cl` | `Duoc2026V` |

También se puede crear un negocio nuevo desde la pantalla de acceso. La contraseña debe tener al menos 10 caracteres, una letra y un número.

## Flujo sugerido de demostración

1. Iniciar sesión como dueño o registrar un negocio.
2. Abrir una caja con el monto inicial.
3. Crear o editar un producto, incluyendo stock mínimo y vencimiento.
4. Registrar una venta con descuento o pago dividido.
5. Crear un cliente con cupo y realizar una venta fiada.
6. Revisar cuentas vencidas y abrir el recordatorio por WhatsApp.
7. Crear un proveedor y una orden; recibirla para actualizar stock y costo promedio.
8. Anular una venta o registrar una devolución parcial.
9. Importar/exportar catálogo y revisar movimientos de stock y auditoría.
10. Contar el efectivo y cerrar la caja para ver la diferencia.

## Cámara y reconocimiento

El sistema intenta primero leer el código de barras. Si no encuentra uno y existe `OPENAI_API_KEY`, envía una versión reducida de la foto al backend para identificar el artículo contra el catálogo. Siempre muestra confianza y permite confirmación o corrección manual.

La cámara en vivo requiere HTTPS en iPhone y en la mayoría de los navegadores móviles. En una red local HTTP se puede usar **Tomar foto**. Para probar un producto físico, guarde antes su código real en el catálogo.

## Webpay

El flujo actual crea links y permite confirmar el pago en modo demostración. Activar Transbank real requiere credenciales de comercio, una URL pública HTTPS de retorno y validar el `commit` en el backend; esas credenciales no forman parte del repositorio. Localito no almacena datos de tarjeta.

## Calidad y verificación

```powershell
npm run typecheck
npm run build
npm run test -w apps/api
```

Las pruebas automatizadas cubren hashes de contraseñas y sesiones, idempotencia de ventas, límites de crédito, caja, compras, costo promedio e inventario. La matriz manual vive en [docs/Matriz-Pruebas-Localito.md](docs/Matriz-Pruebas-Localito.md).

## Estructura

```text
apps/
  api/        API REST, reglas de negocio e integraciones
  web/        React PWA mobile-first
db/
  schema.sql  Esquema PostgreSQL multi-negocio
docs/
  Documento-Proyecto-Localito.md
  Matriz-Pruebas-Localito.md
packages/
  shared/     Tipos compartidos
```

## Alcance pendiente

- Cumplimiento tributario chileno, excluido por decisión de esta iteración.
- Activación de Transbank real, bloqueada hasta contar con credenciales y URL pública de retorno.
- Correo transaccional para recuperación de contraseña y avisos automáticos.
- Múltiples sucursales, e-commerce público, fidelización y facturación de la suscripción SaaS; son expansiones de producto y no forman parte del núcleo operacional entregado aquí.

El ticket generado por Localito es un comprobante interno no tributario.
