import { Link } from "react-router-dom";
import { ShieldCheck, Lock } from "lucide-react";
import { ClaimForm } from "../components/ClaimForm.jsx";

/**
 * Descripción: Página principal pública que presenta el libro de reclamaciones con iconos Lucide.
 * Requiere: Componente ClaimForm, react-router-dom y lucide-react.
 * Implementa: Vista pública para registro de quejas y reclamos con acceso a portal administrativo.
 */

export function Home() {
  return (
    <main className="home-page" style={{ padding: "20px" }}>
      <header style={{ maxWidth: "560px", margin: "0 auto 24px", position: "relative" }}>
        {/* Enlace Admin en la esquina superior derecha */}
        <Link
          to="/admin"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "500",
          }}
          title="Acceso Administrativo"
        >
          <Lock size={15} />
          <span>Admin</span>
        </Link>

        {/* Título centrado con icono grande arriba */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center", paddingTop: "8px" }}>
          <ShieldCheck size={48} style={{ color: "var(--accent)" }} />
          <span style={{ color: "var(--text-h)", fontWeight: "600", fontSize: "20px" }}>
            Plataforma Oficial de Reclamaciones
          </span>
        </div>
      </header>
      <ClaimForm />
    </main>
  );
}

export default Home;

/*
 * ---------------------------------------------------------------------------
 * NOTAS DE IMPLEMENTACIÓN
 * ---------------------------------------------------------------------------
 *
 * Descripción General:
 * Vista pública donde cualquier usuario puede radicar sus peticiones mediante el formulario.
 *
 * Lógica Clave:
 * - Renderiza el encabezado institucional con iconos y el formulario controlado ClaimForm.
 *
 * Dependencias Externas:
 * - lucide-react (ShieldCheck, Lock)
 * - react-router-dom (Link)
 * - src/components/ClaimForm.jsx (ClaimForm)
 *
 */
