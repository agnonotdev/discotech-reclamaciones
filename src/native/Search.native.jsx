import { useState, useRef, useCallback } from 'react';
import {
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const COLLAPSED_SIZE = 44; // Touch target nativo de 44x44pt
const DEFAULT_EXPANDED_WIDTH = 260;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Search (Expo / React Native)
 *
 * Buscador expansible 100% nativo operando en el UI thread mediante Reanimated SharedValues.
 * Elimina totalmente el loop de JavaScript requestAnimationFrame (RAF), garantizando
 * 60/120fps sostenidos, feedback táctil inmediato y soporte para useReducedMotion.
 *
 * @param {Object} props
 * @param {number} [props.width=260] - Ancho del campo una vez expandido.
 * @param {string} [props.placeholder='Buscar...'] - Texto del placeholder.
 * @param {(query: string) => void} [props.onSearch] - Callback al cambiar o enviar el término.
 * @param {import('react-native').ViewStyle} [props.style] - Estilos adicionales de contenedor.
 */
export function Search({
  width = DEFAULT_EXPANDED_WIDTH,
  placeholder = 'Buscar...',
  onSearch,
  style,
}) {
  const reducedMotion = useReducedMotion();
  const inputRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Shared values para morphing de ancho y opacidad en el UI Thread
  const widthVal = useSharedValue(COLLAPSED_SIZE);
  const expansionProgress = useSharedValue(0); // 0 colapsado, 1 expandido
  const pressScale = useSharedValue(1);

  // Apertura interactiva
  const handleOpen = useCallback(() => {
    if (isOpen) return;

    // Disparar háptica ligera en causal moment
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsOpen(true);

    if (reducedMotion) {
      widthVal.set(width);
      expansionProgress.set(1);
    } else {
      widthVal.set(
        withSpring(width, {
          duration: 280,
          dampingRatio: 1,
          overshootClamping: true,
        })
      );
      expansionProgress.set(withTiming(1, { duration: 220, easing: EASE_OUT }));
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [isOpen, width, reducedMotion, widthVal, expansionProgress]);

  // Cierre interactivo
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    setIsOpen(false);
    setQuery('');

    if (reducedMotion) {
      widthVal.set(COLLAPSED_SIZE);
      expansionProgress.set(0);
    } else {
      widthVal.set(
        withSpring(COLLAPSED_SIZE, {
          duration: 260,
          dampingRatio: 1,
          overshootClamping: true,
        })
      );
      expansionProgress.set(withTiming(0, { duration: 180, easing: EASE_OUT }));
    }

    if (onSearch) {
      onSearch('');
    }
  }, [reducedMotion, widthVal, expansionProgress, onSearch]);

  const handleChangeText = useCallback(
    (text) => {
      setQuery(text);
      if (onSearch) {
        onSearch(text);
      }
    },
    [onSearch]
  );

  const handlePressIn = useCallback(() => {
    if (reducedMotion) return;
    pressScale.set(withTiming(0.96, { duration: 100, easing: EASE_OUT }));
  }, [reducedMotion, pressScale]);

  const handlePressOut = useCallback(() => {
    if (reducedMotion) return;
    pressScale.set(withTiming(1, { duration: 120, easing: EASE_OUT }));
  }, [reducedMotion, pressScale]);

  // Estilo del contenedor que anima el ancho y micro-escala
  const animatedBoxStyle = useAnimatedStyle(() => {
    return {
      width: widthVal.get(),
      transform: [{ scale: pressScale.get() }],
    };
  });

  // Estilo animado para el input y botón de borrado (nunca scale(0))
  const animatedFieldStyle = useAnimatedStyle(() => {
    const p = expansionProgress.get();
    const opacity = interpolate(p, [0.3, 1], [0, 1], Extrapolation.CLAMP);
    const scale = reducedMotion
      ? 1
      : interpolate(p, [0.3, 1], [0.95, 1], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedBoxStyle, style]}>
      {/* Botón o icono de búsqueda */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isOpen ? 'Buscar' : 'Abrir buscador'}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPressIn={!isOpen ? handlePressIn : undefined}
        onPressOut={!isOpen ? handlePressOut : undefined}
        onPress={!isOpen ? handleOpen : undefined}
        style={styles.iconSlot}
      >
        <Text style={styles.lensGlyph}>🔍</Text>
      </Pressable>

      {/* Campo de texto en UI Thread con transición fluida bidireccional */}
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        aria-hidden={!isOpen}
        style={[styles.fieldContainer, animatedFieldStyle]}
      >
        <TextInput
          ref={inputRef}
          accessibilityRole="search"
          accessibilityLabel={placeholder}
          placeholder={placeholder}
          placeholderTextColor="#71717a"
          value={query}
          onChangeText={handleChangeText}
          onSubmitEditing={() => onSearch && onSearch(query)}
          returnKeyType="search"
          editable={isOpen}
          style={styles.input}
        />

        {/* Botón de limpiar / cerrar */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar búsqueda"
          disabled={!isOpen}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={handleClose}
          style={styles.closeSlot}
        >
          <Text style={styles.closeGlyph}>✕</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: COLLAPSED_SIZE,
    borderRadius: COLLAPSED_SIZE / 2,
    backgroundColor: '#1E1724',
    borderWidth: 1,
    borderColor: '#2C2826',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  iconSlot: {
    width: COLLAPSED_SIZE,
    height: COLLAPSED_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  lensGlyph: {
    fontSize: 16,
    color: '#9B59E0',
  },
  fieldContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  input: {
    flex: 1,
    color: '#F5F0E8',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    paddingHorizontal: 4,
    height: COLLAPSED_SIZE,
  },
  closeSlot: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: 'rgba(155, 89, 224, 0.18)',
  },
  closeGlyph: {
    fontSize: 12,
    color: '#9B59E0',
    fontWeight: '700',
  },
});

export default Search;
