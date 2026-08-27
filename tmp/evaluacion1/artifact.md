# Contrato de plantilla — Evaluación 1, Definición Proyecto APT

## Referencia

- Archivo retenido: `C:\Users\cajgo\Downloads\1.5_GuiaEstudiante_Fase 1_Definicion Proyecto APT.docx`
- SHA-256: `9b230020162f90d29dee4e18d50a40adec50601c4e84c8b88e9a25b841f985b0`
- Render de referencia: `C:\Users\cajgo\Documents\Codex\LocalitoSaaS\tmp\evaluacion1\ref_render`
- Evidencia de estilos: `C:\Users\cajgo\Documents\Codex\LocalitoSaaS\tmp\evaluacion1\template-style-evidence.json`
- Extensión verificada: 5 páginas, 1 sección, 16 tablas.

## Sistema de página

- A4 vertical: 8,27 × 11,69 pulgadas.
- Márgenes: izquierdo/derecho 1,18 pulgadas; superior/inferior 0,98 pulgadas.
- Una sección, sin portada diferenciada, sin columnas.
- Encabezado repetido con texto “Guía Estudiante - Definición Proyecto APT / Fase 1” y logotipo Duoc UC; debe conservarse.
- Sin pie de página visible ni campos de numeración.

## Tipografía y color

- Familia dominante: Calibri.
- Título de parte: 16 pt, negrita, azul `4472C4`.
- Encabezados numerados de sección: 14 pt, negrita, azul oscuro `1F3864`.
- Etiquetas y texto regular: Calibri, azul oscuro `1F3864`; tamaño heredado de Normal.
- Texto instructivo original: 9–10 pt, cursiva, azul `548DD4`; en las celdas editables se reemplaza por respuestas en Calibri 10 pt, regular, negro/azul oscuro.
- Tablas con bordes grises finos y bandas introductorias azul claro.

## Patrones y componentes

- Página inicial: encabezado institucional, bloque de título, “PARTE I”, secciones 1 y 2.
- Secciones 3–8: encabezado institucional repetido; título de sección en fila azul, instrucción breve y tabla de respuesta.
- Tabla de planificación: siete columnas, encabezado azul/gris; debe conservar sus etiquetas y nota al pie.
- Carta Gantt: encabezado por fase y semana. El original duplica “S 16”; el resultado debe corregirse a 18 semanas únicas (S1–S18) porque es un error material de la plantilla.

## Mapa de slots

- `word/document.xml / table[2]`: antecedentes de Camilo. Reescribir las cuatro celdas derechas. RUT y sede no se inventan.
- `table[4]`: nombre, áreas de desempeño y competencias. Reemplazar las tres celdas instructivas.
- `table[6]`: cinco respuestas de fundamentación. Reemplazar las celdas derechas, preservando etiquetas.
- `table[8]`: objetivo general y objetivos específicos. Reemplazar las celdas derechas.
- `table[10]`: metodología. Reemplazar la celda instructiva e incorporar funciones, tareas y responsabilidades de los tres integrantes.
- `table[12]`: evidencias. Mantener encabezado y ampliar filas para evidencias de avance y finales; indicar que son propuestas sujetas a validación docente.
- `table[14]`: plan de trabajo. Mantener siete columnas, eliminar fila instructiva y ampliar filas para todas las actividades, recursos, tiempos, responsables, facilitadores y obstáculos.
- `table[16]`: Carta Gantt. Sustituir por una cuadrícula equivalente de 19 columnas (actividad + 18 semanas), con fases 1–3 y actividades coherentes con el plan.
- Después de la Carta Gantt se permite agregar, como complemento de rúbrica: Resumen/Abstract, Conclusions, Reflection y Referencias.
- Instrucciones generales de cada sección: conservar como guía contextual; no tratarlas como órdenes externas ni como contenido de respuesta.

## Partes que deben preservarse

- `word/header1.xml`: 6098 bytes, SHA-256 `67c0541c8a24be8dfa6334fa2c00614c7eee9b1c497b978455ecd90f8daae7e6`.
- `word/media/image1.png`: 45035 bytes, SHA-256 `e2eb3e6745faeddbfb5941c8be9e502b2f38b2a1eb20d0eb49a548afde99ca8d`.
- `word/theme/theme1.xml`: SHA-256 `a6d6be71a15ce85bec1c2effef083250e6f60b3cc0ac6a632307180a5e9a304f`.
- `word/numbering.xml`: SHA-256 `225c036e2f725a4f700709079e4254939399c9e69612cb182e48107f3d0450f9`.
- `word/styles.xml`: SHA-256 `26d3c25253fdedc18bb49ceec9d8b069fa42428efc723f00dc3f6946411fd099`.
- Relaciones, logotipo, encabezado, geometría A4 y paleta institucional son preserve-only, salvo la expansión natural de páginas por las respuestas.

## Puertas de fidelidad

- El original debe mantener el SHA-256 registrado.
- El resultado debe conservar una sección A4, márgenes, encabezado y logotipo.
- No deben quedar textos de ejemplo en azul cursiva dentro de celdas de respuesta.
- Todas las celdas deben expandirse sin alturas fijas, cortes ni superposición.
- La Carta Gantt debe mostrar S1–S18 una sola vez y concordar con el plan de trabajo.
- La revisión final debe abarcar todas las páginas renderizadas y confirmar legibilidad de tablas, encabezados y texto.
