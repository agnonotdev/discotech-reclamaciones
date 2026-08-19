/**
 * Descripción: Generador puro de identificadores de radicado/reclamación legibles.
 * Requiere: Ninguno.
 * Implementa: Utilidad para la creación de códigos únicos (ej: REC-2026-4821).
 */

const ALLOWED_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Genera un código de radicado único y legible.
 * Evita caracteres ambiguos (0, O, 1, I) para facilitar la lectura oral.
 *
 * @param {string} [prefix="REC"] - Prefijo del radicado.
 * @param {number} [randomLength=4] - Longitud del sufijo aleatorio.
 * @returns {string} Código en formato PREFIJO-AÑO-ALEATORIO (ej: REC-2026-4821).
 */
export function generateClaimId(prefix = "REC", randomLength = 4) {
  const currentYear = new Date().getFullYear();
  let randomSuffix = "";

  for (let i = 0; i < randomLength; i++) {
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    randomSuffix += ALLOWED_CHARS[randomIndex];
  }

  return `${prefix}-${currentYear}-${randomSuffix}`;
}

export default generateClaimId;

/*
 * ---------------------------------------------------------------------------
 * NOTAS DE IMPLEMENTACIÓN
 * ---------------------------------------------------------------------------
 *
 * Descripción General:
 * Función pura para construir identificadores de radicado en formato estándar.
 *
 * Lógica Clave:
 * - Filtra caracteres confusos (0, O, 1, I) en el conjunto de caracteres permitidos.
 * - Incluye el año en curso para contextualizar temporalmente el reclamo.
 * - Concatena el prefijo, año y sufijo aleatorio mediante guiones.
 *
 * Dependencias Externas:
 * - Ninguna (JavaScript estándar).
 *
 */
