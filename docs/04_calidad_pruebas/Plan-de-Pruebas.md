# Plan de pruebas — Localito

## Objetivo
Verificar comportamiento funcional, integridad de datos, permisos, regresión de interfaz y build antes de declarar una capacidad terminada.

## Tipos de prueba
- Pruebas unitarias/lógicas en scripts de test.
- Pruebas de integración de flujos de negocio.
- Pruebas de validación y rechazo sin efectos secundarios.
- Pruebas de idempotencia.
- Pruebas de autenticación y autorización.
- Pruebas de inventario, ventas, caja y fiado.
- Pruebas de IA con validación de respuesta.
- Pruebas de regresión visual/documentada.
- Compilación y chequeo de tipos.

## Ejecución
```bash
npm run check
```

El comando reúne tipos, tests y build según la configuración vigente del repositorio.

## Evidencia
- `Matriz-Pruebas-Localito.md`
- `Matriz-Regresion-Rediseno.md`
- scripts de prueba en `/scripts`
- workflow `.github/workflows/ci.yml`

## Limitaciones
No se debe declarar validación de producción o dispositivo físico cuando la prueba fue ejecutada solo localmente. Los casos pendientes permanecen identificados como pendientes.
