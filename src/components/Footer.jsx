/**
 * Descripción: Pie de página global reutilizable para toda la aplicación.
 * Requiere: Props opcionales de texto o contenido personalizado (children).
 * Implementa: Componente de pie de página consistente en todas las vistas.
 */

export function Footer() {
  return (
    <footer className="app-footer">
      {/* Tu nuevo texto o información de derechos */}
      <p>© 2026 <a className="footer-url" href="https://discord.gg/7vJ3RkjuxM">Discotech</a>. Todos los derechos reservados.</p>

      {/* Texto de desarrollo */}
      <p style={{ marginTop: "4px", fontSize: "12px", opacity: 0.75 }}>
        Desarrollado por <a className="footer-url" href="https://discord.com/users/780938509363052597">Axomy Solutions & Co.</a>
      </p>
    </footer>
  );
}

export default Footer;

/*
 * ---------------------------------------------------------------------------
 * NOTAS DE IMPLEMENTACIÓN
 * ---------------------------------------------------------------------------
 *
 * Descripción General:
 * Componente modular de pie de página (footer) visible en todas las rutas de la app.
 *
 * Lógica Clave:
 * - Soporta la propiedad text o children para personalizar el mensaje mostrado.
 * - Utiliza estilos semánticos y variables CSS del proyecto mediante la clase app-footer.
 *
 * Dependencias Externas:
 * - Ninguna
 *
 */
