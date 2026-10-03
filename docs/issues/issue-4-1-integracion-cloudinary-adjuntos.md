# Issue #4.1: Integración de Servicio Cloudinary para Alojamiento de Adjuntos (Subissue de #4)

- **Estado:** Pendiente
- **Subissue de:** [Issue #4: Panel interno de trazabilidad y gestión de tickets](issue-4-panel-trazabilidad-firebase.md)
- **Creado por:** [@asebasg](https://github.com/asebasg)
- **Fecha de creación:** 2026-10-03
- **Etiquetas:** `enhancement`, `storage`, `cloudinary`, `pending`

---

## Objetivo

Implementar la conexión e integración con **Cloudinary** (vía Unsigned Upload Preset) para alojar imágenes, documentos (PDF, DOCX) y multimedia asociados a las notas internas y trazabilidad de tickets, evitando requerimientos de tarjeta de crédito/facturación en Firebase Storage.

---

## Alcance Técnico

1. **Configuración de la Cuenta de Cloudinary**:
   - Crear / configurar cuenta de Cloudinary.
   - Definir un **Upload Preset** no firmado (`Unsigned`) llamado `discotech_preset` (o configurable).
   - Configurar variables de entorno en el proyecto React Vite (`.env`):
     ```env
     VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
     VITE_CLOUDINARY_UPLOAD_PRESET=discotech_preset
     ```

2. **Servicio Frontend de Subida (`src/services/cloudinary.js`)**:
   - Crear helper para realizar la petición HTTP POST `FormData` hacia:
     `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
   - Manejar progreso de carga, respuesta con `secure_url`, `public_id`, tipo MIME (`resource_type`), nombre original y tamaño.

3. **Re-activación en el Panel de Trazabilidad (`src/pages/TicketDetail.jsx`)**:
   - Habilitar nuevamente el botón de selección de archivos ("Adjuntar archivos").
   - Remover el estado deshabilitado e ícono informativo de pendiente.
   - Conectar el Submit del formulario de notas internas con el servicio de Cloudinary.
   - Almacenar los metadatos y la `secure_url` en la subcolección `timeline` de Firestore para la auditoría inmutable del ticket.

---

## Criterios de Aceptación

- [ ] Las variables de entorno de Cloudinary están configuradas en `.env`.
- [ ] Se pueden subir imágenes (JPG, PNG, WEBP) y documentos (PDF, DOCX, ZIP) sin errores de permisos ni cobros.
- [ ] La subida se realiza directamente desde el cliente vía Unsigned Preset.
- [ ] Las URLs seguras (`secure_url`) generadas por Cloudinary se almacenan en los eventos de la línea de tiempo en Firestore.
- [ ] El botón de adjuntos en `TicketDetail.jsx` se muestra 100% activo y funcional.
