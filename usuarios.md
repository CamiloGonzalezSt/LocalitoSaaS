# Usuarios demo

Este archivo resume las cuentas de prueba para interactuar con Localito en desarrollo local.

Revisión: **08-09-2026**. Solo contiene accesos de demostración. Nunca reutilizar sus claves en producción. El [estado actual](docs/Estado-Actual.md) resume permisos y pruebas.

## Administrador de plataforma

| Rol | Correo | Clave |
| --- | --- | --- |
| Admin plataforma | Valor privado de `PLATFORM_ADMIN_EMAIL` | No se publica; configurar o restablecer por el flujo autorizado. |

La cuenta admin puede variar si se configuran `PLATFORM_ADMIN_EMAIL` o `PLATFORM_ADMIN_PASSWORD` en el entorno.

Una contraseña administrativa estuvo expuesta en versiones anteriores de este documento. Debe rotarse y revisarse el acceso a la cuenta; retirarla aquí no la elimina del historial Git. Las variables de creación no sobrescriben automáticamente la clave de una cuenta existente.

## Locales demo

| Local | Rol | Correo | Clave |
| --- | --- | --- | --- |
| Botilleria Don Pepe | Dueno | `donpepe@localito.demo` | `Duoc2026` |

## Cuentas de QA y permisos

La regresión del cobro usa la cuenta de dueño demo documentada en el [README](README.md) e intercepta escrituras de ventas. Las suites integradas crean negocios y usuarios sintéticos con direcciones `@localito.test`; no son cuentas de uso operativo ni credenciales de producción. No se añaden contraseñas de QA a este documento.

El dueño configura medios de cobro y consulta auditoría si su plan lo permite. El vendedor no administra esas opciones. Cada cuenta conserva su propia cola local; no cambiar de cuenta ni limpiar el navegador como solución a una venta pendiente.

## Ramas de trabajo

| Persona | Rama sugerida |
| --- | --- |
| Camilo | `camiloG` |
| Samuel | `samuels` |

