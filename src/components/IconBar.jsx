import { useState, useRef, useLayoutEffect, useEffect } from "react";
import "./IconBar.css";

/**
 * IconBar (Bencho UI adaptation con física de resorte continuo / gelatina)
 *
 * Movimiento elástico ininterrumpido:
 * - Un solo paso de interpolación con cubic-bezier elástico estilo gelatina.
 * - Soporta micro-squash al presionar (onPointerDown) y estiramiento dinámico (stretch)
 *   según la distancia y dirección entre tabs.
 */
export function IconBar({
  items = [],
  value,
  onChange,
  corner = 999,
}) {
  const currentKey = value ?? items[0]?.key;
  const navRef = useRef(null);
  const itemsRef = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState(null);
  const [isPressing, setIsPressing] = useState(false);
  const lastMetrics = useRef(null);

  const getSlotMetrics = (key) => {
    const el = itemsRef.current[key];
    if (!el) return null;
    return {
      left: el.offsetLeft,
      width: el.offsetWidth,
    };
  };

  // Inicializar o ajustar en resize
  useLayoutEffect(() => {
    const measure = () => {
      const metrics = getSlotMetrics(currentKey);
      if (metrics) {
        lastMetrics.current = metrics;
        setIndicatorStyle({
          transform: `translate3d(${metrics.left}px, 0, 0)`,
          width: `${metrics.width}px`,
        });
      }
    };

    measure();

    let resizeObserver = null;
    if (navRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(navRef.current);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [currentKey]);

  const handleSelect = (key) => {
    if (key === currentKey) return;
    if (onChange) onChange(key);

    const nextMetrics = getSlotMetrics(key);
    if (!nextMetrics) return;

    lastMetrics.current = nextMetrics;
    setIndicatorStyle({
      transform: `translate3d(${nextMetrics.left}px, 0, 0)`,
      width: `${nextMetrics.width}px`,
    });
  };

  return (
    <nav
      ref={navRef}
      className="gnav"
      data-orientation="horizontal"
      data-pressing={isPressing}
      style={{
        "--gnav-r": `${corner}px`,
      }}
      aria-label="Filtro de solicitudes"
    >
      {/* Indicador con resorte continuo estilo gelatina */}
      <span
        className="gnav-ind"
        style={indicatorStyle || { opacity: 0 }}
        aria-hidden="true"
      />

      {items.map(({ key, label, Icon, count, color }) => {
        const isActive = currentKey === key;
        return (
          <button
            key={key}
            ref={(el) => {
              itemsRef.current[key] = el;
            }}
            type="button"
            className="gnav-item"
            data-active={isActive}
            data-key={key}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => handleSelect(key)}
            onPointerDown={() => setIsPressing(true)}
            onPointerUp={() => setIsPressing(false)}
            onPointerLeave={() => setIsPressing(false)}
            title={label}
            style={{
              "--item-color": color || "var(--accent)",
            }}
          >
            <span className="gnav-item-content">
              {Icon && <Icon size={16} strokeWidth={2.2} className="gnav-icon" />}
              <span className="gnav-label">{label}</span>
              {typeof count === "number" && (
                <span className="gnav-badge">{count}</span>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default IconBar;
