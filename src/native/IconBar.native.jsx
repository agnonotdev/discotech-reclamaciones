import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

/**
 * IconBar (Expo / React Native)
 *
 * Barra de pestañas segmentada nativa con indicador flotante de física elástica (withSpring),
 * respuesta háptica en cada selección (Haptics.selectionAsync), y deformación elástica (squish) al presionar.
 *
 * @param {Object} props
 * @param {Array<{ key: string, label: string, icon?: React.ComponentType, count?: number, color?: string }>} props.items
 * @param {string} props.value - Clave del elemento activo seleccionado.
 * @param {(key: string) => void} props.onChange - Callback al cambiar la selección.
 * @param {number} [props.corner=999] - Radio de curvatura del contenedor e indicador.
 * @param {import('react-native').ViewStyle} [props.style] - Estilos adicionales para la barra.
 */
export function IconBar({
  items = [],
  value,
  onChange,
  corner = 999,
  style,
}) {
  const reducedMotion = useReducedMotion();
  const currentKey = value ?? items[0]?.key;
  const isFirstLayout = useRef(true);

  // Medición de slots para posición exacta
  const [layouts, setLayouts] = useState({});

  // Shared values para el indicador en el UI Thread
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);
  const squishX = useSharedValue(1);
  const squishY = useSharedValue(1);

  // Registro de dimensiones de cada tab
  const handleItemLayout = useCallback((key, event) => {
    const { x, width } = event.nativeEvent.layout;
    setLayouts((prev) => {
      if (prev[key] && prev[key].x === x && prev[key].width === width) {
        return prev;
      }
      return { ...prev, [key]: { x, width } };
    });
  }, []);

  // Actualización del indicador flotante con física de resorte calibrada
  useEffect(() => {
    const metrics = layouts[currentKey];
    if (!metrics) return;

    indicatorOpacity.set(withTiming(1, { duration: 150 }));

    if (isFirstLayout.current) {
      isFirstLayout.current = false;
      indicatorX.set(metrics.x);
      indicatorW.set(metrics.width);
      return;
    }

    if (reducedMotion) {
      indicatorX.set(metrics.x);
      indicatorW.set(metrics.width);
    } else {
      // Física de resorte estricta con duration 300ms y dampingRatio 0.85
      indicatorX.set(
        withSpring(metrics.x, {
          duration: 300,
          dampingRatio: 0.85,
        })
      );
      indicatorW.set(
        withSpring(metrics.width, {
          duration: 300,
          dampingRatio: 0.85,
        })
      );
    }
  }, [currentKey, layouts, reducedMotion, indicatorX, indicatorW, indicatorOpacity]);

  // Manejo de squish elástico al presionar
  const handlePressIn = useCallback(() => {
    if (reducedMotion) return;
    // Deformación elástica al presionar: scaleY 0.92, scaleX 1.04
    squishX.set(withTiming(1.04, { duration: 100 }));
    squishY.set(withTiming(0.92, { duration: 100 }));
  }, [reducedMotion, squishX, squishY]);

  const handlePressOut = useCallback(() => {
    if (reducedMotion) return;
    squishX.set(withSpring(1, { duration: 300, dampingRatio: 0.85 }));
    squishY.set(withSpring(1, { duration: 300, dampingRatio: 0.85 }));
  }, [reducedMotion, squishX, squishY]);

  // Selección con respuesta háptica sincronizada al frame de impacto
  const handleSelect = useCallback(
    (key) => {
      if (key === currentKey) return;
      // Haptics.selectionAsync() para cambio de tab/selector
      Haptics.selectionAsync().catch(() => {});
      if (onChange) {
        onChange(key);
      }
    },
    [currentKey, onChange]
  );

  // Estilo animado para el indicador flotante (pill absoluto libre de relayouts)
  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: indicatorOpacity.get(),
      width: indicatorW.get(),
      transform: [
        { translateX: indicatorX.get() },
        { scaleX: squishX.get() },
        { scaleY: squishY.get() },
      ],
    };
  });

  const activeItem = items.find((item) => item.key === currentKey);
  const activeColor = activeItem?.color || '#7c3aed';

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.container,
        { borderRadius: Math.min(corner, 28) },
        style,
      ]}
    >
      {/* Indicador flotante en UI Thread con deformación squish */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          {
            borderRadius: Math.min(corner, 24),
            backgroundColor: activeColor,
          },
          animatedIndicatorStyle,
        ]}
      />

      {/* Tabs */}
      {items.map((item) => {
        const isActive = item.key === currentKey;
        const IconComponent = item.icon;

        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            onLayout={(event) => handleItemLayout(item.key, event)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => handleSelect(item.key)}
            style={styles.tabItem}
          >
            <View style={styles.tabContent}>
              {IconComponent && (
                <View style={styles.tabIcon}>
                  <IconComponent
                    size={16}
                    color={isActive ? '#ffffff' : '#a1a1aa'}
                  />
                </View>
              )}
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {typeof item.count === 'number' && (
                <View
                  style={[
                    styles.badge,
                    isActive ? styles.badgeActive : styles.badgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isActive ? styles.badgeTextActive : styles.badgeTextInactive,
                    ]}
                  >
                    {item.count}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b', // Fondo zinc oscuro
    padding: 4,
    borderWidth: 1,
    borderColor: '#27272a',
    position: 'relative',
    alignSelf: 'flex-start',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    zIndex: 1,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  tabItem: {
    minHeight: 44, // Target táctil mínimo de 44pt
    minWidth: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: '#ffffff',
  },
  tabLabelInactive: {
    color: '#a1a1aa',
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeInactive: {
    backgroundColor: '#27272a',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#ffffff',
  },
  badgeTextInactive: {
    color: '#a1a1aa',
  },
});

export default IconBar;
