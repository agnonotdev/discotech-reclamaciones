import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./StatefulButton.css";

/**
 * StatefulButton - Botón interactivo reutilizable con animaciones de estado (idle -> loading -> success).
 * Basado en la especificación de diseño de DESIGN.md y animado con Framer Motion (GPU transform y opacity).
 *
 * Props:
 * - children: Contenido o etiqueta del botón.
 * - icon: Componente de icono Lucide opcional.
 * - onClick: Callback síncrono o asíncrono (Promise).
 * - disabled: Booleano para inhabilitar interacción.
 * - status: "idle" | "loading" | "success" (estado controlado opcional).
 * - type: "submit" | "button" | "reset". Por defecto "button".
 * - className: Clases CSS complementarias.
 * - variant: "primary" (acento morado oficial) | "secondary" | "success" | "code".
 * - fullWidth: boolean para ocupar el 100% del contenedor.
 * - disableBounce: boolean para desactivar el spring al hover/tap.
 * - disableLayoutAnimation: boolean para desactivar layout animations.
 */
export function StatefulButton({
  children,
  icon: IconComponent = null,
  onClick,
  disabled = false,
  status: controlledStatus,
  type = "button",
  className = "",
  variant = "primary",
  fullWidth = false,
  disableBounce = false,
  disableLayoutAnimation = false,
  ...props
}) {
  const [internalStatus, setInternalStatus] = React.useState("idle");
  const isMounted = React.useRef(true);
  const resetTimerRef = React.useRef(null);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const currentStatus = controlledStatus !== undefined ? controlledStatus : internalStatus;
  const isBusy = currentStatus === "loading";

  const handleClick = async (event) => {
    if (disabled || isBusy) return;

    if (!onClick) return;

    try {
      const result = onClick(event);
      // Si onClick devuelve una promesa, manejar el flujo idle -> loading -> success internamente
      if (result && typeof result.then === "function" && controlledStatus === undefined) {
        setInternalStatus("loading");
        await result;
        if (isMounted.current) {
          setInternalStatus("success");
          resetTimerRef.current = window.setTimeout(() => {
            if (isMounted.current) {
              setInternalStatus("idle");
            }
          }, 1800);
        }
      }
    } catch (err) {
      if (isMounted.current && controlledStatus === undefined) {
        setInternalStatus("idle");
      }
      throw err;
    }
  };

  const variantClass = `stateful-btn-${variant}`;
  const widthClass = fullWidth ? "stateful-btn-full" : "";
  const combinedClassName = `stateful-btn ${variantClass} ${widthClass} ${className}`.trim();

  // Hay icono presente si hay IconComponent o si el estado es loading o success
  const hasIcon = Boolean(IconComponent || currentStatus === "loading" || currentStatus === "success");

  return (
    <motion.button
      layout={disableLayoutAnimation ? false : true}
      type={type}
      disabled={disabled || isBusy}
      className={combinedClassName}
      whileHover={disabled || isBusy || disableBounce ? undefined : { scale: 1.015 }}
      whileTap={disabled || isBusy || disableBounce ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={handleClick}
      {...props}
    >
      <motion.div layout={disableLayoutAnimation ? false : true} className="stateful-btn-inner">
        {hasIcon && (
          <span className="stateful-btn-icon-slot">
            <AnimatePresence mode="popLayout" initial={false}>
              {currentStatus === "loading" ? (
                <motion.span
                  key="status-loader"
                  className="stateful-btn-icon-item"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <LoaderIcon />
                </motion.span>
              ) : currentStatus === "success" ? (
                <motion.span
                  key="status-check"
                  className="stateful-btn-icon-item"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: [0.95, 1.12, 1] }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                >
                  <CheckIcon />
                </motion.span>
              ) : IconComponent ? (
                <motion.span
                  key="status-custom-icon"
                  className="stateful-btn-icon-item"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <IconComponent size={18} />
                </motion.span>
              ) : null}
            </AnimatePresence>
          </span>
        )}
        <motion.span layout={disableLayoutAnimation ? false : true} className="stateful-btn-text">
          {children}
        </motion.span>
      </motion.div>
    </motion.button>
  );
}

function LoaderIcon() {
  return (
    <motion.svg
      aria-hidden="true"
      className="stateful-btn-loader"
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.7,
        repeat: Infinity,
        ease: "linear",
      }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 3a9 9 0 1 0 9 9" />
    </motion.svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="stateful-btn-check"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default StatefulButton;
