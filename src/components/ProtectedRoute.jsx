import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Descripción: Componente guardián para proteger rutas administrativas.
 * Requiere: Contexto de autenticación activo y lucide-react.
 * Implementa: Redirección automática a /admin/login si no existe sesión válida.
 */

export function ProtectedRoute({ children }) {
  const { currentUser, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="claim-form"
        style={{ textAlign: "center", padding: "40px 20px" }}
      >
        <Loader2
          size={32}
          className="animate-spin"
          style={{ margin: "0 auto 12px", color: "var(--accent)" }}
        />
        <p>Verificando credenciales de acceso...</p>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;

/*
 * ---------------------------------------------------------------------------
 * NOTAS DE IMPLEMENTACIÓN
 * ---------------------------------------------------------------------------
 *
 * Descripción General:
 * Componente de orden superior que intercepta la navegación hacia rutas protegidas.
 *
 * Lógica Clave:
 * - Si el estado de autenticación aún está cargando, muestra un estado transitorio con indicador animado.
 * - Si el usuario no está autenticado, redirige a /admin/login con flag replace.
 * - Si el usuario está autenticado, renderiza los componentes hijos protegidos.
 *
 * Dependencias Externas:
 * - lucide-react (Loader2)
 * - react-router-dom (Navigate, useLocation)
 * - src/context/AuthContext.jsx (useAuth)
 *
 */
