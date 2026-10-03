# Manual técnico — Localito

## Requisitos
- Node.js 20 o superior.
- npm 10 o compatible.
- PostgreSQL 16 o Docker Desktop.

## Instalación
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

Frontend por defecto: `http://localhost:5173`  
API por defecto: `http://localhost:3000`

## Base de datos
La API utiliza `db/schema.sql`. Para desarrollo local puede levantarse PostgreSQL con `docker-compose.yml`.

## Validación
```powershell
npm run check
```

## Despliegue
- Web/API: Vercel.
- Base de datos: Supabase PostgreSQL.
- Producción debe configurar `DATABASE_URL` con pooler de transacciones.
- Secretos e integraciones se configuran como variables de entorno.

## Variables relevantes
`DATABASE_URL`, `SESSION_SECRET`, credenciales de administrador, proveedor de correo y claves del proveedor de visión.

## Seguridad
Nunca publicar secretos, contraseñas reales o claves API en frontend ni repositorio.

Para incidentes, respaldo y detalles de producción consultar `Operacion-Produccion.md`.
