# Localito · Inteligencia de Negocios

## Estado
Este paquete deja preparado el diseño BI siguiendo la metodología Kimball trabajada en la asignatura:
preguntas de negocio, KPIs, Data Mart de Ventas, esquema en estrella, ETL/ELT, calidad de datos,
especificación Power BI y plan de pruebas.

## Importante
- Los scripts SQL son una propuesta preparada para PostgreSQL y **no fueron ejecutados contra producción**.
- No se entrega un archivo `.pbix` afirmado como funcional, porque primero debe cargarse y reconciliarse
  el Data Mart en un ambiente autorizado.
- No se inventaron valores de ventas, márgenes ni resultados de dashboard.
- El margen bruto histórico está bloqueado hasta disponer de costo unitario histórico por línea de venta.

## Secuencia de ejecución recomendada
1. Crear una base PostgreSQL de integración.
2. Cargar datos sintéticos o un respaldo autorizado.
3. Ejecutar `01_crear_datamart_localito.sql`.
4. Ejecutar `02_cargar_dimensiones.sql`.
5. Ejecutar `03_cargar_fact_ventas.sql`.
6. Ejecutar `05_pruebas_calidad_datos.sql` y reconciliar.
7. Ejecutar `04_vistas_kpi.sql`.
8. Conectar Power BI al esquema `bi`.
9. Construir el dashboard descrito en la documentación.
10. Repetir carga con datos nuevos para validar actualización incremental.

## Regla de defensa
Distinguir siempre entre:
- **diseñado / preparado**,
- **ejecutado y validado con evidencia**,
- **pendiente / roadmap**.
