# DESIGN.md - Discotech Reclamaciones (Single Source of Truth)

## Contexto del Proyecto
- **Producto:** Sistema de Gestión de Reclamaciones B2C y Panel Administrativo (Admin Dashboard).
- **Audiencia:** Usuarios finales B2C (Formulario de reclamos) y Administradores/Resolutores del club/discoteca.
- **Identidad Visual / Vibe:** Apple Human Interface Guidelines adaptado a Web / Minimalismo Funcional Dark-Mode-First. Fluid motion con físicas de resortes (springs) y aceleración por GPU. Interacciones cinemáticas sutiles sin rebotes gomosos exagerados.
- **Stack de Interfaz:** React 19, Vite, CSS Grid/Flexbox moderno, Variables CSS (CSS Custom Properties), Framer Motion (Web), React Native Reanimated (Expo/Nativo), Lucide Icons.
- **Tema Base:** Dark Mode Estricto (con soporte ocasional de gradientes profundos).

---

## 1. PRINCIPIOS DE EXPERIENCIA Y DENSIDAD

### Filosofía Visual
- **Menos es más:** Contraste tipográfico y uso agresivo del espacio negativo en lugar de bordes pesados o fondos ruidosos.
- **Materiales Nativos:** Uso de fondos translúcidos (`backdrop-filter`) para dar sentido de profundidad y jerarquía en la acumulación de capas (Z-axis).
- **Motion como Feedback:** La animación nunca es decorativa; siempre informa al usuario de cambios de estado, confirmaciones y reordenamientos físicos. Movimientos snappys, curvas de aceleración asimétricas y sin distorsión de bounding-boxes.

### Nivel de Densidad
- **Media-Compacta (Admin):** Optimizado para legibilidad de datos y densidad de tickets. Espaciado en múltiplos de `4px` y `8px` (`gap: 16px`, `padding: 12px 20px`).
- **Media-Holgada (B2C):** Interfaces de consumo (Login, Formulario) con áreas táctiles grandes (mínimo `44px`) y respiración abundante (`gap: 24px`, `margin-bottom: 32px`).

### Elevación, Sombras y Materiales
- **Superficie 0 (Canvas):** Fondo plano oscuro o gradiente muy sutil. Sin sombras.
- **Superficie 1 (Cards, Inputs):** Borders translúcidos (`rgba(255, 255, 255, 0.08)`), fondos sólidos oscuros con ligero toque del color de marca.
- **Superficie 2 (Modales, Navbars, Floating Actions):** Efecto Glassmorfismo. `backdrop-filter: blur(12px) saturate(180%)`, borde ultra-fino y sombras profundas pero suaves (`box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4)`).

---

## 2. DICCIONARIO DE TOKENS (Variables CSS)

Este proyecto NO utiliza Tailwind. Se basa estrictamente en CSS nativo con Custom Properties en `index.css`.

### Backgrounds & Superficies
```css
:root {
  --bg: #121015; /* Canvas principal */
  --card-bg: rgba(28, 24, 32, 0.6); /* Superficie 1 - Translúcida */
  --card-bg-solid: #1c1820; /* Superficie 1 - Sólida */
  --glass-bg: rgba(28, 24, 32, 0.85); /* Superficie 2 - Glassmorphism */
  --overlay-bg: rgba(0, 0, 0, 0.65); /* Modal Backdrops */
}
```

### Text & Foreground (Escala de Grises)
```css
:root {
  --text-primary: #ffffff; /* Títulos y datos clave */
  --text-secondary: rgba(255, 255, 255, 0.7); /* Párrafos, labels descriptivos */
  --text-muted: rgba(255, 255, 255, 0.45); /* Placeholders, timestamps secundarios */
  --border: rgba(255, 255, 255, 0.08); /* Bordes de separación universales */
}
```

### Semántica del Dominio (Estados de Tickets y Sistema)
```css
:root {
  /* Marca / Primary Action */
  --accent: #5e35b1;
  --accent-hover: #673ab7;
  --accent-glow: rgba(94, 53, 177, 0.25);

  /* Estados Funcionales */
  --success: #10b981;
  --success-bg: rgba(16, 185, 129, 0.15);
  --error: #ef4444;
  --error-bg: rgba(239, 68, 68, 0.15);
  
  /* Estados de Tickets Específicos */
  --ticket-nuevo: #0ea5e9;       /* Azul brillante */
  --ticket-progreso: #f59e0b;    /* Ámbar */
  --ticket-resuelto: #10b981;    /* Esmeralda */
  --ticket-cerrado: #64748b;     /* Slate / Gris */
}
```

### Tipografía
- **Fuente Principal:** Inter, Roboto, San Francisco (System Stack).
- **Pesos:** Regular (400), Medium (500), SemiBold (600), Bold (700).

### Bordes y Formas (Radios)
```css
:root {
  --radius-sm: 6px;   /* Badges, Checkboxes, Inputs pequeños */
  --radius-md: 10px;  /* Botones estándar, Tickets, Modales internos */
  --radius-lg: 16px;  /* Cards grandes, Modales principales, Layout containers */
  --radius-full: 9999px; /* Pill buttons, Avatares */
}
```

---

## 3. ARQUITECTURA DE COMPONENTES CORE

### Layout Global
- **B2C (Home/Login):** Layout centrado, ancho máximo restringido (max-width: 480px a 600px). Focus absoluto en la tarea.
- **Admin Dashboard:** Layout fluido (`max-width: 1200px`), con `Header` superior o barra lateral de filtros (IconBar), zona de búsqueda a la derecha, y grilla de contenido (Admin Tickets Grid).

### Patrones de Interacción & Animación
- **Entrance:** Fade-ins rápidos con micro-desplazamientos verticales (ej. `y: 8px -> 0px`) mediante Framer Motion. Duraciones de 0.15s - 0.25s. Curvas de aceleración tipo asimétrica (`ease: [0.16, 1, 0.3, 1]`).
- **Hover/Press:** Cambios de escala microscópicos y rápidos (`scale: 0.97` en botones) sin opacidades extremas.
- **Transiciones de CSS:** Restringidas **únicamente** a color (`background-color`, `border-color`, `color`, `box-shadow`, `fill`). **Nunca** animar `all` o dimensiones (`width`, `height`, `margin`) vía CSS puro si hay Framer Motion presente.
- **Aceleración GPU:** Usar `will-change: transform, opacity` en listas dinámicas pesadas.

### Formularios, Inputs y Filtros
- Fondos sólidos con `var(--card-bg-solid)` o bordes sutiles.
- **Focus States:** Anillo de foco (Focus Ring) consistente, brillante, usualmente `var(--accent-glow)` o blanco semi-transparente, usando `box-shadow`. Outline desactivado (`outline: none`).
- Sin labels flotantes animados innecesarios; usar diseño clásico con labels claros (`--text-secondary`) y placeholders.

### Componentes Nativos (Expo / UI Thread)
- Todos residen en `src/native/`.
- **Rendimiento:** 100% de animaciones de layout y gestos (Drag/Swipe) deben correr en el UI Thread vía `react-native-reanimated`. Prohibido `setState` durante los callbacks de gestos continuos.
- **Feedback Haptico:** Obligatorio en interacciones de éxito, selección de tabs (IconBar) o umbrales de gestos (Swipe to delete).

---

## 4. REGLAS CONTRACTUALES PARA LOS AGENTES (MCP / LLMs)

1. **PROHIBIDO EL USO DE FRAMEWORKS CSS EXTERNOS O TAILWIND.** Toda estilización debe usar las variables CSS definidas en `index.css` de este repositorio. No se debe insertar clases de Tailwind (`flex`, `h-4`, etc.).
2. **Prohibido el uso de estilos en línea (`style={{}}`) para diseño estructural.** Los estilos en línea solo están permitidos para variables dinámicas (ej. calcular un `transform` basado en el puntero) o props de Framer Motion.
3. **Motion CSS Aislado:** Nunca aplicar `transition: all` a elementos interactivos manejados por JS/Framer Motion. Limitar CSS transitions a `opacity`, `background-color`, `border-color` y `box-shadow`.
4. **Accesibilidad:** Mantener contrastes altos (WCAG AA mínimo). Las insignias (badges) y botones oscuros sobre fondos oscuros siempre deben tener bordes sutiles (`border: 1px solid var(--border)`).
5. **Estructura Modular Restricta:** Los componentes de UI reutilizables deben residir en `src/components/ui/` (web) o `src/native/` (expo). Las vistas completas residen en `src/pages/`.
6. **No "Jelly" FX:** Al remover, crear o filtrar elementos de listas (como Tickets), usar `AnimatePresence` con fade puro o scale muy sutil. Evitar `layout="position"` o `layout` si este deforma el Bounding Box del elemento. 
7. **Single Source of Truth:** Este archivo (`DESIGN.md`) junto a `index.css` dictan la ley visual. En caso de duda, apegarse al contraste, tipografía limpia y animaciones instantáneas-fluidas.
