import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useReducedMotion,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * StatefulButton (Expo / React Native)
 *
 * Botón nativo interactivo con feedback de presión inmediato en el UI thread,
 * morfismo fluido entre estados (idle -> loading -> success), y respuesta háptica.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Etiqueta o contenido del botón.
 * @param {string} [props.label] - Texto opcional si no se usa children.
 * @param {React.ComponentType} [props.icon] - Componente de icono opcional.
 * @param {() => Promise<void> | void} [props.onPress] - Callback al presionar.
 * @param {boolean} [props.disabled=false] - Inhabilitar interacción.
 * @param {'idle' | 'loading' | 'success'} [props.status] - Estado controlado opcional.
 * @param {'primary' | 'secondary' | 'success' | 'danger'} [props.variant='primary'] - Estilo visual.
 * @param {boolean} [props.fullWidth=false] - Si debe expandirse al 100% del contenedor.
 * @param {import('react-native').ViewStyle} [props.style] - Estilos adicionales de contenedor.
 * @param {import('react-native').TextStyle} [props.textStyle] - Estilos adicionales de texto.
 */
export function StatefulButton({
  children,
  label,
  icon: IconComponent = null,
  onPress,
  disabled = false,
  status: controlledStatus,
  variant = 'primary',
  fullWidth = false,
  style,
  textStyle,
  ...pressableProps
}) {
  const reducedMotion = useReducedMotion();
  const [internalStatus, setInternalStatus] = useState('idle');
  const isMounted = useRef(true);
  const resetTimer = useRef(null);

  const currentStatus = controlledStatus !== undefined ? controlledStatus : internalStatus;
  const isBusy = currentStatus === 'loading';

  // Shared values para mantener la interacción y el morfismo estrictamente en el UI thread
  const pressScale = useSharedValue(1);
  const idleProgress = useSharedValue(currentStatus === 'idle' ? 1 : 0);
  const loadingProgress = useSharedValue(currentStatus === 'loading' ? 1 : 0);
  const successProgress = useSharedValue(currentStatus === 'success' ? 1 : 0);

  // Manejo de ciclo de vida para temporizador de reseteo
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  // Sincronización precisa entre estados sin parpadeo cruzado
  useEffect(() => {
    if (currentStatus === 'loading') {
      idleProgress.set(withTiming(0, { duration: 150, easing: EASE_OUT }));
      loadingProgress.set(withTiming(1, { duration: 180, easing: EASE_OUT }));
      successProgress.set(withTiming(0, { duration: 150, easing: EASE_OUT }));
    } else if (currentStatus === 'success') {
      idleProgress.set(withTiming(0, { duration: 150, easing: EASE_OUT }));
      loadingProgress.set(withTiming(0, { duration: 150, easing: EASE_OUT }));
      successProgress.set(withTiming(1, { duration: 200, easing: EASE_OUT }));

      // Respuesta háptica de éxito en el momento causal
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      idleProgress.set(withTiming(1, { duration: 180, easing: EASE_OUT }));
      loadingProgress.set(withTiming(0, { duration: 150, easing: EASE_OUT }));
      successProgress.set(withTiming(0, { duration: 150, easing: EASE_OUT }));
    }
  }, [currentStatus, idleProgress, loadingProgress, successProgress]);

  const handlePressIn = useCallback(() => {
    if (disabled || isBusy) return;
    const targetScale = reducedMotion ? 1 : 0.97;
    pressScale.set(withTiming(targetScale, { duration: 120, easing: EASE_OUT }));
  }, [disabled, isBusy, reducedMotion, pressScale]);

  const handlePressOut = useCallback(() => {
    pressScale.set(withTiming(1, { duration: 120, easing: EASE_OUT }));
  }, [pressScale]);

  const handlePress = useCallback(async (event) => {
    if (disabled || isBusy) return;
    if (!onPress) return;

    try {
      const result = onPress(event);
      if (result && typeof result.then === 'function' && controlledStatus === undefined) {
        setInternalStatus('loading');
        await result;
        if (isMounted.current) {
          setInternalStatus('success');
          resetTimer.current = setTimeout(() => {
            if (isMounted.current) {
              setInternalStatus('idle');
            }
          }, 1800);
        }
      }
    } catch (err) {
      if (isMounted.current && controlledStatus === undefined) {
        setInternalStatus('idle');
      }
      throw err;
    }
  }, [disabled, isBusy, onPress, controlledStatus]);

  // Estilo animado para feedback de presión táctil
  const animatedPressStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.get() }],
    };
  });

  // Estilo animado para el contenido idle (nunca scale(0))
  const animatedContentStyle = useAnimatedStyle(() => {
    const p = idleProgress.get();
    return {
      opacity: p,
      transform: [
        {
          scale: reducedMotion
            ? 1
            : interpolate(p, [0, 1], [0.95, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  // Estilo animado para el loader (opacidad y micro-escala independientes)
  const animatedLoaderStyle = useAnimatedStyle(() => {
    const p = loadingProgress.get();
    return {
      opacity: p,
      transform: [
        {
          scale: reducedMotion
            ? 1
            : interpolate(p, [0, 1], [0.95, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  // Estilo animado para el checkmark y texto de éxito
  const animatedSuccessStyle = useAnimatedStyle(() => {
    const p = successProgress.get();
    return {
      opacity: p,
      transform: [
        {
          scale: reducedMotion
            ? 1
            : interpolate(p, [0, 1], [0.95, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const buttonText = label || children;
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const isInteractive = !disabled && !isBusy;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: isBusy }}
      disabled={!isInteractive}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      pressRetentionOffset={16}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.outerPressable,
        fullWidth && styles.fullWidth,
      ]}
      {...pressableProps}
    >
      <Animated.View
        style={[
          styles.buttonBase,
          variantStyle.button,
          disabled && styles.disabledButton,
          fullWidth && styles.fullWidth,
          animatedPressStyle,
          style,
        ]}
      >
        {/* Contenido principal (Texto e Icono opcional) */}
        <Animated.View style={[styles.innerRow, animatedContentStyle]}>
          {IconComponent && (
            <View style={styles.iconMargin}>
              <IconComponent size={18} color={variantStyle.textColor} />
            </View>
          )}
          {typeof buttonText === 'string' ? (
            <Text
              style={[
                styles.textBase,
                { color: variantStyle.textColor },
                disabled && styles.disabledText,
                textStyle,
              ]}
              numberOfLines={1}
            >
              {buttonText}
            </Text>
          ) : (
            buttonText
          )}
        </Animated.View>

        {/* Capa de Loading en UI Thread */}
        <Animated.View
          pointerEvents="none"
          style={[styles.overlayCenter, animatedLoaderStyle]}
        >
          <ActivityIndicator color={variantStyle.textColor} size="small" />
        </Animated.View>

        {/* Capa de Success en UI Thread */}
        <Animated.View
          pointerEvents="none"
          style={[styles.overlayCenter, animatedSuccessStyle]}
        >
          <View style={styles.successRow}>
            <Text style={[styles.successCheckmark, { color: variantStyle.textColor }]}>
              ✓
            </Text>
            <Text style={[styles.textBase, { color: variantStyle.textColor, marginLeft: 6 }]}>
              Listo
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const VARIANT_STYLES = {
  primary: {
    button: {
      backgroundColor: '#7c3aed',
      borderColor: '#9333ea',
    },
    textColor: '#ffffff',
  },
  secondary: {
    button: {
      backgroundColor: '#27272a',
      borderColor: '#3f3f46',
    },
    textColor: '#f4f4f5',
  },
  success: {
    button: {
      backgroundColor: '#16a34a',
      borderColor: '#22c55e',
    },
    textColor: '#ffffff',
  },
  danger: {
    button: {
      backgroundColor: '#dc2626',
      borderColor: '#ef4444',
    },
    textColor: '#ffffff',
  },
};

const styles = StyleSheet.create({
  outerPressable: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  buttonBase: {
    minHeight: 44, // Garantiza 44pt touch target mínimo
    minWidth: 44,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.5,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: 8,
  },
  textBase: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  disabledText: {
    opacity: 0.8,
  },
  overlayCenter: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheckmark: {
    fontSize: 18,
    fontWeight: '800',
  },
});

export default StatefulButton;
