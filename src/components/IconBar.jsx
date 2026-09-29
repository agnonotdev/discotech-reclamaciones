import { useState, useRef, useLayoutEffect } from "react";
import "./IconBar.css";

/**
 * IconBar (Bencho UI adaptation con calibración de resorte y micro-interacciones)
 *
 * Movimiento elástico ininterrumpido:
 * - Calibración del indicador a 300ms cubic-bezier(0.23, 1, 0.32, 1).
 * - Soporta micro-squash al presionar (onPointerDown).
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
  const [indicatorMetrics, setIndicatorMetrics] = useState(null);
  const [isPressing, setIsPressing] = useState(false);

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
        setIndicatorMetrics(metrics);
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

    setIndicatorMetrics(nextMetrics);
  };

  const activeItem = items.find((item) => item.key === currentKey);
  const activeColor = activeItem?.color || "var(--accent)";

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
      {/* Indicador con transición calibrada a 300ms y glass dinámico según estado */}
      <span
        className="gnav-ind"
        style={{
          "--ind-x": indicatorMetrics ? `${indicatorMetrics.left}px` : "0px",
          width: indicatorMetrics ? `${indicatorMetrics.width}px` : "0px",
          opacity: indicatorMetrics ? 1 : 0,
          "--ind-color": activeColor,
        }}
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
