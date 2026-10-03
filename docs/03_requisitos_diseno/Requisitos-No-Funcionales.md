# Requisitos no funcionales — Localito

## RNF-01 Seguridad
Contraseñas con hash seguro, sesiones con expiración, secretos solo en backend y control de roles.

## RNF-02 Aislamiento multi-negocio
Los datos de un negocio no deben ser visibles ni modificables por usuarios de otro negocio.

## RNF-03 Persistencia
En producción, la aplicación debe utilizar PostgreSQL persistente; no se permite fallback silencioso a memoria.

## RNF-04 Disponibilidad operativa
La aplicación debe informar fallas de servicios externos y evitar confirmar operaciones no persistidas.

## RNF-05 Rendimiento
Las operaciones comunes de POS, búsqueda e inventario deben responder de forma interactiva bajo condiciones normales de uso académico.

## RNF-06 Usabilidad
Interfaz responsive, mobile-first, controles táctiles y navegación coherente por rol.

## RNF-07 Accesibilidad visual
Contraste suficiente, jerarquía tipográfica consistente y estados visibles de foco/selección.

## RNF-08 Integridad transaccional
Ventas, stock, caja y fiado deben evitar estados parciales frente a validaciones o errores.

## RNF-09 Idempotencia
Una venta reintentada con la misma clave no debe duplicarse.

## RNF-10 Trazabilidad
Operaciones relevantes deben quedar asociadas a usuario, fecha y entidad mediante auditoría cuando corresponda.

## RNF-11 Privacidad
Imágenes enviadas a IA se reducen y procesan sin convertirse en repositorio permanente de imágenes del negocio.

## RNF-12 Compatibilidad
Objetivo de uso en navegadores modernos de escritorio y móvil, con PWA y HTTPS para funciones de cámara.
