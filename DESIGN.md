# DESIGN.md — Sistema de Diseño y Especificación Visual
**Proyecto:** Discotech Reclamaciones — Libro de Reclamaciones Digital
**Versión:** 1.0.0 (Vinculante)
**Rol Emisor:** Principal Product Designer & Design Systems Architect

---

## Parámetros del Proyecto

* **Nombre / Tipo de Producto:** **Discotech Reclamaciones** — Sistema SaaS B2B y Portal Ciudadano para la recepción, gestión y resolución normativa de reclamaciones y quejas en tiempo real.
* **Audiencia Principal:**
  1. **Consumidores B2C / Usuarios Finales:** Registran reclamos y consultan el estado mediante radicado único con interfaces simples y accesibles.
  2. **Operadores Administrativos & Equipo Legal:** Gestionan tickets, modifican estados, aplican filtros y buscan solicitudes en un panel de alta eficiencia.
* **Identidad Visual / Vibe:** **Minimalismo Editorial & Warm Craft** (inspirado en estética *Linear / Warm Editorial*), combinando la elegancia de superficies cálidas/neutras, tipografía refinada, bordes estructurados y resaltados con acentos morados, azules y verdes funcionales.
* **Stack de Interfaz:** React 19, Vite, React Router DOM v7, Tailwind CSS (Sintaxis de Utility Tokens), Lucide Icons (`lucide-react`).
* **Tema Base:** Dual Mode nativo (Light mode por defecto basado en `#FAF6EF` / Dark mode estructurado en `#161616` mediante `prefers-color-scheme` o selector `.dark`).

---

## 1. PRINCIPIOS DE EXPERIENCIA Y DENSIDAD

### 1.1 Filosofía Visual: Contraste, Espacio Negativo y Jerarquía
* **Contraste Intencional:** La interfaz utiliza un alto contraste legibilidad-primero (mínimo WCAG AA 4.5:1 para texto normal, 3:1 para texto grande e íconos interactivos). Los acentos de color se reservan estrictamente para focalizar la atención en acciones primarias y estados del dominio (reclamos nuevos, en proceso, resueltos).
* **Espacio Negativo Activo:** El espacio blanco/neutro no es vacío decorativo; se utiliza como delimitador visual primario para reducir la carga cognitiva. El agrupamiento de elementos sigue la Ley de Proximidad de Gestalt.
* **Jerarquía de Atención en 3 Niveles:**
  1. **Nivel Primario (Atracción):** Radicados de reclamación (`REC-YYYY-XXXX`), botones de acción principal, badges de alerta.
  2. **Nivel Secundario (Navegación y Contexto):** Encabezados H1/H2, selectores de estado, filtros pills.
  3. **Nivel Terciario (Soporte):** Fechas, metadatos del cliente, textos explicativos y footers.

### 1.2 Nivel de Densidad y Reglas de Espaciado
* **Nivel de Densidad General:** **Media / Compacta**.
  * Portal Público (Formulario de Reclamos): **Densidad Media** (espaciados amplios `p-6` a `p-8`, `gap-4` a `gap-6` para minimizar errores de escritura).
  * Panel Administrativo (Tickets y Tablas): **Densidad Compacta** (paddings reducidos `p-3` a `p-4`, `gap-2` a `gap-3` para maximizar la densidad de información visible sin scroll).
* **Grid de Espaciado Base:** Sistema estricto basado en múltiplos de **8px** (con subpasos de **4px** para micro-ajustes):
  * `0.5` -> `2px` (Bordes finos / offsets)
  * `1` -> `4px` (Padding de badges, gap entre icono y texto)
  * `2` -> `8px` (Gap compacto en controles, padding interno de botones pequeños)
  * `3` -> `12px` (Padding interno de inputs y cards compactas)
  * `4` -> `16px` (Padding base de cards, gap medio)
  * `6` -> `24px` (Padding amplio de secciones, margin bottom de títulos)
  * `8` -> `32px` (Padding de modales y contenedores principales)
  * `12` -> `48px` (Espaciado de secciones vacías / empty states)
  * `16` -> `64px` (Gaps mayores de layout global)

### 1.3 Reglas de Elevación, Bordes y Capas Translúcidas
* **Bordes Estructurales (`border-*`):**
  * La separación de contenedores depende primariamente de bordes físicos de `1px` en lugar de sombras pesadas.
  * Regla de opacidad: `border-slate-200 dark:border-neutral-800` para estructura base; `border-purple-500/40` para elementos activos o enfocados.
* **Capas Translúcidas y Efectos de Fondo (`backdrop-blur-*`):**
  * Uso obligatorio de `backdrop-blur-md` combinado con `bg-neutral-50/80 dark:bg-neutral-900/80` en Navbars pegajosas (*sticky*), Modales y Popovers para mantener contexto situacional.
* **Sombras Semánticas (`shadow-*`):**
  * `shadow-none`: Para elementos planos integrados.
  * `shadow-sm`: Para inputs, botones resting state y tarjetas secundarias (`shadow-black/5 dark:shadow-black/20`).
  * `shadow-md`: Para hover state de tarjetas de tickets y desplegables.
  * `shadow-xl`: Reservado exclusivamente para Modales y Drawers flotantes.

---

## 2. DICCIONARIO DE TOKENS (Sintaxis Tailwind CSS)

### 2.1 Backgrounds & Superficies
| Nivel de Superficie | Rol / Uso | Clase Tailwind (Light Mode) | Clase Tailwind (Dark Mode) |
| :--- | :--- | :--- | :--- |
| **Canvas Base** | Fondo principal de la app | `bg-[#FAF6EF]` | `dark:bg-[#161616]` |
| **Surface 1** | Tarjetas de tickets, Formulario base | `bg-[#FAF6EF]` o `bg-white` | `dark:bg-[#1C1C1C]` |
| **Surface 2** | Modales, Popovers, Dropdowns | `bg-[#F0E7FA]/40` o `bg-stone-100` | `dark:bg-[#242026]` |
| **Surface Accent** | Cajas de radicado, resaltados | `bg-[#6515BE]/10` | `dark:bg-[#9B59E0]/15` |
| **Overlay** | Telón de fondo de modales | `bg-black/40` | `dark:bg-black/70` |

### 2.2 Tipografía
* **Fuentes Base:**
  * **Sans (Cuerpo y Títulos):** `font-sans` (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, `Roboto`, `sans-serif`)
  * **Mono (Radicados y Código):** `font-mono` (`ui-monospace`, `'SFMono-Regular'`, `'Consolas'`, `monospace`)

* **Escala de Jerarquía Tipográfica:**
| Nivel | Clases Tailwind Requeridas | Tamaño / Interlineado | Peso |
| :--- | :--- | :--- | :--- |
| **Display H1** | `text-3xl lg:text-5xl tracking-tight` | `36px/48px` - `56px/64px` | `font-medium` (500) |
| **Section H2** | `text-xl lg:text-2xl tracking-tight` | `20px/28px` - `24px/32px` | `font-semibold` (600) |
| **Subtitle H3** | `text-base lg:text-lg` | `16px/24px` - `18px/28px` | `font-medium` (500) |
| **Body Base** | `text-base leading-relaxed` | `16px/24px` (18px en desktop) | `font-normal` (400) |
| **Body Small** | `text-sm leading-normal` | `14px/20px` | `font-normal` (400) |
| **Radicado / Code** | `font-mono text-xl lg:text-2xl tracking-widest` | `20px/28px` - `28px/36px` | `font-bold` (700) |
| **Caption / Label** | `text-xs uppercase tracking-wider` | `12px/16px` | `font-semibold` (600) |

### 2.3 Text & Foreground
* **Texto Primario:** `text-[#161616] dark:text-[#F5F0E8]` (Lectura principal, títulos, campos requeridos).
* **Texto Secundario:** `text-[#6B6B6B] dark:text-[#9B9B9B]` (Descripciones, metadatos, timestamps).
* **Texto Muted / Deshabilitado:** `text-stone-400 dark:text-neutral-600` (Placeholders, opciones deshabilitadas).
* **Texto Acento:** `text-[#6515BE] dark:text-[#9B59E0]` (Enlaces, botones secundarios activos, destacados).

### 2.4 Semántica del Dominio (Estados de Reclamaciones)
El dominio maneja 3 estados principales y 2 utilitarios:
1. **Nuevo (Estado canónico: `Nuevo`; clase CSS: `status-nuevo`):**
   * Background: `bg-sky-500/10 dark:bg-sky-500/20`
   * Border: `border-sky-500/30 dark:border-sky-400/40`
   * Text/Icon: `text-sky-700 dark:text-sky-400`
2. **En Proceso (Estado canónico: `En proceso`; clase CSS: `status-en-proceso`):**
   * Background: `bg-purple-500/10 dark:bg-purple-500/20`
   * Border: `border-purple-500/30 dark:border-purple-400/40`
   * Text/Icon: `text-purple-700 dark:text-purple-300`
3. **Resuelto (Estado canónico: `Resuelto`; clase CSS: `status-resuelto`):**
   * Background: `bg-emerald-500/10 dark:bg-emerald-500/20`
   * Border: `border-emerald-500/30 dark:border-emerald-400/40`
   * Text/Icon: `text-emerald-700 dark:text-emerald-400`
4. **Peligro / Error (Danger):**
   * Background: `bg-red-500/10 dark:bg-red-500/20`
   * Border: `border-red-500/40 dark:border-red-400/40`
   * Text/Icon: `text-red-600 dark:text-red-400`
5. **Información / Neutral (Info):**
   * Background: `bg-stone-500/10 dark:bg-neutral-500/20`
   * Border: `border-stone-300 dark:border-neutral-700`
   * Text/Icon: `text-stone-700 dark:text-neutral-300`

### 2.5 Acciones Principales (Primary Actions & Buttons)
* **Botón Primario (Primary Button):**
  * Base: `bg-[#6515BE] dark:bg-[#9B59E0] text-white font-semibold rounded-lg px-5 py-2.5 transition-all duration-200`
  * Hover: `hover:bg-[#520f9c] dark:hover:bg-[#8844cc] hover:shadow-md`
  * Active: `active:scale-[0.98]`
  * Disabled: `disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`
  * Focus: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6515BE] dark:focus-visible:ring-[#9B59E0] focus-visible:ring-offset-2`
* **Botón Secundario (Secondary / Outline Button):**
  * Base: `bg-transparent border border-stone-300 dark:border-neutral-700 text-[#161616] dark:text-[#F5F0E8] font-medium rounded-lg px-4 py-2 transition-all duration-200`
  * Hover: `hover:bg-stone-100 dark:hover:bg-neutral-800 hover:border-stone-400 dark:hover:border-neutral-600`
* **Estados de Carga (Loading States):**
  * Ícono de spinner giratorio (`animate-spin`) obligatorio en acciones asíncronas con texto descriptivo ("Procesando...", "Guardando...").

### 2.6 Bordes y Formas (Radios)
* **`rounded-sm` (`2px` - `4px`):** Tags internos, chips diminutos.
* **`rounded-md` (`6px`):** Botones pequeños, opciones de select, controles inline.
* **`rounded-lg` (`8px`):** Inputs de formulario, botones principales, alertas.
* **`rounded-xl` (`12px`):** Tarjetas de tickets, contenedores de formulario, modales.
* **`rounded-full` (`9999px`):** Badges de estado, avatares, pills de filtro.

---

## 3. ARQUITECTURA DE COMPONENTES CORE

### 3.1 Layout Global
El layout de la aplicación debe seguir un modelo centrado de contención limpia con flexibilidad responsiva:
```text
+-------------------------------------------------------------------+
|                        HEADER / NAVBAR                            |
| [Logo Discotech]                              [Filtros / Logout]  |
+-------------------------------------------------------------------+
|                                                                   |
|                       CONTENT AREA                                |
|  - Container max-width: 1126px (Público) / 960px (Admin)          |
|  - Margen lateral adaptativo: px-4 sm:px-6 lg:px-8                |
|  - Distribución Vertical: flex flex-col min-h-screen              |
|                                                                   |
+-------------------------------------------------------------------+
|                        FOOTER GLOBAL                              |
| [Información Institucional & Derechos Reservados]                  |
+-------------------------------------------------------------------+
```

### 3.2 Patrones de Navegación
* **Pills de Filtrado (Filter Bar):**
  * Disposición horizontal flexible (`flex flex-wrap gap-2.5 mb-6`).
  * Estado Inactivo: `bg-transparent border border-stone-300 dark:border-neutral-700 text-stone-600 dark:text-stone-400 hover:border-[#6515BE]`
  * Estado Activo: `bg-[#6515BE] dark:bg-[#9B59E0] text-white border-transparent shadow-sm` con contador numérico interno.
* **Modales / Overlays:**
  * Centrado en pantalla con backdrop semitransparente `backdrop-blur-md bg-black/50`.
  * Animación de entrada: Fade-in suave (`transition-opacity duration-200`).
  * Cierre por tecla `Escape` o clic fuera del contenedor modal.

### 3.3 Tablas y Listas de Tickets
* **Contenedor Grid/Lista:**
  * Disposición vertical en pila con `flex flex-col gap-4`.
* **Tarjetas de Ticket (`admin-ticket-card`):**
  * Borde temático sutil acorde al estado del ticket (Nuevo: Azul, En Proceso: Morado, Resuelto: Verde).
  * Cabecera del ticket con Flexbox desplegado (`flex justify-between items-start gap-3`).
  * Mantenimiento de legibilidad con bloques de mensaje formateados (`whitespace-pre-wrap leading-relaxed bg-[#F0E7FA]/30 dark:bg-[#1E1724] p-3 rounded-md`).
* **Estados Vacíos (Empty States):**
  * Debe incluir ícono temático Lucide (`FileText`, `SearchX` o `Inbox`), título claro, descripción explicativa y botón de acción si corresponde (ej. "Limpiar búsqueda").
* **Skeleton Loaders:**
  * Uso de bloques rectangulares con gradiente animado de pulso (`animate-pulse bg-stone-200 dark:bg-neutral-800 rounded-md`).

### 3.4 Formularios e Inputs
* **Estructura del Campo:**
  * Contenedor vertical (`flex flex-col gap-1.5 mb-4`).
  * Etiqueta (`<label>`): `text-sm font-medium text-[#161616] dark:text-[#F5F0E8]`. Asterisco de requerido en `text-red-500`.
* **Estilos Base del Input/Select/Textarea:**
  * `w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-neutral-700 bg-white dark:bg-[#161616] text-[#161616] dark:text-[#F5F0E8] text-base transition-colors duration-150`
* **Estados de Foco (Focus State):**
  * `focus:outline-none focus:border-[#6515BE] dark:focus:border-[#9B59E0] focus:ring-2 focus:ring-[#6515BE]/20 dark:focus:ring-[#9B59E0]/20`
* **Estado de Error:**
  * `border-red-500 dark:border-red-400 focus:ring-red-500/20` acompañado de mensaje explicativo en `text-xs text-red-600 dark:text-red-400 mt-1`.

---

## 4. REGLAS CONTRACTUALES PARA EL AGENTE MCP (STITCH / ANTIGRAVITY)

A fin de garantizar la mantenibilidad, consistencia visual y rendimiento de la base de código, todo agente autómata o desarrollador que edite o genere componentes en este proyecto **DEBE cumplir con las siguientes reglas contractuales e inquebrantables**:

1. **PROHIBICIÓN DE ESTILOS EN LÍNEA Y CLASES ARBITRARIAS:**
   * 🚫 **PROHIBIDO** el uso del atributo `style={{ ... }}` salvo para valores dinámicos calculados en tiempo de ejecución que no puedan representarse en CSS (ej. posiciones de coordenadas en gráficos o canvas).
   * 🚫 **PROHIBIDO** el uso de clases arbitrarias ad-hoc de Tailwind como `h-[37px]`, `w-[213px]`, `bg-[#123456]` o `p-[13px]`. Se deben utilizar **exclusivamente** la escala de espaciado estándar del sistema (`p-3`, `p-4`, `h-10`, `w-full`) y los tokens semánticos definidos en este documento.

2. **ACCESIBILIDAD Y ESTADOS INTERACTIVOS OBLIGATORIOS:**
   * Todo elemento interactivo (`<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`) debe incluir explícitamente:
     * Estado `:hover` visualmente distinguible.
     * Estado `:active` o micro-interacción al presionar.
     * Estado `:focus-visible` con `ring-2` o `outline` para navegación por teclado.
     * Contraste accesible que cumpla como mínimo la norma **WCAG AA** (ratio 4.5:1).
     * Atributos `aria-label`, `aria-expanded` o `aria-describedby` cuando el propósito no sea evidente solo con el texto visual.

3. **ESTRUCTURA MODULAR ESTRICTA:**
   * Ningún componente visual reutilizable debe definirse inline dentro de los archivos de vistas (`src/pages/*`).
   * Todos los componentes deben residir en carpetas categorizadas bajo `src/components/` siguiendo la convención de nombres PascalCase:
     * `src/components/claims/` (Formularios y cards de reclamación).
     * `src/components/admin/` (Controles de administración, filtros, modales).
     * `src/components/ui/` (Botones base, inputs, badges, spinners).
     * `src/components/layout/` (Navbar, Footer, Sidebar).

4. **RESTRICCIÓN DE DEPENDENCIAS CSS EXTERNAS:**
   * 🚫 **PROHIBIDO** importar librerías CSS externas adicionales (ej. Bootstrap, Material UI, Ant Design, Chakra) que entren en conflicto con la arquitectura Tailwind CSS / Utility-First del proyecto.
   * La iconografía debe provenir exclusivamente de la biblioteca oficial `lucide-react`.

---
*Este documento es la única fuente de verdad técnica y estética para Discotech Reclamaciones. Toda modificación visual o inclusión de nuevos componentes debe estar alineada rigurosamente con estas reglas.*
