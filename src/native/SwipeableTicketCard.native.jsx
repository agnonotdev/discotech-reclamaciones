import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';

const SWIPE_THRESHOLD = 90;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Proyección de momentum para determinar si un flick rápido califica como confirmación.
 * Apple exponential-decay form.
 */
function project(velocity, decelerationRate = 0.998) {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Resistencia elástica al intentar arrastrar en dirección contraria o fuera de límites.
 */
function rubberband(overshoot, dimension, constant = 0.55) {
  'worklet';
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * SwipeableTicketCard (Expo / React Native)
 *
 * Tarjeta de ticket para gestión de reclamaciones con deslizamiento nativo (Gesture.Pan)
 * para eliminar, resistencia elástica en límites, umbral combinado distancia+velocidad,
 * animación de salida a 60/120fps y respuesta háptica táctil (ImpactFeedbackStyle.Medium).
 *
 * @param {Object} props
 * @param {Object} props.ticket - Datos de la reclamación.
 * @param {string} props.ticket.id - ID del documento.
 * @param {string} [props.ticket.radicado] - Código de radicado.
 * @param {string} [props.ticket.tipo] - Tipo de solicitud ('Reclamo', 'Queja', etc.).
 * @param {string} [props.ticket.nombre] - Nombre del cliente.
 * @param {string} [props.ticket.email] - Correo electrónico del cliente.
 * @param {string} [props.ticket.mensaje] - Detalle del ticket.
 * @param {string} [props.ticket.estado] - Estado actual ('Nuevo', 'En proceso', 'Resuelto').
 * @param {any} [props.ticket.createdAt] - Fecha de creación.
 * @param {(ticketId: string) => void} props.onDelete - Callback al confirmar la eliminación por swipe.
 * @param {import('react-native').ViewStyle} [props.style] - Estilos adicionales para la tarjeta.
 */
export function SwipeableTicketCard({
  ticket,
  onDelete,
  style,
}) {
  const reducedMotion = useReducedMotion();
  const { width: windowWidth } = useWindowDimensions();
  const dismissDistance = windowWidth * 1.05;

  // Extraer ID primitivo para coincidencia exacta de dependencias con React Compiler
  const ticketId = ticket?.id ?? '';

  // Shared values para el desplazamiento horizontal y contexto del gesto
  const x = useSharedValue(0);
  const context = useSharedValue(0);

  // Gesto Pan encapsulado con useMemo y activeOffsetX para no interferir con el scroll vertical
  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-10, 10]) // Requiere intención horizontal clara antes de capturar el toque
      .onStart(() => {
        'worklet';
        context.set(x.get());
      })
      .onUpdate((e) => {
        'worklet';
        const rawNext = context.get() + e.translationX;
        // Si se arrastra hacia la derecha (positivo), aplicar resistencia elástica
        if (rawNext > 0) {
          x.set(rubberband(rawNext, 100));
        } else {
          // Desplazamiento hacia la izquierda con seguimiento fluido 1:1
          x.set(rawNext);
        }
      })
      .onEnd((e) => {
        'worklet';
        // Determinar si confirma por distancia o velocidad (flick rápido)
        const projected = x.get() + project(e.velocityX);

        if (projected < -SWIPE_THRESHOLD || x.get() < -SWIPE_THRESHOLD) {
          // Confirmación de eliminación: disparar háptica de impacto medio en causal moment
          scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Medium);

          const exitDistance = -dismissDistance;
          if (reducedMotion) {
            x.set(exitDistance);
            if (onDelete) {
              scheduleOnRN(onDelete, ticketId);
            }
          } else {
            x.set(
              withTiming(
                exitDistance,
                { duration: 200, easing: EASE_OUT },
                (finished) => {
                  'worklet';
                  if (finished && onDelete) {
                    scheduleOnRN(onDelete, ticketId);
                  }
                }
              )
            );
          }
        } else {
          // Regreso elástico si no se superó el umbral
          if (reducedMotion) {
            x.set(0);
          } else {
            x.set(
              withSpring(0, {
                duration: 300,
                dampingRatio: 1,
                velocity: e.velocityX,
              })
            );
          }
        }
      });
  }, [x, context, reducedMotion, dismissDistance, onDelete, ticketId]);

  // Estilo animado de la tarjeta frontal
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: x.get() }],
    };
  });

  // Estilo animado para el contenedor de acción (oculto cuando se arrastra hacia la derecha)
  const underlayContainerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      x.get(),
      [-20, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
    };
  });

  // Estilo animado para el contenido de fondo (revelación progresiva y escalado sin scale(0))
  const underlayAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      x.get(),
      [-120, -20],
      [1, 0],
      Extrapolation.CLAMP
    );
    const scale = reducedMotion
      ? 1
      : interpolate(x.get(), [-140, -40], [1, 0.92], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const status = ticket?.estado || 'Nuevo';
  const statusConfig = STATUS_CONFIGS[status] || STATUS_CONFIGS.Nuevo;

  return (
    <View style={[styles.container, style]}>
      {/* Fondo de acción: Eliminar (oculto en arrastre inverso) */}
      <Animated.View style={[styles.underlay, underlayContainerAnimatedStyle]}>
        <Animated.View style={[styles.underlayContent, underlayAnimatedStyle]}>
          <Text style={styles.underlayIcon}>🗑</Text>
          <Text style={styles.underlayText}>Eliminar</Text>
        </Animated.View>
      </Animated.View>

      {/* Tarjeta interactiva sobre el UI thread */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          <View style={styles.cardHeader}>
            <View style={styles.radicadoBadge}>
              <Text style={styles.radicadoText}>{ticket?.radicado || 'S/R'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {status}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.ticketType}>{ticket?.tipo || 'Reclamación'}</Text>
            <Text style={styles.clientName} numberOfLines={1}>
              {ticket?.nombre || 'Anónimo'}
            </Text>
            <Text style={styles.clientEmail} numberOfLines={1}>
              {ticket?.email || 'Sin correo registrado'}
            </Text>
            {ticket?.mensaje ? (
              <Text style={styles.ticketMessage} numberOfLines={3}>
                {ticket.mensaje}
              </Text>
            ) : null}
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.swipeHint}>← Desliza para eliminar</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const STATUS_CONFIGS = {
  Nuevo: {
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
  },
  'En proceso': {
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.12)',
  },
  Resuelto: {
    color: '#4ade80',
    bg: 'rgba(74, 222, 128, 0.12)',
  },
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  underlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 24,
    borderRadius: 16,
  },
  underlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  underlayIcon: {
    fontSize: 20,
    color: '#ffffff',
    marginRight: 6,
  },
  underlayText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  card: {
    backgroundColor: '#1c1c1f',
    borderWidth: 1,
    borderColor: '#2e2e33',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  radicadoBadge: {
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  radicadoText: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 8,
  },
  ticketType: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  clientName: {
    color: '#f4f4f5',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  clientEmail: {
    color: '#a1a1aa',
    fontSize: 13,
    marginBottom: 8,
  },
  ticketMessage: {
    color: '#d4d4d8',
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 6,
    alignItems: 'flex-end',
  },
  swipeHint: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '500',
  },
});

export default SwipeableTicketCard;
