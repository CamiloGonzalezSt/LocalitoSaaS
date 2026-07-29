# Localito

Localito es una PWA SaaS para pequenos negocios de barrio. La primera base del proyecto incluye:

- Frontend React mobile-first con experiencia PWA.
- Backend Node.js con API REST inicial.
- Tipos compartidos para entidades del dominio.
- Esquema SQL conceptual para PostgreSQL.
- Documentacion del proyecto en `docs/Documento-Proyecto-Localito.md`.

## Guia rapida para correrlo en tu PC personal

Usa esta seccion cuando copies la carpeta del proyecto a otro computador.

### 1. Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- PostgreSQL 16 o superior, o Docker Desktop para levantar PostgreSQL con `docker compose`.
- Git opcional, pero recomendado para versionar el avance.

Verificar instalacion:

```bash
node --version
npm --version
```

### 2. Instalar dependencias

Desde la raiz del proyecto:

```bash
npm install
```

No es necesario copiar `node_modules` desde otro computador. Si existe y da problemas, se puede eliminar y volver a ejecutar `npm install`.

### 3. Configurar variables de entorno

Copiar el archivo de ejemplo:

```bash
copy .env.example .env
```

En PowerShell tambien sirve:

```powershell
Copy-Item .env.example .env
```

El valor por defecto para desarrollo es:

```env
NODE_ENV=development
DATABASE_URL=postgresql://localito:localito@localhost:5432/localito
API_PORT=3000
WEB_ORIGIN=http://localhost:5173
JWT_SECRET=change-me-in-development
OWNER_DEMO_PASSWORD=Duoc2026
SELLER_DEMO_PASSWORD=Duoc2026V
WEBPAY_ENV=integration
```

No subir el archivo `.env` al repositorio.

### 4. Levantar PostgreSQL

Opcion A, con Docker Desktop:

```bash
npm run db:up
```

Esto usa `docker-compose.yml` y crea un PostgreSQL con:

- Base de datos: `localito`
- Usuario: `localito`
- Password: `localito`
- Puerto: `5432`

Opcion B, con PostgreSQL instalado localmente:

1. Crear una base llamada `localito`.
2. Crear o usar un usuario con permisos sobre esa base.
3. Ajustar `DATABASE_URL` en `.env`.

La API crea las tablas automaticamente desde `db/schema.sql` cuando conecta a PostgreSQL.

### 5. Levantar el backend

En una terminal:

```bash
npm run dev:api
```

En Windows tambien se puede usar:

```cmd
scripts\dev-api.cmd
```

Verificar:

```bash
http://localhost:3000/health
```

Si todo esta bien con PostgreSQL, debe mostrar:

```json
{
  "data": {
    "storage": "postgres"
  }
}
```

Si muestra `"storage": "memory"`, la API esta funcionando, pero no logro conectarse a PostgreSQL. Revisar Docker/PostgreSQL y `DATABASE_URL`.

### 6. Levantar el frontend PWA

En otra terminal:

```bash
npm run dev:web
```

En Windows tambien se puede usar:

```cmd
scripts\dev-web.cmd
```

Abrir:

```text
http://localhost:5173
```

### 7. Verificacion final

Antes de presentar o seguir desarrollando:

```bash
npm run typecheck
npm run build
```

## Desarrollo tecnico

La API funciona en dos modos:

- `memory`: modo demo, sin persistencia entre reinicios.
- `postgres`: modo persistente cuando existe `DATABASE_URL` y PostgreSQL responde.

Ejecutar backend:

```bash
npm run dev:api
```

Ejecutar frontend:

```bash
npm run dev:web
```

En Windows tambien se pueden usar:

```cmd
scripts\dev-api.cmd
scripts\dev-web.cmd
```

Por defecto:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Bootstrap de datos: `http://localhost:3000/bootstrap`

## Acceso demo

La PWA muestra una pantalla de inicio de sesion para simular el acceso de los usuarios del local.

Credenciales disponibles:

| Rol | Correo | Clave |
| --- | --- | --- |
| Duena/admin | `caj.gonzalezs@duocuc.cl` | `Duoc2026` |
| Duena/admin | `sam.solis@duocuc.cl` | `Duoc2026` |
| Duena/admin | `al.patino@duocuc.cl` | `Duoc2026` |
| Vendedor | `caj.gonzalezs+vendedor@duocuc.cl` | `Duoc2026V` |
| Vendedor | `sam.solis+vendedor@duocuc.cl` | `Duoc2026V` |
| Vendedor | `al.patino+vendedor@duocuc.cl` | `Duoc2026V` |

En esta etapa la autenticacion es demo. Los correos de vendedor usan `+vendedor` para no chocar con las cuentas de dueno, porque el sistema usa el correo como identificador unico. La siguiente mejora tecnica es reemplazarla por JWT, contrasenas cifradas y permisos reales por rol.

### Permisos por rol

Localito diferencia lo que puede hacer cada usuario:

| Accion | Duena/admin | Vendedor |
| --- | --- | --- |
| Vender y generar ticket | Si | Si |
| Escanear productos | Si | Si |
| Ver stock | Si | Si, solo lectura |
| Crear, editar o desactivar productos | Si | No |
| Ajustar stock manualmente | Si | No |
| Crear clientes para fiado | Si | Si |
| Editar o desactivar clientes | Si | No |
| Registrar abonos | Si | Si |
| Cerrar caja | Si | Si |
| Ver reportes completos | Si | No |
| Anular ventas | Si | No |
| Editar perfil propio | Si | Si |
| Crear o desactivar usuarios | Si | No |

El vendedor ve el modulo **Caja** en lugar de reportes completos. Puede actualizar sus propios datos de perfil, pero no puede crear vendedores, desactivar usuarios ni cambiar permisos. Desde la API tambien se bloquean acciones administrativas para el rol vendedor.

## Ticket o comprobante

Despues de confirmar una venta, Localito muestra la opcion **Imprimir** para generar un comprobante de venta. El comprobante incluye:

- Nombre del local.
- Numero corto de venta.
- Fecha y hora.
- Usuario que atendio.
- Medio de pago.
- Cliente, cuando aplica.
- Productos, cantidades, precios y total.

Este documento se considera **comprobante no tributario**. Para emitir una boleta legal en Chile se requiere integracion con SII o un proveedor autorizado de boleta electronica.

## Cobro de fiado por Webpay

En **Fiado**, cada cliente con deuda muestra la accion **Cobrar**. Al presionarla, Localito genera un link Webpay demo y prepara un mensaje para el cliente con el monto y la URL de pago.

Desde celular, la app intenta abrir el menu nativo para compartir por WhatsApp, Mensajes, Mail u otra app. Si el navegador no permite compartir automaticamente, queda visible una tarjeta **Cobro listo** con opciones para **Compartir**, **WhatsApp**, **Copiar** y **Confirmar demo**.

En una integracion real, la confirmacion la realiza Transbank mediante retorno/callback del pago. En el MVP academico, **Confirmar demo** simula esa aprobacion y rebaja la deuda del cliente.

## Mejoras academicas implementadas para tesis

La version actual incorpora mejoras pensadas para presentar un flujo mas completo sin depender de servicios pagados:

- Login demo para duena/admin y vendedor.
- CRUD ampliado de productos: crear, editar, ajustar stock y desactivar.
- CRUD ampliado de clientes: crear, editar, desactivar, fiado y abonos.
- Gestion demo de usuarios internos desde Configuracion.
- Venta normal y venta fiada con descuento de stock.
- Anulacion de venta con restauracion de stock.
- Ticket interno imprimible y opcion de compartir.
- Cobro de fiado por Webpay demo con mensaje compartible, WhatsApp, copiar y confirmacion demo.
- Caja en vivo con efectivo, tarjeta, transferencia, Webpay demo, fiado, total y anuladas.
- Boton **Cerrar caja** para guardar un cierre formal del turno/dia con observacion.
- Dashboard con alertas, caja recibida, producto mas vendido y mayor deuda.
- Lector de codigo de barras con ZXing: lectura desde foto en celular y camara en vivo cuando el navegador permite `getUserMedia`.
- Reconocimiento IA demo con confianza, confirmacion, correccion e historial.
- Matriz de pruebas funcionales en `docs/Matriz-Pruebas-Localito.md`.

Flujo recomendado para demo:

1. Iniciar sesion como duena/admin.
2. Crear o editar un producto.
3. Realizar una venta normal.
4. Imprimir o compartir el comprobante.
5. Revisar descuento de stock.
6. Crear una venta fiada.
7. Ir a **Fiado**, presionar **Cobrar**, compartir/copiar el link Webpay demo y usar **Confirmar demo**.
8. Registrar un abono del cliente.
9. Probar Camara con **Tomar foto** sobre un codigo de barras real, codigo `7801610001347` o pista `pan`.
10. Confirmar o corregir reconocimiento IA.
11. Revisar caja en vivo, presionar **Cerrar caja** y anular una venta de prueba.

### Caja en vivo vs cierre de caja

Localito muestra dos conceptos:

- **Caja en vivo:** resumen automatico que se recalcula durante el dia segun las ventas y anulaciones.
- **Cierre de caja:** accion manual que realiza el usuario al final del turno o dia. Guarda una foto de los totales, quien cerro la caja, fecha/hora y una observacion opcional.

Para la demo de tesis, entrar a **Reportes**, revisar **Caja en vivo**, escribir una observacion y presionar **Cerrar caja**.

## Probar desde un iPhone en la misma red Wi-Fi

Para probar Localito desde un iPhone sin publicarlo todavia:

1. Conecta el PC y el iPhone a la misma red Wi-Fi.
2. Ejecuta la API y la web:

```bash
npm run dev:api
npm run dev:web
```

3. Busca la IPv4 del PC. En Windows se puede usar:

```powershell
ipconfig
```

4. Si Windows bloquea Node.js, ejecuta el script de acceso iPhone como administrador:

```powershell
.\scripts\enable-iphone-access.ps1
```

5. En Safari del iPhone abre:

```text
http://IP-DEL-PC:5174
```

Ejemplo:

```text
http://192.168.4.85:5174
```

La web detecta automaticamente ese host. En modo iPhone usa:

```text
http://IP-DEL-PC:3001
```

El puerto `5174` reenvia a la PWA local y el puerto `3001` reenvia a la API. Esto evita abrir Node.js completo en el firewall. Si cambia la red Wi-Fi, tambien puede cambiar la IP.

Para instalarla como PWA real en el iPhone se necesita una URL con HTTPS. La prueba por red local sirve para navegar y validar flujos, pero el modo instalable completo requiere despliegue publico o un tunel HTTPS.

## Validar el escaneo IA demo

En esta version, el modulo de IA visual es una simulacion controlada para demostrar el flujo de tesis. Todavia no reconoce el envase completo con un modelo de vision, pero la lectura de codigo de barras desde foto ya funciona con ZXing.

En iPhone, la camara en vivo con `getUserMedia` requiere HTTPS. Si estas probando por red local con `http://IP-DEL-PC:5174`, usa el boton **Tomar foto**: Safari abrira la camara, la app intentara leer el codigo desde esa foto y luego buscara el producto en el inventario. El boton **Leer codigo** queda para navegadores o despliegues con contexto seguro.

Formas de probarlo:

- Entra a **Camara**.
- Crea o edita un producto y guarda su codigo de barras real en el campo **Codigo de barras**.
- En iPhone por red local, presiona **Tomar foto** y enfoca el codigo con buena luz, completo y lo mas horizontal posible.
- Si la lectura resulta, el campo de codigo se llena automaticamente y la app busca el producto.
- Escribe una pista como `coca`, `pan`, `shampoo`, `arroz` o `detergente`.
- Tambien puedes probar codigos de barra demo como `7801610001347`.
- La app debe mostrar producto, confianza, stock y precio.
- Si la confianza es menor a `0.90`, el sistema debe pedir confirmacion del usuario.

Nota: el catalogo masivo usa nombres, formatos y precios de referencia de supermercado chileno, pero sus codigos de barra son demo salvo casos puntuales como Coca-Cola `7801610001347`. Para probar con un producto fisico de la casa, primero crea o edita el producto y guarda el codigo real que aparece bajo el codigo de barras.

Resultados esperados:

- Con codigo de barra exacto, la confianza debe ser alta y la fuente debe ser `barcode`.
- Con pista textual, la confianza debe ser media y la fuente debe ser `vision`.
- Si no hay coincidencia clara, se muestra **Producto no reconocido** y se pide correccion o ingreso manual.

Para convertirlo en IA visual real, el siguiente paso es enviar una imagen del producto al backend, procesarla con un modelo de vision, comparar el resultado contra el inventario y guardar el nivel de confianza. La lectura de codigo de barras queda como apoyo funcional para productos que si lo traen impreso.

## Despliegue en Vercel con HTTPS

El proyecto incluye `vercel.json` y una funcion serverless catch-all en `api/[...path].ts`. En Vercel la PWA queda publicada con HTTPS y el frontend llama a la API usando `/api` en el mismo dominio.

Pasos recomendados:

1. Subir el proyecto a GitHub.
2. En Vercel, crear un proyecto nuevo e importar el repositorio.
3. Dejar estos valores:

```text
Framework Preset: Other
Build Command: npm run build
Output Directory: apps/web/dist
Install Command: npm install
```

4. Agregar variables de entorno:

```env
NODE_ENV=production
OWNER_DEMO_PASSWORD=Duoc2026
SELLER_DEMO_PASSWORD=Duoc2026V
WEBPAY_ENV=integration
```

Para una demo rapida se puede omitir `DATABASE_URL`; la API usara memoria y cargara los datos demo al iniciar. Para datos persistentes reales, agregar una base PostgreSQL externa compatible con Vercel, por ejemplo Neon o Supabase, y configurar `DATABASE_URL`.

Con HTTPS, el boton **Leer codigo** puede pedir permiso de camara en dispositivos moviles compatibles. El boton **Tomar foto** sigue disponible como respaldo.

## Scripts principales

```bash
npm run dev:web
npm run dev:api
npm run build
npm run lint
npm run db:up
npm run db:down
```

## PostgreSQL

Para usar persistencia real:

1. Instalar Docker Desktop o tener PostgreSQL local.
2. Copiar `.env.example` a `.env`.
3. Levantar la base:

```bash
npm run db:up
```

4. Reiniciar la API:

```bash
npm run dev:api
```

Al iniciar, la API intenta conectarse a `DATABASE_URL`. Si la conexion funciona, crea las tablas desde `db/schema.sql`, siembra datos demo cuando la base esta vacia y `/health` mostrara:

```json
{
  "data": {
    "storage": "postgres"
  }
}
```

Si PostgreSQL no esta disponible, la API sigue funcionando en modo `memory`.

Para apagar la base Docker:

```bash
npm run db:down
```

Para ver logs de PostgreSQL:

```bash
npm run db:logs
```

## Estructura

```text
apps/
  api/        Backend Node.js con API REST.
  web/        Frontend React PWA.
db/
  schema.sql  Modelo relacional inicial para PostgreSQL.
docs/
  Documento-Proyecto-Localito.md
packages/
  shared/     Tipos compartidos del dominio.
```

## Estado actual

Esta iteracion deja un MVP inicial conectado:

- Dashboard operativo.
- Productos e inventario consumidos desde API.
- Creacion de productos y ajuste de stock.
- Venta con ticket registrada contra backend.
- Clientes, fiado y abonos contra backend.
- Escaneo IA demo mediante endpoint `/ai/recognize`.
- Webpay demo mediante endpoint `/payments/webpay/create`.
- Reportes base calculados desde API.
- API inicial con almacenamiento en memoria.
- Catalogo demo amplio con cientos de productos de supermercado chileno para probar busqueda, stock, venta, fiado y escaneo por codigo.

La API ya esta preparada para PostgreSQL. La siguiente iteracion recomendada es completar autenticacion real con JWT, roles y proteccion de rutas.

## Nota Windows

Si npm tiene problemas con certificados en esta maquina, usar:

```powershell
$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
$env:NODE_OPTIONS = '--use-system-ca'
npm install
```
