# Discotech Reclamaciones - Libro de Reclamaciones Digital 📖⚡

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.17-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?style=for-the-badge&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![Lucide Icons](https://img.shields.io/badge/Lucide_Icons-v1.32-F56565?style=for-the-badge&logo=lucide&logoColor=white)](https://lucide.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)

Plataforma web moderna y eficiente diseñada para la gestión integral del **Libro de Reclamaciones Digital**. Esta solución permite a los clientes registrar reclamos y quejas de forma rápida e intuitiva con generación automática de código de radicado, mientras proporciona a los administradores un panel de control en tiempo real para hacer seguimiento y actualizar el estado de cada solicitud.

---

## 1. 📋 Descripción General

En el marco del cumplimiento normativo y la atención al cliente, **Discotech Reclamaciones** ofrece un sistema centralizado e interactivo para la recepción, organización y resolución de disconformidades (quejas y reclamos).

El sistema resuelve la necesidad de contar con un canal transparente y seguro:
- 👤 **Para el consumidor**: Brinda un formulario accesible que valida sus datos, registra el detalle de su solicitud y le asigna de inmediato un número de radicado único para realizar el seguimiento de su caso.
- 🛡️ **Para la organización**: Proporciona un entorno administrativo restringido con sincronización en tiempo real vía Cloud Firestore, filtros por estado, búsqueda integrada y control de acceso basado en roles.

---

## 2. ✨ Características Principales

- 📝 **Formulario de Registro Controlado**: Captura interactiva de nombre, correo electrónico, tipo de solicitud (Reclamo o Queja) y mensaje detallado, con validaciones en tiempo cliente.
- 🆔 **Generación de Radicado Único**: Algoritmo puramente funcional que asigna códigos legibles (ej. `REC-2026-X8K2`) excluyendo caracteres confusos (`0`, `O`, `1`, `I`) e incluyendo un botón de copiado rápido al portapapeles.
- 🔐 **Autenticación Administrativa Robusta**: Inicio de sesión soportado mediante **Google OAuth** y **Correo/Contraseña**, reforzado con validación de roles en la colección `admins` de Firestore y modal de asistencia.
- ⚡ **Panel de Gestión en Tiempo Real**: Visualización reactiva a través de escuchadores `onSnapshot` que actualiza los tickets al instante sin requerir recargar la página.
- 🎯 **Filtrado y Búsqueda Avanzada**: Sistema de filtrado por estados (*Nuevo*, *En proceso*, *Resuelto*) con contadores dinámicos y caja de búsqueda en tiempo real.
- 🛡️ **Seguridad Garantizada**: Implementación de `ProtectedRoute` en el cliente y reglas de seguridad granulares en Firestore (`firestore.rules`) que restringen la lectura/modificación de tickets únicamente a usuarios autenticados y activos en la lista de administradores.

---

## 3. ⚙️ Requisitos e Instalación

### 📌 Requisitos Previos

Asegúrate de contar con los siguientes elementos antes de comenzar:
- **Node.js**: Versión 18.0.0 o superior.
- **npm** (v9+) o gestor de paquetes equivalente (`yarn`, `pnpm`).
- **Proyecto en Firebase**: Con los servicios de **Cloud Firestore** y **Firebase Authentication** (proveedores de Google y Email/Contraseña) activados.

### 🚀 Guía de Instalación Local

1. **Clonar el repositorio**:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd discotech-reclamaciones
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno**:
   Crea un archivo `.env.local` en la raíz del proyecto basándote en la configuración de Firebase:
   ```env
   VITE_FIREBASE_API_KEY=tu_api_key
   VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
   VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
   VITE_FIREBASE_APP_ID=tu_app_id
   VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id
   ```

4. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible por defecto en `http://localhost:5173`.

---

## 4. 📖 Guía de Uso

### 🛠️ Comandos de Desarrollo y Producción

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con Vite (HMR activado). |
| `npm run build` | Compila y optimiza la aplicación para producción en la carpeta `/dist`. |
| `npm run preview` | Previsualiza localmente la compilación de producción. |
| `npm run lint` | Ejecuta ESLint para verificar el cumplimiento de reglas de código. |

### 🔄 Flujos del Sistema

#### 👤 Flujo del Cliente (Público)
1. Acceder a la ruta principal `/`.
2. Completar los campos requeridos: **Nombre Completo**, **Correo Electrónico**, **Tipo de Solicitud** (Reclamo/Queja) y **Detalle/Mensaje**.
3. Hacer clic en **Enviar Solicitud**.
4. El sistema mostrará la tarjeta de confirmación con el **Número de Radicado** generado. Utiliza el botón **Copiar Radicado** para guardar la referencia.

#### 🔑 Flujo del Administrador (Privado)
1. Navegar a la ruta `/admin` o hacer clic en el enlace **Admin** del encabezado.
2. Si no hay una sesión activa, el sistema redirigirá automáticamente a `/admin/login`.
3. Iniciar sesión utilizando **Google** o **Correo y Contraseña**.
   > *Nota*: El usuario debe existir en la colección `admins` de Firestore con la propiedad `isActive: true` para poder acceder.
4. En el **Panel de Control** (`/admin`), el usuario puede:
   - Filtrar reclamaciones por estado (*Todos*, *Nuevo*, *En proceso*, *Resuelto*).
   - Buscar solicitudes por cliente, correo, radicado o contenido del mensaje.
   - Cambiar el estado de cualquier ticket mediante el selector desplegable en tiempo real.

---

## 5. 🛠️ Tecnologías

El proyecto ha sido desarrollado con un stack moderno, enfocado en rendimiento, modularidad y seguridad:

- **Frontend**:
  - [React 19](https://react.dev/) - Biblioteca para la interfaz de usuario.
  - [Vite](https://vitejs.dev/) - Herramienta de construcción rápida para web.
  - [React Router DOM v7](https://reactrouter.com/) - Enrutamiento declarativo para aplicaciones de página única (SPA).
  - [Lucide React](https://lucide.dev/) - Iconografía vectorial limpia y consistente (`ShieldCheck`, `Lock`, `FileText`, `Mail`, `User`, `Clock`, `RefreshCw`, `CheckCircle2`, `Filter`, `Search`, etc.).
- **Backend / Servicios Cloud**:
  - [Firebase Cloud Firestore](https://firebase.google.com/docs/firestore) - Base de datos NoSQL en tiempo real.
  - [Firebase Authentication](https://firebase.google.com/docs/auth) - Gestión de usuarios y autenticación segura.
  - [Firebase Hosting](https://firebase.google.com/docs/hosting) - Plataforma de despliegue y alojamiento.
- **Calidad de Código**:
  - [ESLint v10](https://eslint.org/) - Linter para JavaScript y React.

---

## 6. 📁 Estructura del Proyecto

```text
discotech-reclamaciones/
├── public/                 # Archivos estáticos públicos
├── src/
│   ├── assets/             # Estilos y recursos gráficos globales
│   ├── components/         # Componentes reutilizables
│   │   ├── ClaimForm.jsx     # Formulario de registro con copiado de radicado e iconos Lucide
│   │   ├── Footer.jsx        # Pie de página institucional con iconos Lucide
│   │   └── ProtectedRoute.jsx# Guardián de rutas autenticadas y autorizadas
│   ├── context/            # Proveedores de estado global
│   │   └── AuthContext.jsx   # Estado de sesión de Firebase y verificación de admin
│   ├── pages/              # Vistas/Páginas principales
│   │   ├── Admin.jsx         # Panel de gestión en tiempo real con filtros, buscador e iconos Lucide
│   │   ├── Home.jsx          # Vista pública principal del Libro de Reclamaciones con iconos Lucide
│   │   └── Login.jsx         # Página de autenticación para administradores con iconos Lucide
│   ├── utils/              # Utilidades puras
│   │   └── id-generator.js   # Generador de códigos de radicado legibles
│   ├── App.css             # Estilos de la aplicación
│   ├── App.jsx             # Enrutador principal y árbol de componentes
│   ├── firebase.js         # Inicialización centralizada de servicios Firebase
│   ├── index.css           # Estilos base y variables CSS
│   └── main.jsx            # Punto de entrada de React en el DOM
├── .firebaserc             # Configuración del proyecto en Firebase CLI
├── eslint.config.js        # Configuración de ESLint en formato Flat Config
├── firebase.json           # Configuración de servicios e imprevistos de Firebase
├── firestore.indexes.json  # Definición de índices de Firestore
├── firestore.rules         # Reglas de seguridad en Cloud Firestore
├── index.html              # Plantilla HTML principal
├── package.json            # Definición de proyecto y dependencias
└── vite.config.js          # Configuración del empaquetador Vite
```

---

## 7. 🤝 Contribución y Licencia

### 🤝 Contribución

¡Las contribuciones son bienvenidas! Si deseas colaborar en la mejora de la plataforma:

1. Haz un **Fork** de este repositorio.
2. Crea una rama (*branch*) para tu nueva funcionalidad o corrección:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. Realiza tus cambios y asegúrate de que el linter y la compilación se ejecuten sin errores:
   ```bash
   npm run lint
   npm run build
   ```
4. Envía un **Commit** descriptivo de tus cambios:
   ```bash
   git commit -m "feat: añade nueva funcionalidad X"
   ```
5. Haz **Push** a tu rama:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
6. Abre un **Pull Request** para revisión.

### 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo `LICENSE` (si está presente) o contacta al equipo de desarrollo para obtener más detalles.
