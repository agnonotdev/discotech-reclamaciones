import { useState, useRef, useEffect } from "react";
import { Trash2, Check, Undo2 } from "lucide-react";
import "./InlineConfirm.css";

/**
 * InlineConfirm (Bencho UI adaptation)
 * 
 * Filosofía Bencho:
 * El botón es su propio diálogo. No se abren modales ni se desplaza el layout.
 * Con un solo clic se dispara el soft-delete con animación elástica; la píldora se
 * expande mostrando "Deleted · Undo" junto con la barra de tiempo regresiva (fuse burn).
 * Si el usuario pulsa "Undo", se revierte.
 * Si el contador llega a cero, se ejecuta el hard delete definitivo.
 * 
 * Props:
 * @param {Function} onConfirm - Callback de borrado definitivo (hard delete al vencer el tiempo)
 * @param {Function} [onDeleteStart] - Callback cuando se inicia el borrado preliminar (soft delete)
 * @param {Function} [onUndo] - Callback cuando el usuario revierte el borrado
 * @param {number} [duration=4000] - Tiempo en ms de la barra de gracia
 * @param {number} [corner=22] - Radio de curvatura del botón
 * @param {boolean} [iconOnly=true] - Modo reposo muestra solo icono de papelera
 * @param {string} [label="Eliminar"] - Texto alternativo o accesible
 */
export function InlineConfirm({
  onConfirm,
  onDeleteStart,
  onUndo,
  duration = 4000,
  corner = 22,
  iconOnly = true,
  label = "Eliminar",
}) {
  const [phase, setPhase] = useState("idle"); // "idle" | "done"
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleDelete = (e) => {
    e.stopPropagation();
    setPhase("done");
    if (onDeleteStart) {
      onDeleteStart();
    }

    timerRef.current = window.setTimeout(() => {
      if (onConfirm) {
        onConfirm();
      }
    }, duration);
  };

  const handleUndo = (e) => {
    e.stopPropagation();
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPhase("idle");
    if (onUndo) {
      onUndo();
    }
  };

  return (
    <div
      className="bencho-confirm-well"
      data-phase={phase}
      data-icon-only={iconOnly}
      style={{
        "--confirm-r": `${corner}px`,
        "--burn-duration": `${duration}ms`,
      }}
    >
      <div className="bencho-confirm-body" />

      {/* Estado reposo: Icono de papelera */}
      <button
        type="button"
        className="bencho-confirm-face"
        onClick={handleDelete}
        title={label}
        aria-label={label}
        tabIndex={phase === "idle" ? 0 : -1}
      >
        <Trash2 size={15} strokeWidth={2} className="bencho-confirm-icon" />
        {!iconOnly && <span>{label}</span>}
      </button>

      {/* Estado desplegado: Eliminado + Deshacer */}
      <div className="bencho-confirm-merged">
        <span className="bencho-confirm-done">
          <Check size={14} strokeWidth={2.2} />
          <span>Eliminado</span>
        </span>
        <button
          type="button"
          className="bencho-confirm-undo"
          onClick={handleUndo}
          aria-label="Deshacer eliminación"
          tabIndex={phase === "done" ? 0 : -1}
        >
          <Undo2 size={13} strokeWidth={2.2} />
          <span>Deshacer</span>
        </button>
        <i key={phase} className="bencho-confirm-fuse" />
      </div>
    </div>
  );
}

export default InlineConfirm;
