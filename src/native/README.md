# Discotech Reclamaciones — Suite de Componentes Nativos (Expo SDK 52+)

Esta carpeta contiene la implementación nativa para **Expo / React Native** de la suite de componentes interactivos de Discotech Reclamaciones, construida bajo los estándares estrictos de rendimiento a 60/120fps en el UI Thread detallados en `/animate-expo`.

---

## 1. Dependencias Requeridas

Para integrar estos componentes en una aplicación Expo (SDK 52+ o superior con la Nueva Arquitectura activada), instala las dependencias mediante el CLI de Expo para garantizar compatibilidad de versiones:

```bash
npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler expo-haptics
```

> **Nota sobre Babel y Worklets:** En proyectos Expo modernos con `babel-preset-expo`, el plugin de worklets se configura automáticamente. Si se usa una configuración personalizada, asegúrate de que el plugin de worklets esté habilitado.

---

## 2. Configuración en la Raíz de la Aplicación

Para que los gestos de `react-native-gesture-handler` funcionen adecuadamente en iOS y Android sin bloquear eventos táctiles o scrolls, envuelve el punto de entrada o el layout raíz (`app/_layout.tsx` en Expo Router o `App.js`):

```jsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Tu árbol de navegación o contenido */}
    </GestureHandlerRootView>
  );
}
```

Para soporte de pantallas ProMotion a 120fps en iOS, verifica en `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "CADisableMinimumFrameDurationOnPhone": true
      }
    }
  }
}
```

---

## 3. Principios de Arquitectura y Rendimiento (UI Thread)

1. **Ejecución 100% en el UI Thread**: Toda la interacción física continua corre mediante Worklets en el hilo de UI sin cruzar el puente de JavaScript por cada frame.
2. **Cero `setState` en Gestos o Animaciones Continuas**: `useSharedValue` y `useAnimatedStyle` manejan transformaciones y opacidades directamente en memoria gráfica.
3. **Acceso Compatible con React Compiler**: Se utilizan `.get()` y `.set()` en lugar del acceso directo a `.value`, según la recomendación oficial de Reanimated 4.
4. **`scheduleOnRN`**: Reemplazo moderno y seguro de `runOnJS` para coordinar llamadas de regreso al runtime de React Native desde worklets (`react-native-worklets`).
5. **No `scale(0)`**: Las transiciones inician desde escalas naturales (`0.95` a `0.97`) combinadas con opacidad, previniendo artefactos visuales.
6. **Físicas Calibradas (Spring vs Timing)**:
   - Todo lo que un dedo arrastra o toca utiliza física de resorte (`withSpring({ duration: 300, dampingRatio: 0.85 })`) con proyección de momento (*velocity handoff*).
   - Las transiciones de interfaz no continuas usan curvas de aceleración `Easing.bezier(0.23, 1, 0.32, 1)`.
7. **Soporte de Movimiento Reducido (`useReducedMotion`)**: El movimiento se atenúa o desactiva automáticamente si el usuario tiene activada la preferencia de accesibilidad en su sistema operativo.
8. **Touch Targets Físicos Mínimos**: Todos los componentes respetan el estándar ergonómico de 44x44pt mínimos en iOS y 48dp en Android mediante `hitSlop` o dimensiones base.

---

## 4. Componentes Disponibles y Ejemplos de Uso

### 4.1. `StatefulButton`
Botón con micro-interacción inmediata en `onPressIn` (`scale: 0.97` en 120ms), morfismo entre estados (`idle` → `loading` → `success`) en el UI thread, y respuesta háptica con `Haptics.notificationAsync(Success)`.

```jsx
import { StatefulButton } from './src/native';

export function ActionExample() {
  const handleAsyncSubmit = async () => {
    // Si la función devuelve una promesa, el botón transiciona automáticamente
    // a loading y luego a success al resolverse
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  return (
    <StatefulButton
      variant="primary"
      onPress={handleAsyncSubmit}
    >
      Confirmar Reclamación
    </StatefulButton>
  );
}
```

### 4.2. `IconBar`
Barra segmentada con indicador flotante de resorte ininterrumpido (`dampingRatio: 0.85`), deformación elástica (*squish*: `scaleY: 0.92`, `scaleX: 1.04`) al presionar y respuesta háptica en cada selección (`Haptics.selectionAsync`).

```jsx
import { useState } from 'react';
import { IconBar } from './src/native';

const TABS = [
  { key: 'Todos', label: 'Todos', count: 12 },
  { key: 'Nuevo', label: 'Nuevos', count: 4, color: '#38bdf8' },
  { key: 'En proceso', label: 'En proceso', count: 5, color: '#fbbf24' },
  { key: 'Resuelto', label: 'Resueltos', count: 3, color: '#4ade80' },
];

export function FilterExample() {
  const [selectedTab, setSelectedTab] = useState('Todos');

  return (
    <IconBar
      items={TABS}
      value={selectedTab}
      onChange={setSelectedTab}
    />
  );
}
```

### 4.3. `SwipeableTicketCard`
Tarjeta de gestión de reclamaciones con deslizamiento nativo para eliminar mediante `Gesture.Pan()`. Incorpora resistencia elástica (*rubber-banding*), proyección de momentum (*velocity projection*) para confirmar eliminaciones por *flick* rápido, y háptica `Haptics.impactAsync(Medium)`.

```jsx
import { SwipeableTicketCard } from './src/native';

export function TicketRow({ ticket, onDelete }) {
  return (
    <SwipeableTicketCard
      ticket={ticket}
      onDelete={(id) => {
        console.log('Ticket eliminado:', id);
        onDelete(id);
      }}
    />
  );
}
```

### 4.4. `Search`
Buscador expansible con animación de ancho en UI thread (`withSpring`), eliminando cualquier `requestAnimationFrame` en JavaScript. Incluye foco automático, botón de cierre y respuesta táctil.

```jsx
import { Search } from './src/native';

export function SearchHeader({ onFilter }) {
  return (
    <Search
      width={280}
      placeholder="Buscar por radicado o cliente..."
      onSearch={(term) => onFilter(term)}
    />
  );
}
```
