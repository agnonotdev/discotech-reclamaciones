/**
 * Descripción: Componente reutilizable para mostrar una insignia o etiqueta de versión Beta.
 * Requiere: Props opcionales para personalizar texto, variantes visuales y tamaños.
 * Implementa: Distintivo visual modular y accesible para indicar el estado beta del producto.
 */

export function BetaBadge({
  label = "BETA",
  children,
  variant = "default",
  size = "sm",
  className = "",
  style = {},
  ...props
}) {
  const content = children || label;
  const variantClass = `beta-badge--${variant}`;
  const sizeClass = `beta-badge--${size}`;
  const combinedClasses = `beta-badge ${variantClass} ${sizeClass} ${className}`.trim();

  return (
    <span className={combinedClasses} style={style} {...props}>
      {content}
    </span>
  );
}

export default BetaBadge;

/*
 * ---------------------------------------------------------------------------
 * NOTAS DE IMPLEMENTACIÓN
 * ---------------------------------------------------------------------------
 *
 * Descripción General:
 * Componente modular de etiqueta (badge) para señalar versiones en desarrollo o funciones beta.
 *
 * Lógica Clave:
 * - content: Prioriza children si se suministra, utilizando label como valor por defecto ("BETA").
 * - variant: Soporta default, outline, subtle y filled para adaptarse a diferentes fondos y contextos.
 * - size: Admite sm, md y lg para integrarse armónicamente junto a títulos o subtítulos.
 * - Flexibilidad: Permite la inyección de estilos y clases personalizadas mediante className y style.
 *
 * Dependencias Externas:
 * - Ninguna
 *
 */
