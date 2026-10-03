import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

/**
 * Dropdown (Expo / React Native)
 *
 * Componente nativo de selección desplegable de alto rendimiento en el UI Thread (60/120fps),
 * con rebote elástico (spring physics), animación de flecha (rotación y desplazamiento vertical),
 * feedback táctil de presión y háptica integrada al seleccionar.
 *
 * Diseñado conforme a los estándares de /animate-expo y DESIGN.md.
 *
 * @param {Object} props
 * @param {Array<{ value: string|number, label: string, icon?: React.ComponentType, badge?: string|number, color?: string }>} props.options
 * @param {string|number|Array<string|number>} props.value - Valor o array seleccionado.
 * @param {(val: any) => void} props.onChange - Callback de selección.
 * @param {string} [props.placeholder='Seleccionar opción...']
 * @param {string} [props.label] - Etiqueta superior accesible.
 * @param {boolean} [props.multiSelect=false]
 * @param {boolean} [props.showSearch=false]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.error]
 * @param {boolean} [props.fullWidth=false]
 * @param {import('react-native').ViewStyle} [props.style]
 */
export function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Seleccionar opción...',
  label,
  multiSelect = false,
  showSearch = false,
  disabled = false,
  error,
  fullWidth = false,
  style,
}) {
  const reducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Shared values para mantener la animación en el UI Thread
  const pressScale = useSharedValue(1);
  const openProgress = useSharedValue(0);

  // Animación del trigger al presionar (física de rebote interactivo idéntica a StatefulButton/IconBar)
  const handlePressIn = useCallback(() => {
    if (disabled) return;
    const targetScale = reducedMotion ? 1 : 0.97;
    pressScale.set(withTiming(targetScale, { duration: 120 }));
  }, [disabled, reducedMotion, pressScale]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    pressScale.set(withSpring(1, { duration: 300, dampingRatio: 0.85 }));
  }, [disabled, pressScale]);

  const toggleOpen = useCallback(() => {
    if (disabled) return;
    Haptics.selectionAsync().catch(() => {});

    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        openProgress.set(
          reducedMotion
            ? 1
            : withSpring(1, {
                duration: 350,
                dampingRatio: 0.82,
              })
        );
      } else {
        openProgress.set(
          reducedMotion
            ? 0
            : withTiming(0, {
                duration: 200,
              })
        );
        setSearchTerm('');
      }
      return next;
    });
  }, [disabled, reducedMotion, openProgress]);

  const closeDropdown = useCallback(() => {
    openProgress.set(
      reducedMotion
        ? 0
        : withTiming(0, {
            duration: 180,
          })
    );
    setIsOpen(false);
    setSearchTerm('');
  }, [reducedMotion, openProgress]);

  const handleSelectOption = useCallback(
    (optionValue) => {
      if (disabled) return;
      Haptics.selectionAsync().catch(() => {});

      if (multiSelect) {
        const currentVals = Array.isArray(value) ? [...value] : [];
        const index = currentVals.indexOf(optionValue);
        let updated;
        if (index > -1) {
          updated = currentVals.filter((v) => v !== optionValue);
        } else {
          updated = [...currentVals, optionValue];
        }
        onChange?.(updated);
      } else {
        onChange?.(optionValue);
        closeDropdown();
      }
    },
    [disabled, multiSelect, value, onChange, closeDropdown]
  );

  const handleRemoveTag = useCallback(
    (tagValue) => {
      if (disabled || !multiSelect || !Array.isArray(value)) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const updated = value.filter((v) => v !== tagValue);
      onChange?.(updated);
    },
    [disabled, multiSelect, value, onChange]
  );

  // Medición de posición del botón trigger para alinear el overlay flotante
  const onTriggerLayout = (event) => {
    event.target.measure?.((x, y, width, height, pageX, pageY) => {
      setTriggerLayout({ x: pageX, y: pageY, width, height });
    });
  };

  // Normalizador inteligente: insensible a acentos, mayúsculas, espacios y caracteres especiales
  const normalizeSearchText = (text) => {
    if (!text) return '';
    return String(text)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  };

  // Opciones filtradas
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const normalizedTerm = normalizeSearchText(searchTerm);
    if (!normalizedTerm) return options;

    return options.filter((opt) => {
      const normalizedLabel = normalizeSearchText(opt.label);
      const normalizedValue = normalizeSearchText(opt.value);
      return (
        normalizedLabel.includes(normalizedTerm) ||
        normalizedValue.includes(normalizedTerm)
      );
    });
  }, [options, searchTerm]);

  // Estilo animado de rebote al dar clic al trigger
  const animatedTriggerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.get() }],
    };
  });

  // Animación de la flecha: rotación 180deg y traslación vertical hacia arriba (-3pt)
  const animatedArrowStyle = useAnimatedStyle(() => {
    const p = openProgress.get();
    const rotate = interpolate(p, [0, 1], [0, 180]);
    const translateY = interpolate(p, [0, 1], [0, -2], Extrapolation.CLAMP);

    return {
      transform: [{ translateY }, { rotate: `${rotate}deg` }],
    };
  });

  // Animación del contenedor del menú desplegable: escala y opacidad con rebote
  const animatedMenuStyle = useAnimatedStyle(() => {
    const p = openProgress.get();
    return {
      opacity: p,
      transform: [
        {
          scale: reducedMotion
            ? 1
            : interpolate(p, [0, 1], [0.95, 1], Extrapolation.CLAMP),
        },
        {
          translateY: interpolate(p, [0, 1], [-8, 0], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const selectedOption = useMemo(() => {
    if (multiSelect) return null;
    return options.find((o) => o.value === value);
  }, [multiSelect, options, value]);

  return (
    <View style={[styles.root, fullWidth && styles.fullWidth, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Botón Trigger interactivo */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        accessibilityState={{ expanded: isOpen, disabled }}
        disabled={disabled}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        pressRetentionOffset={16}
        onLayout={onTriggerLayout}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={toggleOpen}
        style={[styles.outerPressable, fullWidth && styles.fullWidth]}
      >
        <Animated.View
          style={[
            styles.trigger,
            isOpen && styles.triggerOpen,
            error && styles.triggerError,
            disabled && styles.triggerDisabled,
            animatedTriggerStyle,
          ]}
        >
          {/* Contenido del trigger */}
          <View style={styles.triggerContent}>
            {multiSelect ? (
              Array.isArray(value) && value.length > 0 ? (
                <View style={styles.tagsContainer}>
                  {value.map((val) => {
                    const opt = options.find((o) => o.value === val);
                    const tagLabel = opt ? opt.label : String(val);
                    return (
                      <View key={val} style={styles.tag}>
                        <Text style={styles.tagText} numberOfLines={1}>
                          {tagLabel}
                        </Text>
                        <Pressable
                          hitSlop={8}
                          onPress={() => handleRemoveTag(val)}
                          style={styles.tagRemove}
                        >
                          <Text style={styles.tagRemoveText}>✕</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.placeholderText} numberOfLines={1}>
                  {placeholder}
                </Text>
              )
            ) : selectedOption ? (
              <View style={styles.selectedRow}>
                {selectedOption.icon && (
                  <View style={styles.iconSlot}>
                    <selectedOption.icon size={16} color={selectedOption.color || '#f4f4f5'} />
                  </View>
                )}
                <Text style={styles.selectedText} numberOfLines={1}>
                  {selectedOption.label}
                </Text>
              </View>
            ) : (
              <Text style={styles.placeholderText} numberOfLines={1}>
                {placeholder}
              </Text>
            )}
          </View>

          {/* Flecha animada (rotación y movimiento hacia arriba) */}
          <Animated.View style={[styles.arrowSlot, animatedArrowStyle]}>
            <Text style={styles.arrowIcon}>▼</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Modal flotante transparente para capturar clics fuera y posicionar el menú */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={closeDropdown}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeDropdown}>
          <Pressable
            style={[
              styles.floatingMenuWrapper,
              {
                top: triggerLayout.y + triggerLayout.height + 6,
                left: triggerLayout.x,
                width: Math.max(triggerLayout.width, 220),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Animated.View style={[styles.menu, animatedMenuStyle]}>
              {/* Buscador interno opcional */}
              {showSearch && (
                <View style={styles.searchBox}>
                  <TextInput
                    style={styles.searchInput}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    placeholder="Buscar opción..."
                    placeholderTextColor="#71717a"
                    autoFocus
                  />
                </View>
              )}

              {/* Lista con scroll */}
              <ScrollView
                style={styles.optionsScrollView}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {filteredOptions.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No hay resultados</Text>
                  </View>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = multiSelect
                      ? Array.isArray(value) && value.includes(opt.value)
                      : value === opt.value;
                    const IconComponent = opt.icon;

                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => handleSelectOption(opt.value)}
                        style={({ pressed }) => [
                          styles.optionItem,
                          isSelected && styles.optionItemSelected,
                          pressed && styles.optionItemPressed,
                        ]}
                      >
                        <View style={styles.optionMain}>
                          {IconComponent && (
                            <View style={styles.optionIconSlot}>
                              <IconComponent
                                size={16}
                                color={opt.color || (isSelected ? '#9333ea' : '#a1a1aa')}
                              />
                            </View>
                          )}
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {opt.label}
                          </Text>
                          {opt.badge !== undefined && (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{opt.badge}</Text>
                            </View>
                          )}
                        </View>

                        {isSelected && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  outerPressable: {
    alignSelf: 'flex-start',
  },
  trigger: {
    minHeight: 46, // Touch target ergonómico
    minWidth: 160,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  triggerOpen: {
    borderColor: '#9333ea',
    shadowColor: '#9333ea',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  triggerError: {
    borderColor: '#ef4444',
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerContent: {
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#71717a',
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSlot: {
    marginRight: 8,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c084fc',
    marginRight: 4,
  },
  tagRemove: {
    padding: 2,
  },
  tagRemoveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c084fc',
  },
  arrowSlot: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  floatingMenuWrapper: {
    position: 'absolute',
    maxHeight: 280,
  },
  menu: {
    backgroundColor: 'rgba(24, 24, 27, 0.95)',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: 270,
  },
  searchBox: {
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 6,
    marginBottom: 4,
  },
  searchInput: {
    backgroundColor: '#121215',
    color: '#ffffff',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  optionsScrollView: {
    maxHeight: 210,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 13,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 40,
  },
  optionItemSelected: {
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
  },
  optionItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconSlot: {
    marginRight: 8,
  },
  optionLabel: {
    fontSize: 14,
    color: '#d4d4d8',
    fontWeight: '400',
  },
  optionLabelSelected: {
    color: '#c084fc',
    fontWeight: '600',
  },
  badge: {
    marginLeft: 8,
    backgroundColor: '#27272a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a1a1aa',
  },
  checkmark: {
    color: '#c084fc',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default Dropdown;
