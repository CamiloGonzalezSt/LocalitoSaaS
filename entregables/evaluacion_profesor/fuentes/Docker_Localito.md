# Docker y entorno local de Localito

# Resumen ejecutivo

Docker Compose se utiliza en Localito para levantar PostgreSQL 16 en desarrollo. El archivo vigente define un servicio postgres, un volumen nombrado y publicación del puerto 5432. Frontend y API se ejecutan con npm fuera del contenedor. Esta entrega no atribuye un Dockerfile completo ni una imagen de aplicación inexistente.

El documento explica configuración, puesta en marcha, persistencia, diagnóstico, respaldo y diferencias con producción. Los procedimientos de intervención se plantean para entornos de prueba. La ejecución de estos comandos no fue necesaria para esta revisión documental y no se declara una base Docker nueva validada.

# Introducción y alcance

Compose describe servicios, redes y volúmenes de una aplicación (Docker, s. f.a). Localito utiliza una parte de ese modelo para reproducir la base local sin exigir una instalación manual de PostgreSQL. El valor reside en una versión declarada y comandos consistentes entre computadores del equipo.

El volumen local no es por sí solo un respaldo. Detener un contenedor tampoco elimina necesariamente sus datos. La revisión del archivo distingue datos durables en un volumen, copia de seguridad y restauración probada. Las credenciales de desarrollo del manifiesto no son una recomendación para producción.

# Configuración real del repositorio

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: localito-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: localito
      POSTGRES_USER: localito
      POSTGRES_PASSWORD: localito
    ports:
      - "5432:5432"
    volumes:
      - localito_pg_data:/var/lib/postgresql/data

volumes:
  localito_pg_data:

```

| Elemento | Valor declarado | Implicación |
| --- | --- | --- |
| Imagen | postgres:16-alpine | Versión mayor fijada para desarrollo |
| Contenedor | localito-postgres | Nombre usado para inspección local |
| Base y usuario | localito | Convención del ambiente de prueba |
| Puerto | 5432 del host hacia 5432 | Puede entrar en conflicto con otra instalación |
| Volumen | localito_pg_data | Conserva datos al recrear el servicio |
| Reinicio | unless-stopped | Política del contenedor local |

# Requisitos y puesta en marcha

Se necesita Docker Engine o Docker Desktop con Compose disponible. El usuario debe comprobar docker --version y docker compose version. En Windows también se verifica que Docker Desktop esté iniciado. La aplicación requiere Node 20 o superior y npm 10 o superior, según package.json; Docker no sustituye esos requisitos porque el manifiesto no contiene servicios web o API.

1. Clonar el repositorio y abrir una terminal en su raíz.
2. Instalar dependencias con npm ci, conservando package-lock.json.
3. Copiar .env.example a .env y revisar DATABASE_URL de desarrollo.
4. Ejecutar npm run db:up y revisar docker compose ps.
5. Iniciar API y web en terminales independientes.
6. Consultar health y comprobar storage:postgres antes de afirmar persistencia.

La API inicializa db/schema.sql al conectarse. El esquema contiene CREATE TABLE IF NOT EXISTS y modificaciones compatibles. Este mecanismo no reemplaza una estrategia versionada de migraciones para operación comercial; antes de cambios de esquema se necesitan pruebas y respaldo.

# Comandos y efectos

```bash
npm run db:up
docker compose ps
npm run db:logs
npm run db:down
```

db:down ejecuta docker compose down. El script no incluye borrado de volúmenes. Para reproducir errores se conserva el volumen y se consulta su estado, evitando acciones que eliminen la evidencia. La eliminación de un volumen es una operación distinta que no se recomienda como respuesta inicial a un error de conexión.

# Variables y conexión

La conexión de desarrollo esperada es postgresql://localito:localito@localhost:5432/localito. Si la API corre en el host, localhost identifica el computador y el puerto publicado. Si en el futuro la API se mueve a un contenedor del mismo proyecto, deberá utilizar la red de Compose y el nombre del servicio. No se cambia esa topología en esta entrega.

El archivo .env de la aplicación es leído por dotenv; las variables POSTGRES del servicio están declaradas en Compose. No se debe asumir que cambiar una contraseña en .env reconfigura automáticamente un volumen PostgreSQL ya inicializado. La documentación de variables de Compose ayuda a distinguir interpolación y ambiente del contenedor (Docker, s. f.b).

# Diagnóstico de problemas

| Síntoma | Comprobación | Acción razonada |
| --- | --- | --- |
| Puerto ocupado | Estado de servicios y error del contenedor | Identificar instalación existente antes de cambiar puerto |
| API en memoria local | DATABASE_URL y logs | Corregir conexión y confirmar health |
| Credenciales rechazadas | Base, usuario y volumen previo | Revisar inicialización del entorno sin borrar datos |
| Servicio detenido | docker compose ps y logs | Resolver causa y volver a iniciar |
| Esquema incompleto | Log de inicialización y SQL | Probar cambio en base separada |

Si el backend usa memoria en desarrollo, puede demostrar interfaces sin conservar datos al reiniciar. El usuario debe reconocer ese modo. En producción, createRepository exige PostgreSQL y falla cuando no está disponible. El Docker local no garantiza disponibilidad del proyecto administrado en Supabase.

# Respaldo y restauración de prueba

Un respaldo PostgreSQL debe poder restaurarse en una base separada (PostgreSQL Global Development Group, s. f.c). Para Localito se recomienda exportar antes de modificar esquema y comprobar negocios, ventas y relaciones después de restaurar. El archivo contiene datos privados y debe permanecer fuera del repositorio público.

La revisión no ejecutó un respaldo ni una restauración. El registro futuro debe conservar fecha, versión del servidor, comando, tamaño, resultado y comprobaciones. Un archivo descargado sin probar su restauración no acredita recuperación.

# Diferencias con producción

La base productiva documentada está en Supabase y la API se despliega en Vercel. Su conexión requiere host, usuario, pooler y configuración TLS del proveedor. El contenedor local usa credenciales de prueba y puerto del computador; no debe exponerse como servidor comercial con esos valores.

Una futura contenerización completa requiere servicios API y web, imágenes reproducibles, healthchecks, secretos y redes. Esa alternativa debe evaluarse frente al hosting serverless existente. No se representa como implementada ni se agregan servicios al manifiesto durante esta tarea documental.

# Evidencias relacionadas con esta versión

El Informe Académico conecta objetivos, método, antecedentes y resultados. La Matriz de Trazabilidad identifica requisitos e historias asociados a la implementación. El Informe de Verificación conserva las ejecuciones del 04 de octubre de 2026 y distingue su alcance local de la aceptación en PostgreSQL y con usuarios. Control de Entrega reúne la cobertura de los 17 artefactos y los pendientes de cierre.

# Conclusiones

Compose aporta un entorno PostgreSQL reproducible para el desarrollo de Localito. La documentación distingue servicio, volumen, conexión y respaldo y explica por qué API y web se ejecutan aparte. La evidencia Docker se limita al manifiesto y sus scripts, conservando pendientes las pruebas operativas que no se ejecutaron.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Docker (s. f.a). *Compose application model*. https://docs.docker.com/compose/intro/compose-application-model/

Docker (s. f.b). *Environment variables in Compose*. https://docs.docker.com/compose/how-tos/environment-variables/

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

PostgreSQL Global Development Group (s. f.c). *PostgreSQL 16 SQL Dump*. https://www.postgresql.org/docs/16/backup-dump.html

