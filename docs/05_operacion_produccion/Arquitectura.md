# Arquitectura de software — Localito

## Vista general

```text
Usuario
  │
  ▼
React + TypeScript PWA
  │ HTTPS / REST
  ▼
Node.js API
  ├── Reglas de negocio
  ├── Autenticación y autorización
  ├── Integraciones de IA
  └── Persistencia
        │
        ▼
PostgreSQL / Supabase

Despliegue web/API: Vercel
```

## Componentes
- Frontend PWA: experiencia de usuario, cache de aplicación e IndexedDB.
- API: validación, autorización, reglas de negocio e integraciones.
- PostgreSQL: persistencia multi-negocio.
- Supabase: servicio PostgreSQL administrado.
- Groq/OpenAI: proveedor opcional de visión desde backend.
- Vercel: despliegue serverless/web.

## Decisiones
- Las claves de proveedores externos nunca se exponen al frontend.
- Producción requiere persistencia PostgreSQL.
- Los pagos externos se registran con confirmación manual.
- La IA propone; el usuario confirma antes de afectar venta o stock.
