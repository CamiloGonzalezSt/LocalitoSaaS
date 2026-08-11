# Localito

Localito es una PWA SaaS multi-negocio para almacenes y comercios de barrio. Reúne punto de venta, inventario, caja, compras, proveedores, fiado y reconocimiento de productos desde el celular.

Esta versión implementa el núcleo operacional solicitado. El cumplimiento tributario chileno (SII, boleta y factura electrónica) queda intencionalmente fuera de esta iteración.

## Funcionalidades implementadas

- Administrador de plataforma separado del negocio: crea locales, crea su primer dueño, agrega vendedores y puede suspender o reactivar locales y usuarios.
- Creación de negocios y del primer usuario dueño exclusivamente desde la cuenta administradora de plataforma.
- Recuperación de contraseña por correo con enlace de un solo uso, vencimiento de 30 minutos y revocación de sesiones anteriores.
- Inicio y cierre de sesión con contraseñas `scrypt`, tokens aleatorios almacenados como hash, expiración y aislamiento por negocio.
- Roles `system_admin`, `owner` y `seller` protegidos tanto en la interfaz como en la API.
- Punto de venta con búsqueda, código de barras, descuento, notas, ticket recuperable y pagos simples o divididos.
- Idempotencia de ventas para evitar cobros duplicados al reintentar desde una red inestable.
- Navegación de inventario separada entre **Productos**, para crear y editar el catálogo, y **Stock**, para consultar existencias y movimientos.
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
PLATFORM_ADMIN_EMAIL=caj.gonzalez.st@gmail.com
PLATFORM_ADMIN_PASSWORD=change-this-before-production
SESSION_SECRET=change-this-in-production-with-a-long-random-value
APP_URL=http://localhost:5173
EMAIL_PROVIDER=gmail
GMAIL_USER=tu-correo@gmail.com
GMAIL_APP_PASSWORD=
EMAIL_FROM=Localito <tu-correo@gmail.com>
RESEND_API_KEY=
OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-5.6
```

`OPENAI_API_KEY` es opcional. La imagen se reduce en el navegador antes de enviarse y el backend compara la respuesta con el catálogo del negocio. La clave nunca debe exponerse en el frontend ni subirse al repositorio.

`SESSION_SECRET` firma las sesiones del modo demostración serverless. En Vercel, configure además `DATABASE_URL` (o `POSTGRES_URL` mediante la integración de Supabase) para que registros, ventas y cambios sobrevivan entre invocaciones. Use la URL del **Transaction pooler** de Supabase para funciones serverless.

`PLATFORM_ADMIN_PASSWORD` es obligatoria para crear inicialmente el administrador en producción. Una vez creada la cuenta, su clave se cambia mediante recuperación por correo; modificar esta variable no sobrescribe la contraseña existente. Nunca publique la clave en el frontend ni en el repositorio.

La recuperación de contraseña admite dos proveedores desde la API. Para el envío temporal con Gmail configure `EMAIL_PROVIDER=gmail`, `GMAIL_USER`, una `GMAIL_APP_PASSWORD` generada por Google, `EMAIL_FROM=Localito <el-mismo-correo@gmail.com>` y `APP_URL=https://localito-saas.vercel.app`. La cuenta de Google debe tener verificación en dos pasos; no use su contraseña normal. Como opción definitiva, configure `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` y un `EMAIL_FROM` perteneciente a un dominio verificado. Todas estas variables son privadas y nunca deben llevar el prefijo `VITE_`.

## Migración a Supabase

1. Abra **Connect** en el proyecto Supabase y copie la URI de **Transaction pooler**.
2. En Vercel, agregue esa URI como `DATABASE_URL` para Production, Preview y Development. Agregue también `PLATFORM_ADMIN_EMAIL`, `PLATFORM_ADMIN_PASSWORD` y un `SESSION_SECRET` largo.
3. Vuelva a desplegar. Al arrancar, la API verifica el esquema y crea el administrador configurado.

Las tablas tienen RLS activado y sin políticas públicas: Localito accede exclusivamente desde la API mediante PostgreSQL. Para migraciones manuales o herramientas de escritorio se puede usar la conexión directa; para Vercel debe mantenerse el pooler de transacciones.

## Acceso demo

| Rol | Correo | Clave |
| --- | --- | --- |
| Dueño Donde Juanita | `juanita@localito.demo` | `Duoc2026` |
| Vendedor Donde Juanita | `juanita+vendedor@localito.demo` | `Duoc2026V` |
| Dueño Botilleria Don Pepe | `donpepe@localito.demo` | `Duoc2026` |
| Vendedor Botilleria Don Pepe | `donpepe+vendedor@localito.demo` | `Duoc2026V` |
| Dueño Peluqueria La Esquina | `peluqueria@localito.demo` | `Duoc2026` |
| Vendedor Peluqueria La Esquina | `peluqueria+vendedor@localito.demo` | `Duoc2026V` |

Los negocios nuevos solo se crean desde la cuenta administradora. En la pantalla de acceso, cada usuario puede solicitar por correo el restablecimiento de su contraseña; la nueva clave debe tener al menos 10 caracteres, una letra y un número.

En desarrollo local, si no se define otra clave, el administrador usa `caj.gonzalez.st@gmail.com` / `AdminLocalito2026`. Ese valor de desarrollo se deshabilita automáticamente con `NODE_ENV=production`.

## Flujo sugerido de demostración

1. Iniciar sesión como administrador, crear un local y su usuario dueño.
2. Iniciar sesión como dueño y agregar un vendedor.
3. Entrar en **Productos** para crear o editar un artículo y en **Stock** para revisar sus existencias.
4. Abrir una caja con el monto inicial.
5. Registrar una venta con descuento o pago dividido.
6. Crear un cliente con cupo y realizar una venta fiada.
7. Revisar cuentas vencidas y abrir el recordatorio por WhatsApp.
8. Crear un proveedor y una orden; recibirla para actualizar stock y costo promedio.
9. Anular una venta o registrar una devolución parcial.
10. Importar/exportar catálogo y revisar movimientos de stock y auditoría.
11. Contar el efectivo y cerrar la caja para ver la diferencia.

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
- Avisos automáticos por correo distintos de la recuperación de contraseña.
- Múltiples sucursales, e-commerce público, fidelización y facturación de la suscripción SaaS; son expansiones de producto y no forman parte del núcleo operacional entregado aquí.

El ticket generado por Localito es un comprobante interno no tributario.
