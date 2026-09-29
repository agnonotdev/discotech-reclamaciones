import { useEffect, useRef, useState, useCallback } from "react";
import "./Search.css";

/* ══ Search (Bencho UI — Refactorizado para Máxima Fluidez) ══
   Un solo objeto cuya cápsula se expande suavemente sin rebote exagerado.
   Calibrado exactamente a 280ms cubic-bezier(0.23, 1, 0.32, 1) siguiendo la física
   responsiva y limpia de SwipeableTicketCard / IconBar.
   Elimina totalmente el bucle de requestAnimationFrame (RAF) en JS, ejecutando la
   transición mediante aceleración de GPU sin provocar 60 re-renders de React por segundo.
*/

const SHUT = 38;
const LENS = 18;
const INSET = (SHUT - LENS) / 2;
const CORNER = 19;
const WIDE = 220;
const SNUG = 180;

/**
 * Search (Web)
 *
 * @param {Object} props
 * @param {number} [props.width] - Ancho del campo una vez abierto.
 * @param {number} [props.corner=19] - Radio del borde.
 * @param {(query: string) => void} [props.onSearch] - Callback al escribir o presionar Enter.
 */
export function Search({
  width,
  corner = CORNER,
  onSearch,
} = {}) {
  const [snug, setSnug] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches
  );
  const [touch, setTouch] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
  );

  useEffect(() => {
    const room = window.matchMedia("(max-width: 760px)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const read = () => {
      setSnug(room.matches);
      setTouch(coarse.matches);
    };
    room.addEventListener("change", read);
    coarse.addEventListener("change", read);
    return () => {
      room.removeEventListener("change", read);
      coarse.removeEventListener("change", read);
    };
  }, []);

  const span = width ?? (snug ? SNUG : WIDE);
  const field = useRef(null);
  const rest = useRef(0);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    window.clearTimeout(rest.current);
  }, []);

  const handleOpen = useCallback(() => {
    if (open) return;
    setOpen(true);
    // Focus inmediato al iniciar la expansión fluida
    setTimeout(() => {
      field.current?.focus();
    }, 40);
  }, [open]);

  const handleBlur = useCallback(() => {
    if (value.trim()) return;
    setOpen(false);
  }, [value]);

  const handleChange = useCallback(
    (e) => {
      const val = e.target.value;
      setValue(val);
      if (!busy) setBusy(true);
      window.clearTimeout(rest.current);
      rest.current = window.setTimeout(() => setBusy(false), 340);
      if (onSearch) onSearch(val);
    },
    [busy, onSearch]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setValue("");
        setOpen(false);
        field.current?.blur();
        if (onSearch) onSearch("");
      } else if (e.key === "Enter" && onSearch) {
        onSearch(value);
      }
    },
    [value, onSearch]
  );

  const openWidth = Math.max(SHUT, span);

  return (
    <div
      className="sek"
      data-open={open}
      data-busy={busy}
      style={{
        "--sek-r": `${corner}px`,
        "--open-w": `${openWidth}px`,
        "--inset": `${INSET}px`,
        "--lens": `${LENS}px`,
        "--shut": `${SHUT}px`,
      }}
    >
      <div className="sek-skin">
        <svg className="sek-lens" viewBox="0 0 18 18" aria-hidden="true">
          <circle cx="7.6" cy="7.6" r="5.4" />
          <path d="M11.6 11.6 L15.4 15.4" />
        </svg>

        <input
          ref={field}
          className="sek-field"
          type="text"
          value={value}
          placeholder="¿Qué buscaremos?"
          aria-label="Buscar"
          inputMode={touch ? "none" : undefined}
          tabIndex={open ? 0 : -1}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />

        {!open && (
          <button
            type="button"
            className="sek-hit"
            aria-label="Abrir buscador"
            onClick={handleOpen}
          />
        )}
      </div>
    </div>
  );
}

export default Search;
