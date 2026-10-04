# Protocolo e instrumentos de validación de Localito

# Resumen ejecutivo

Este protocolo permite comprobar la necesidad, comprensión y utilidad de Localito mediante entrevistas y tareas con dueños o vendedores de pequeños comercios. Incluye instrumentos listos para completar, datos sintéticos, criterios de observación y reglas de análisis. Su aplicación aportará la evidencia que falta para evaluar usabilidad, asistencia visual y propuesta comercial.

Estado al 04 de octubre de 2026: protocolo preparado, sin participantes ni resultados registrados en esta campaña. Las cantidades y metas de este documento son propuestas de diseño de la evaluación. Se mantienen diferenciadas de las pruebas automatizadas y HTTP del Informe de Verificación.

# Introducción y preguntas

La evaluación observa la tarea completa: comprender una situación, localizar información, realizar una operación y reconocer su resultado. En Venta Rápida incluye tomar la fotografía, esperar, revisar y corregir. Medir únicamente el tiempo de respuesta de la IA omitiría una parte relevante del esfuerzo.

Se busca responder cómo registra hoy el comercio sus ventas, stock y fiados; qué dificultades encuentra; si Localito permite completar las tareas; qué errores aparecen; y cuándo la asistencia visual aporta o dificulta el trabajo. La intención de pago se consulta después de observar el uso, sin interpretarla como una venta realizada.

# Participantes y alcance del piloto

Se propone comenzar con entre cinco y ocho participantes del segmento, procurando incluir dueños y vendedores, distinta familiaridad digital y al menos dos formas actuales de registro. Esta cantidad es una decisión práctica para un piloto exploratorio y no justifica estimaciones representativas del mercado. Si solo se accede a menos personas, se informa el número real y sus limitaciones.

La invitación explica propósito académico, duración aproximada, tareas y uso de los registros. Se sugiere una sesión de 35 a 50 minutos, ajustada tras un ensayo del instrumento. El reclutamiento, las fechas y la participación requieren coordinación real del equipo; este documento no confirma reuniones.

# Consentimiento y tratamiento de registros

Texto propuesto para lectura antes de iniciar:

“Somos estudiantes que evaluamos Localito como proyecto académico. Queremos observar cómo se comprenden algunas tareas del sistema y conocer su experiencia de trabajo. Su participación es voluntaria; puede omitir una pregunta o detener la sesión. Usaremos datos ficticios y registraremos observaciones sin publicar su nombre. La grabación de audio o pantalla solo se realizará si usted la autoriza. Los resultados se presentarán de forma resumida para la evaluación del proyecto.”

Código de participante: ____________________

Fecha y persona que conduce la sesión: ____________________

Acepta participar: Sí ____ No ____

Autoriza audio: Sí ____ No ____    Autoriza pantalla: Sí ____ No ____

Firma o forma de consentimiento registrada: ____________________

La identificación y el contacto, si resultan necesarios, se conservan separados de las respuestas. Antes de recolectar se acuerdan acceso, fecha de eliminación y responsable del archivo. No se fotografían documentos comerciales reales ni se utilizan datos de clientes sin autorización específica.

# Ficha de contexto

- Código del participante y rol actual.
- Rubro y forma de atención del comercio.
- Herramientas que utiliza para ventas, inventario y fiado.
- Frecuencia aproximada de uso de celular o computador para trabajar.
- Dispositivo, navegador y conectividad de la sesión.
- Relación previa con el equipo y experiencia con Localito.

Se registra únicamente lo necesario para interpretar la prueba. Las respuestas “no sabe” y “prefiere no responder” se conservan como tales.

# Guion de entrevista sobre el proceso actual

## Operación cotidiana

1. Cuénteme cómo registra una venta desde que el cliente pide un producto hasta que termina la atención.
2. ¿Cómo sabe cuántas unidades quedan y cuándo necesita reponer?
3. Cuando una persona compra fiado, ¿cómo registra y consulta esa deuda?
4. ¿Qué hace para revisar el dinero al terminar un turno?
5. ¿Qué ocurre cuando se corta internet o falla el dispositivo que utiliza?

## Problemas y alternativas

6. Describa una ocasión reciente en que un registro no coincidió con lo ocurrido. ¿Cómo lo detectó y resolvió?
7. ¿Qué tarea le requiere más búsquedas, correcciones o anotaciones repetidas?
8. ¿Qué herramientas ha probado y qué le resulta útil o difícil de ellas?
9. ¿Qué información necesita consultar y actualmente le cuesta obtener?
10. ¿Qué tendría que ocurrir para que considerara cambiar su forma de trabajar?

Se evita sugerir que el participante necesariamente tiene un problema o que Localito es la solución. Cuando aporte un ejemplo se registra si fue observado, relatado o estimado. Una anécdota no se transforma en una frecuencia mensual sin preguntar por su base.

# Preparación del entorno

El moderador utiliza una versión identificada y un negocio exclusivo de demostración. Se crean productos y clientes ficticios, se comprueba acceso y se restablecen datos entre participantes. Se informa que los pagos de la sesión no mueven dinero real. Se desactiva cualquier flujo que pueda enviar mensajes a personas ajenas a la prueba.

| Producto sintético | Precio CLP | Stock inicial |
| --- | --- | --- |
| Arroz de prueba 1 kg | 1500 | 10 |
| Leche de prueba 1 L | 1200 | 8 |
| Galletas de prueba | 800 | 6 |

Cliente de prueba: Cliente Piloto, deuda inicial 0 CLP y límite de 10000 CLP. Las fotografías se preparan con envases identificables y un catálogo conocido; la correspondencia correcta se registra antes de probar IA. Si no está disponible el proveedor visual, esa tarea se marca bloqueada.

# Tareas de aceptación con usuarios

## UAT01 Venta simple

Consigna: un cliente compra dos unidades de arroz y una leche, y paga en efectivo. Registre la venta y compruebe su resultado.

Precondición: stock inicial restablecido y sesión de vendedor. Resultado de referencia: ticket de 4200 CLP, arroz en 8 unidades y leche en 7. Se observa si encuentra productos, modifica cantidades, identifica total y comprende que la venta quedó confirmada.

## UAT02 Error y recuperación

Consigna: prepare una venta de un producto cuya cantidad excede el stock disponible y resuelva la situación sin perder el resto del ticket.

Resultado de referencia: el sistema informa el rechazo y no registra una venta inválida. Se observa comprensión del mensaje y necesidad de ayuda. El moderador comprueba antes y después que no hubo cambios indebidos en ventas o existencias.

## UAT03 Fiado y abono

Consigna: Cliente Piloto compra una leche fiada. Después abona 500 CLP en efectivo. Consulte cuánto debe.

Resultado de referencia: deuda inicial de 1200 CLP y saldo final de 700 CLP. Se observa si distingue venta, deuda y dinero recibido, y si encuentra el estado de cuenta.

## UAT04 Inventario y reposición

Consigna: reciba tres unidades de galletas y compruebe el stock y el movimiento que explica el cambio.

Precondición: sin ventas previas de galletas y flujo de recepción preparado. Resultado de referencia: stock de 9 unidades y registro asociado. Se observa la diferencia entre crear una orden y confirmar lo recibido.

## UAT05 Corte de conexión

Consigna: prepare una venta durante un corte controlado, identifique su estado y complete la sincronización al recuperar la red.

El moderador controla la conexión y conserva datos antes y después. El resultado esperado distingue pendiente local de confirmada; tras un reintento debe existir una única venta aceptada. Se registra el comportamiento real del navegador y no se atribuye a PostgreSQL si el entorno utiliza memoria.

## UAT06 Preparación asistida por fotografía

Consigna: prepare el mismo ticket con búsqueda manual, código de barras y fotografía. Revise productos y cantidades antes de confirmar.

Se utiliza un conjunto de productos conocido y se alterna el orden de los métodos entre participantes. El cronómetro cubre desde el inicio de la tarea hasta el ticket revisado. Se registran correcciones, productos no encontrados, error del proveedor y ayuda del moderador.

## UAT07 Cierre de caja

Consigna: consulte el efectivo esperado y cierre el turno con una diferencia controlada que pueda explicar.

Se registra el valor de referencia antes de comenzar. La aceptación observa si el usuario distingue esperado, contado y diferencia, y si comprende cuándo debe justificarla. El resultado se contrasta con los movimientos del turno.

# Hoja de observación por tarea

Copiar esta ficha para cada participante y tarea. Es un instrumento en blanco, no un resultado de la evaluación.

Código de participante: __________  Tarea: __________  Versión: __________

Inicio: __________  Fin: __________  Tiempo en segundos: __________

Resultado: Completó sin ayuda ____ Completó con ayuda ____ No completó ____ Bloqueada ____

Ayuda entregada y momento: ______________________________________

Acciones o mensajes que causaron dificultad: ______________________________________

Errores observados y correcciones: ______________________________________

Estado inicial y final de datos: ______________________________________

Comentario literal autorizado y localizador: ______________________________________

Evidencia asociada y observador: ______________________________________

# Indicadores y cálculo

| Indicador | Cálculo | Interpretación |
| --- | --- | --- |
| Éxito sin ayuda | Tareas completadas sin ayuda divididas por intentos válidos | Informar numerador y denominador por tarea |
| Tiempo de tarea | Fin menos inicio, en segundos | Informar mediana y rango junto con cantidad de participantes |
| Errores de ticket | Líneas o cantidades incorrectas antes de confirmar | Distinguir propuesta IA de error final no corregido |
| Esfuerzo de corrección | Cambios manuales necesarios por propuesta | Incorporar al tiempo total de la asistencia |
| Diferencia de tiempo | Tiempo manual menos tiempo asistido | Comparar tareas equivalentes por participante |
| Fallos externos | Intentos bloqueados por proveedor o red | Informar frecuencia y excluirlos de éxito funcional sin ocultarlos |

No se imputan tiempos a tareas abandonadas. Los casos bloqueados se reportan junto con su causa. Si el método asistido tarda más, el resultado se conserva. La evaluación debe mostrar cuándo aporta valor y cuándo conviene usar la alternativa manual.

# Preguntas posteriores al uso

1. ¿Qué parte de la tarea le resultó más clara y cuál más difícil?
2. ¿En qué momento dudó si la venta estaba guardada?
3. ¿Qué información necesitaría para confiar en el stock o en el saldo de un cliente?
4. ¿En qué situación usaría una fotografía y en cuál preferiría buscar o escanear?
5. ¿Qué tarea de su negocio seguiría realizando fuera de Localito y por qué?
6. ¿Qué condición tendría que cumplirse para probarlo durante una semana?
7. ¿Qué costo o esfuerzo estaría dispuesto a asumir y qué espera recibir a cambio?

Los precios configurados del MVP pueden mostrarse al final, indicando que son una propuesta. Se registra reacción y objeciones, sin tratar una respuesta hipotética como suscripción o ingreso.

# Análisis y decisiones

Cada hallazgo debe vincular evidencia y consecuencia. Ejemplo de formato: en UAT05, el participante P03 interpretó “pendiente” como confirmación; necesitó ayuda; se propone revisar el mensaje y repetir la tarea. Este ejemplo ilustra el registro y no corresponde a una persona evaluada.

Se agrupan dificultades por tarea y se informa cuántos participantes las encontraron. La gravedad considera pérdida de datos, operación incorrecta, bloqueo o fricción recuperable. Las propuestas se llevan al Product Backlog, conservando el requisito y la evidencia que las originan.

# Informe de resultados por completar

Fecha de aplicación y versión: ______________________________________

Participantes reales y criterios de selección: ______________________________________

Tareas ejecutadas y bloqueadas: ______________________________________

Resultados numéricos con denominadores: ______________________________________

Hallazgos principales y evidencias: ______________________________________

Decisiones de mejora y responsables acordados: ______________________________________

Limitaciones del estudio y siguiente comprobación: ______________________________________

# Conclusiones

El protocolo prepara una evaluación que conecta necesidades, tareas, datos y decisiones. Su aplicación permitirá actualizar el Informe Académico con evidencia de usuarios y evaluar la propuesta visual sin anticipar beneficios. La validación solo se considera realizada cuando existen registros de participantes, resultados y condiciones de ejecución.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

