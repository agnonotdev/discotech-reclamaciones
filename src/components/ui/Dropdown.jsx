import { useState, useRef, useEffect, useId, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X, Search as SearchIcon } from "lucide-react";
import "./Dropdown.css";

/**
 * Dropdown (Web - React 19 + Framer Motion)
 *
 * Componente de selección desplegable reutilizable para toda la app.
 * Cumple estrictamente con DESIGN.md:
 * - Tokens CSS de index.css (sin Tailwind).
 * - Físicas de resorte fluidas (spring) y micro-interacción de rebote táctil en trigger (scale: 0.98, hover 1.015).
 * - Rotación y traslación animada del icono de flecha (arrow down -> arrow up).
 * - Menú con rebote elástico (spring enter/exit) y escalado natural (0.96 -> 1).
 * - Soporte para selección simple o multiSelect con tags/badges.
 * - Buscador opcional integrado (showSearch).
 *
 * @param {Object} props
 * @param {Array<{ value: string|number, label: string, icon?: React.ComponentType, badge?: string|number, color?: string }>} props.options
 * @param {string|number|Array<string|number>} props.value - Valor seleccionado (o array en multiSelect).
 * @param {(value: any) => void} props.onChange - Callback al cambiar selección.
 * @param {string} [props.placeholder='Seleccionar opción...'] - Placeholder cuando no hay selección.
 * @param {string} [props.label] - Label visible superior accesible.
 * @param {boolean} [props.multiSelect=false] - Modo multiselección con tags.
 * @param {boolean} [props.showSearch=false] - Mostrar buscador interno.
 * @param {boolean} [props.disabled=false] - Deshabilitar interacción.
 * @param {string} [props.error] - Mensaje de error / estado inválido.
 * @param {string} [props.className=''] - Clases CSS adicionales para el contenedor.
 * @param {boolean} [props.fullWidth=false] - Expandir al 100% de ancho.
 */
export function Dropdown({
  options = [],
  value,
  onChange,
  onOpenChange,
  placeholder = "Seleccionar opción...",
  label,
  multiSelect = false,
  showSearch = false,
  disabled = false,
  error,
  className = "",
  fullWidth = false,
  ...rest
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const uniqueId = useId();

  const updateMenuCoords = useCallback(() => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Actualizar coordenadas en apertura, scroll o resize
  useEffect(() => {
    if (!isOpen) return;

    updateMenuCoords();
    window.addEventListener("scroll", updateMenuCoords, true);
    window.addEventListener("resize", updateMenuCoords);

    return () => {
      window.removeEventListener("scroll", updateMenuCoords, true);
      window.removeEventListener("resize", updateMenuCoords);
    };
  }, [isOpen, updateMenuCoords]);

  // Cerrar al hacer clic fuera del componente (tanto del trigger como del portal)
  useEffect(() => {
    function handleClickOutside(event) {
      const isInsideTrigger = dropdownRef.current && dropdownRef.current.contains(event.target);
      const isInsideMenu = menuRef.current && menuRef.current.contains(event.target);

      if (!isInsideTrigger && !isInsideMenu) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onOpenChange]);

  // Enfocar buscador al abrir
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showSearch]);

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchTerm("");
        onOpenChange?.(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onOpenChange]);

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (prev) {
        setSearchTerm("");
      }
      onOpenChange?.(next);
      return next;
    });
  };

  const handleSelect = (optionValue) => {
    if (disabled) return;

    if (multiSelect) {
      const currentValues = Array.isArray(value) ? [...value] : [];
      const index = currentValues.indexOf(optionValue);
      let updated;
      if (index > -1) {
        updated = currentValues.filter((v) => v !== optionValue);
      } else {
        updated = [...currentValues, optionValue];
      }
      onChange?.(updated);
    } else {
      onChange?.(optionValue);
      setIsOpen(false);
      onOpenChange?.(false);
    }
  };

  // Crear un nuevo tag a partir del texto ingresado (al presionar Enter o Coma)
  const handleAddCustomTag = (rawText) => {
    if (!multiSelect || disabled) return;
    const cleanTag = rawText.replace(/,/g, "").trim();
    if (!cleanTag) return;

    const currentValues = Array.isArray(value) ? [...value] : [];
    if (!currentValues.includes(cleanTag)) {
      const updated = [...currentValues, cleanTag];
      onChange?.(updated);
    }
    setSearchTerm("");
  };

  const handleSearchKeyDown = (e) => {
    if (!multiSelect) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      e.stopPropagation();
      handleAddCustomTag(searchTerm);
    }
  };

  const handleRemoveTag = (e, tagValue) => {
    e.stopPropagation();
    if (disabled) return;
    if (multiSelect && Array.isArray(value)) {
      const updated = value.filter((v) => v !== tagValue);
      onChange?.(updated);
    }
  };

  // Normalizador inteligente: elimina tildes/diacríticos, caracteres especiales y normaliza espacios/mayúsculas
  const normalizeSearchText = (text) => {
    if (!text) return "";
    return String(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar tildes/acentos
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  };

  // Filtrado inteligente de opciones
  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const normalizedTerm = normalizeSearchText(searchTerm);
    if (!normalizedTerm) return true;

    const normalizedLabel = normalizeSearchText(opt.label);
    const normalizedValue = normalizeSearchText(opt.value);

    return normalizedLabel.includes(normalizedTerm) || normalizedValue.includes(normalizedTerm);
  });

  // Render del valor seleccionado con animaciones de rebote (AnimatePresence)
  const renderSelection = () => {
    if (multiSelect) {
      const selectedArray = Array.isArray(value) ? value : [];
      if (selectedArray.length === 0) {
        return <span className="dropdown-placeholder">{placeholder}</span>;
      }

      return (
        <div className="dropdown-tags-container">
          <AnimatePresence mode="popLayout" initial={false}>
            {selectedArray.map((val) => {
              const opt = options.find((o) => o.value === val);
              const tagLabel = opt ? opt.label : String(val);
              return (
                <motion.span
                  key={val}
                  layout
                  className="dropdown-tag"
                  initial={{ opacity: 0, scale: 0.75, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.75, y: -4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <span className="dropdown-tag-text">{tagLabel}</span>
                  <button
                    type="button"
                    className="dropdown-tag-remove"
                    onClick={(e) => handleRemoveTag(e, val)}
                    aria-label={`Eliminar ${tagLabel}`}
                  >
                    <X size={12} />
                  </button>
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
      );
    }

    const selectedOption = options.find((o) => o.value === value);
    if (!selectedOption) {
      return <span className="dropdown-placeholder">{placeholder}</span>;
    }

    const OptionIcon = selectedOption.icon;
    return (
      <span className="dropdown-selected-single">
        {OptionIcon && (
          <span className="dropdown-option-icon" style={{ color: selectedOption.color }}>
            <OptionIcon size={16} />
          </span>
        )}
        <span className="dropdown-selected-label">{selectedOption.label}</span>
      </span>
    );
  };

  return (
    <div
      ref={dropdownRef}
      className={`dropdown-root ${isOpen ? "dropdown-open" : ""} ${fullWidth ? "dropdown-full" : ""} ${className}`}
      {...rest}
    >
      {label && (
        <label htmlFor={uniqueId} className="dropdown-label">
          {label}
        </label>
      )}

      {/* Botón Trigger con rebote físico sincronizado */}
      <motion.button
        id={uniqueId}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`dropdown-trigger ${isOpen ? "dropdown-trigger-open" : ""} ${
          error ? "dropdown-trigger-error" : ""
        } ${disabled ? "dropdown-trigger-disabled" : ""}`}
        whileHover={disabled ? undefined : { scale: 1.012 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
      >
        <div className="dropdown-trigger-content">{renderSelection()}</div>

        {/* Flecha con animación fluida de rotación y traslación vertical hacia arriba */}
        <motion.span
          className="dropdown-arrow-wrapper"
          animate={{
            rotate: isOpen ? 180 : 0,
            y: isOpen ? -2 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 450,
            damping: 24,
          }}
        >
          <ChevronDown size={18} className="dropdown-arrow-icon" />
        </motion.span>
      </motion.button>

      {/* Menú Flotante con Portal montado en document.body (superpuesto por encima de todo) */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={menuRef}
                role="listbox"
                aria-multiselectable={multiSelect}
                className="dropdown-menu"
                style={{
                  top: menuCoords.top,
                  left: menuCoords.left,
                  width: menuCoords.width || "auto",
                  minWidth: "200px",
                }}
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 26,
                }}
              >
                {/* Buscador interno opcional */}
                {showSearch && (
                  <div className="dropdown-search-box">
                    <SearchIcon size={14} className="dropdown-search-icon" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder={multiSelect ? "Buscar o escribir tag (Enter/,)..." : "Buscar opción..."}
                      className="dropdown-search-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                {/* Lista de Opciones */}
                <div className="dropdown-options-list">
                  {filteredOptions.length === 0 ? (
                    <div className="dropdown-empty">No hay resultados</div>
                  ) : (
                    filteredOptions.map((opt) => {
                      const isSelected = multiSelect
                        ? Array.isArray(value) && value.includes(opt.value)
                        : value === opt.value;
                      const Icon = opt.icon;

                      return (
                        <motion.div
                          key={opt.value}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(opt.value)}
                          className={`dropdown-option ${
                            isSelected ? "dropdown-option-selected" : ""
                          }`}
                          whileTap={{ scale: 0.985 }}
                        >
                          <motion.div
                            className="dropdown-option-main"
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                          >
                            {Icon && (
                              <span
                                className="dropdown-option-icon"
                                style={{ color: opt.color }}
                              >
                                <Icon size={16} />
                              </span>
                            )}
                            <div className="dropdown-option-label-wrapper">
                              <span className="dropdown-option-label">{opt.label}</span>
                            </div>
                            {opt.badge !== undefined && (
                              <span className="dropdown-option-badge">
                                {opt.badge}
                              </span>
                            )}
                          </motion.div>

                          {/* Check de seleccionado con rebote de entrada */}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.span
                                className="dropdown-check-icon"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                              >
                                <Check size={16} />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {error && <span className="dropdown-error-text">{error}</span>}
    </div>
  );
}

export default Dropdown;
