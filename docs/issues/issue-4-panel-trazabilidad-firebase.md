# Issue #4: Crear panel interno de trazabilidad y gestión de tickets con adjuntos en Firebase

- **Estado:** Abierto
- **Creado por:** [@asebasg](https://github.com/asebasg)
- **Fecha de creación:** 2026-10-03
- **Etiquetas:** `enhancement`
- **URL original:** [https://github.com/agnonotdev/discotech-reclamaciones/issues/4](https://github.com/agnonotdev/discotech-reclamaciones/issues/4)

---

## Objetivo

Crear una página interna de visualización y gestión de tickets que permita consultar la trazabilidad completa de cada reclamación mediante una conversación asíncrona de uso exclusivo administrativo. Esta vista funcionará como un board de gestión profesional y no enviará automáticamente al cliente los mensajes o notas registrados en ella.

## Alcance funcional

- Construir una vista de detalle para cada ticket/reclamación.
- Mostrar una línea de tiempo o chat asíncrono con mensajes, eventos y cambios relevantes del ticket.
- Diferenciar claramente notas internas, eventos del sistema y cualquier contenido que eventualmente pueda compartirse con el cliente.
- Incorporar un panel de gestión con, como mínimo, los siguientes campos:
  - Asignado a.
  - Estado.
  - Prioridad.
  - Categoría o tipo de reclamación.
  - Fecha de creación y última actualización.
  - SLA o fecha límite, si aplica.
  - Etiquetas.
  - Historial de cambios.
- Permitir actualizar los campos de gestión desde la vista, aplicando control de permisos y registrando cada cambio en la trazabilidad.
- Mantener una experiencia visual profesional, clara y responsive para el equipo interno.

## Estrategia para imágenes y archivos en Firebase

Diseñar e implementar una estrategia basada en Firebase Storage para alojar imágenes y otros adjuntos, manteniendo en Firestore únicamente sus metadatos y referencias:

- Guardar los archivos en rutas estructuradas, por ejemplo `tickets/{ticketId}/attachments/{attachmentId}`.
- Almacenar en el documento del mensaje o evento el identificador del archivo, ruta de Storage, nombre original, tipo MIME, tamaño, usuario que lo cargó, fecha de carga y estado.
- Generar URLs de descarga mediante Firebase Storage y evitar depender de URLs públicas permanentes.
- Definir reglas de seguridad de Storage y Firestore para que solo usuarios autenticados y autorizados puedan leer o cargar archivos asociados a un ticket.
- Validar extensiones, tipos MIME y tamaño máximo permitido.
- Considerar miniaturas o compresión para imágenes y carga progresiva en la interfaz.
- Contemplar eliminación lógica, limpieza de archivos huérfanos y, cuando corresponda, expiración o revocación de accesos.
- No exponer en la vista del cliente los adjuntos o mensajes marcados como internos.

## Modelo de datos sugerido

- `tickets/{ticketId}`: estado actual, asignado, prioridad, categoría, SLA, etiquetas y marcas de tiempo.
- `tickets/{ticketId}/timeline/{eventId}`: mensajes internos, eventos del sistema, cambios de estado y referencias a adjuntos.
- `tickets/{ticketId}/attachments/{attachmentId}` o una colección equivalente de metadatos: información del archivo almacenado en Firebase Storage.

## Criterios de aceptación

- [ ] Un usuario interno autorizado puede abrir un ticket y consultar su historial completo en formato de timeline/chat asíncrono.
- [ ] Los mensajes y notas internas no se envían ni se muestran al cliente.
- [ ] El panel permite consultar y actualizar al menos Asignado a, Estado, Prioridad, Categoría, SLA y Etiquetas.
- [ ] Cada cambio relevante queda registrado con usuario y fecha/hora.
- [ ] La interfaz diferencia visualmente mensajes internos, eventos automáticos y cambios de gestión.
- [ ] Se pueden adjuntar imágenes y consultar sus previsualizaciones desde la vista interna.
- [ ] Los archivos se almacenan en Firebase Storage y sus metadatos se persisten de forma segura.
- [ ] Las reglas de Firebase impiden el acceso no autorizado a tickets, timeline y adjuntos.
- [ ] Se aplican validaciones de tamaño y tipo de archivo, y se documenta el comportamiento ante archivos inválidos.
- [ ] La solución contempla limpieza de archivos huérfanos y manejo de errores de carga o visualización.

## Consideraciones técnicas

- Revisar el modelo actual de tickets y autenticación antes de definir la estructura final.
- Usar listeners en tiempo real únicamente donde aporten valor; la conversación es asíncrona y debe conservar trazabilidad sin generar comunicaciones al cliente.
- Diseñar índices de Firestore para consultas por estado, asignado, fecha y prioridad.
- Proteger las operaciones de actualización mediante reglas de seguridad y, si es necesario, Cloud Functions para validar transiciones o registrar auditoría.
- Añadir pruebas de permisos, aislamiento entre tickets y prevención de exposición de información interna.
