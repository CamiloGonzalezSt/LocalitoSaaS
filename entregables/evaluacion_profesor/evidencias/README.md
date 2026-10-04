# Evidencias de la campaña del 04 de octubre de 2026

Código: commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c. Ambiente: Node 24.19.0, npm 11.9.0, API efímera en memoria con datos sintéticos.

- `pruebas_verificadas.tap`: salida canónica completa; 57 casos superiores y 21 subcasos, 78 aprobados. `.exit`: salida 0.
- `api_resultados.json`: 12 casos HTTP aprobados; incluye fecha, esperado y obtenido. `validar_api.py`: guion de reproducción solo para API local en memoria, puerto 43201.
- `api_intento_inicial.json` y `api_intento_segundo.json`: intentos previos afectados por expectativas incorrectas del instrumento sobre abono HTTP 200 y logout HTTP 204. Se corrigió el guion y se repitió la campaña completa.
- `check.log`: tipos correctos, luego bloqueo IPC de tsx; `.exit` conserva salida 1. No se presenta check como aprobado.
- `build.log`: compilación completa aprobada; `.exit` conserva salida 0.
- `npm_ci.log`: instalación con lockfile, sin scripts de instalación ni auditoría de dependencias.
- `browser.log` y `browser_install.log`: bloqueos del navegador y descarga, sin evidencia de interacción obtenida.
- `code_manifest.json`: identificadores Git de los 105 archivos recuperados para la campaña.

## Reproducción

Consultar el Informe de verificación para los comandos completos y límites. Usar el commit indicado en un clon de prueba. Compilar shared antes de los tests. El runner alternativo usa `node --import tsx --test --test-isolation=none --test-reporter=tap` con los siete archivos indicados. Para HTTP iniciar la API en 127.0.0.1:43201, NODE_ENV=development y sin variables PostgreSQL ni Vercel; ejecutar `python3 validar_api.py` desde una copia de esta carpeta. El guion comprueba almacenamiento en memoria. Detener el servidor al finalizar. No utilizar producción.

`MANIFIESTO_SHA256.json` permite comprobar integridad de los registros. Las duraciones son de esta corrida y no una evaluación de rendimiento. Los tokens y contraseñas de cuentas reales no se incluyen. PostgreSQL, dispositivos y comerciantes permanecen pendientes.
