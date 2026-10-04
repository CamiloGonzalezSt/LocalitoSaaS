# Documento de inicio del proyecto Localito

# Resumen ejecutivo

Localito es una PWA SaaS para centralizar ventas, existencias, caja, compras y cuentas por cobrar de pequeños comercios. La solución se desarrolla como proyecto Capstone de Ingeniería en Informática en Duoc UC Plaza Norte, por Camilo González, Alexander Patiño y Samuel Solís. El periodo documental comprende el 10 de agosto al 04 de diciembre de 2026; el corte de Scrum es el 03 de octubre y el Sprint 4 continúa en curso. La revisión documental y las pruebas adicionales se actualizaron el 04 de octubre.

El proyecto aborda la separación de información entre cuadernos, planillas y herramientas aisladas. Su propuesta combina un núcleo transaccional con asistencia de imágenes para preparar ventas y recepciones. La validación humana precede a los cambios persistentes. El stack observado es React y TypeScript, Node.js con Express y PostgreSQL administrado mediante Supabase. Vercel es el destino de despliegue documentado. El alcance excluye emisión tributaria y cobro bancario real integrado.

Este documento formaliza propósito, objetivos, interesados, alcance, restricciones y criterios de éxito. La presencia de funcionalidades en el código no se equipara a aceptación de usuario ni cierre de sus historias: ambas requieren evidencia. El documento debe leerse junto con Product Backlog, Plan de Pruebas y Arquitectura.

# Introducción

Una herramienta de gestión de comercio debe conservar una relación consistente entre lo vendido, el dinero registrado y las existencias. Si esas tres partes se administran por separado, el dueño tiene que reconciliarlas manualmente. Localito organiza esa relación en una aplicación web accesible desde dispositivos comunes y con roles que delimitan las acciones del dueño y del vendedor.

La formulación del problema procede de la documentación y experiencia planteadas por el equipo. Esta entrega no añade entrevistas, encuestas ni cifras de mercado que no consten en una evidencia verificable. Antes de afirmar impacto comercial deben ejecutarse tareas con usuarios y comparar tiempos, errores y comprensión del flujo.

La estructura académica utiliza resumen, introducción, desarrollo y conclusiones como elementos de navegación, tomando la guía de la Universidad de Chile como referencia de escritura y no como reglamento de Duoc (Universidad de Chile, s. f.). Las condiciones efectivamente exigidas se conservan desde la pauta del profesor y la definición del proyecto (Equipo Localito, 2026).

# Definición del problema y justificación

El problema no consiste únicamente en guardar una lista de productos. La venta debe actualizar existencias; una venta fiada debe vincularse con un cliente y saldo; un abono debe disminuir deuda; una recepción de compra debe afectar inventario. Sin una relación explícita entre operaciones, la digitalización puede reproducir errores que antes estaban en papel.

Localito se justifica por concentrar esos procesos y ofrecer trazabilidad por usuario, negocio y fecha. Su condición de PWA reduce la necesidad de distribuir aplicaciones nativas distintas. La utilidad del reconocimiento visual se concentra en evitar búsquedas o digitación repetitiva, manteniendo revisión humana y una alternativa manual cuando no hay conectividad o confianza suficiente.

La relevancia académica proviene de integrar análisis de requisitos, modelado, frontend, backend, persistencia, pruebas y gestión del trabajo. Ninguno de esos elementos se acredita solamente con una declaración: el repositorio, las historias, el esquema y las evidencias de prueba deben permitir que otro evaluador siga la misma operación.

# Vinculación con la definición APT

La Guía Estudiante de la Fase 1 establece como objetivo desarrollar y validar técnica y comercialmente Localito. Se conserva ese alcance: las pruebas de software respaldan el funcionamiento; entrevistas, observación y tareas con comerciantes deben respaldar la necesidad y la propuesta de valor. El Informe Académico integra ambas líneas y explica sus resultados al corte. La guía contiene una propuesta de evidencias que requiere acuerdo docente, por lo que su existencia no acredita esa aprobación.

La cobertura de requisitos se controla mediante Matriz de Trazabilidad. Informe de Verificación conserva las salidas de pruebas del 04 de octubre y Protocolo de Validación con Usuarios prepara el trabajo de campo. Control de Entrega permite revisar los 17 criterios documentales y las evidencias adicionales sin confundir un documento presente con un objetivo aceptado.

# Objetivos y resultados verificables

El objetivo general es desarrollar y validar técnica y comercialmente una PWA SaaS multi-negocio para pequeños comercios, integrando ventas, inventario, clientes, fiados, caja y compras, con seguridad, trazabilidad y un modelo de suscripción sujeto a validación. Los objetivos específicos se expresan con resultados observables para facilitar su evaluación.

| Objetivo | Resultado verificable | Evidencia |
| --- | --- | --- |
| Centralizar la venta | Ticket, total calculado y operación persistida | Caso de venta e inspección de registros |
| Controlar existencias | Descuento, recepción y kardex consistente | Stock antes y después |
| Separar negocios | Acceso restringido al negocio autenticado | Casos de acceso cruzado |
| Delimitar responsabilidades | Roles owner, seller y system_admin | Casos de permisos por endpoint |
| Asistir tareas con IA | Propuesta editable antes de confirmar | Fotos de prueba y correcciones |
| Conservar pendientes | Cola de ventas recuperable por cuenta | Corte de red y sincronización |
| Reproducir el entorno | Instalación, salud, pruebas y build | Registro de comandos y ambiente |

La reducción de tiempo y errores constituye una hipótesis de valor, no un resultado medido en esta revisión. Para validarla se necesita un protocolo comparativo con las mismas tareas, productos y condiciones. La aceptación de la tesis puede acreditar diseño e implementación aunque todavía no exista un estudio de adopción comercial; las conclusiones deben precisar esa diferencia.

# Interesados y responsabilidades

Alexander Patiño actúa como Product Owner y mantiene el orden del trabajo y sus criterios de aceptación. Samuel Solís facilita Scrum y registra seguimiento e impedimentos. Camilo González desarrolla e integra capacidades y evidencia técnica. Estos roles de trabajo son distintos de los permisos del producto; ser Product Owner no equivale a tener una cuenta owner en todos los negocios.

El docente Álvaro Andrés Mellado Pimentel evalúa la evidencia académica. El dueño del comercio define reglas operativas; el vendedor participa en la usabilidad diaria; clientes y proveedores originan información comercial. Vercel, Supabase y proveedores de IA son dependencias técnicas. Se deben identificar fallas externas sin responsabilizar al usuario de repetir un pago que ya ocurrió.

# Alcance y restricciones

El MVP contiene catálogo, ventas, fiado, compras, caja, reportes, auditoría y administración de negocios, junto con importación y ayuda visual. El alcance se interpreta desde código y requisitos; el cierre Scrum se determina mediante su Definition of Done. Al 03 de octubre existen capacidades técnicas cuya tarjeta aún no está cerrada. Los Sprints 5 a 8 conservan estructura de eventos, sin historias comprometidas.

Las restricciones incluyen tiempo del semestre, recursos del equipo, conectividad, cuotas de IA y disponibilidad de servicios administrados. La cola offline cubre ventas, no todas las escrituras. Los pagos externos se verifican manualmente. El comprobante es interno y no se declara boleta tributaria. La expansión a sucursales y facturación legal requiere alcance y evaluación separados.

# Riesgos y tratamiento

| Riesgo | Efecto | Tratamiento propuesto |
| --- | --- | --- |
| Respuesta perdida al vender | Duplicación por reintento | Mantener idempotencyKey y consultar estado |
| Propuesta IA errónea | Producto o cantidad incorrecta | Revisión, normalización y búsqueda manual |
| Falla de base | Operación no confirmada | Error visible y bloqueo de memoria en producción |
| Evidencia insuficiente | Cierre académico sin respaldo | Matriz requisito prueba y estado explícito |
| Cambio de catálogo offline | Diferencias de monto | Conciliar precio vigente y pago externo |
| Dependencia de proveedor | Función temporalmente indisponible | Configuración y procedimiento alternativo |

# Criterios de éxito y gobernanza

Se considerará exitoso el incremento cuando los casos de aceptación seleccionados puedan repetirse y sus resultados coincidan con el estado de datos. Se requiere demostrar permisos, venta, stock y deuda con datos controlados. La prueba de restauración y la evaluación con usuarios deben registrarse como pendientes hasta ejecutarse. La existencia de un workflow no acredita una ejecución aprobada.

Los cambios de alcance se llevan al Product Backlog con justificación y prioridad. El equipo evita comprometer trabajo futuro antes del Planning. El corte documental conserva los estados anteriores para que una actualización no reescriba retrospectivamente qué se había probado.

# Conclusiones

Localito presenta un alcance coherente para demostrar competencias de ingeniería de software: un núcleo operacional, separación de datos y asistencia visual con reglas deterministas. El éxito debe juzgarse por operaciones reproducibles y evidencia de calidad. Esta definición establece qué se desarrolla, por qué se desarrolla y cuáles son sus límites.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

Universidad de Chile (s. f.). *Cómo escribir un informe con formato de Memoria de Título*. https://aprendizaje.uchile.cl/recursos-especificos-por-areas-disciplinares/ciencias-silvoagropecuarias/facultad-de-ciencias-agronomicas/ingenieria-agronomica/como-escribir-un-informe-con-formato-de-memoria-de-titulo/

