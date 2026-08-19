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
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "560px", margin: "0 auto 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-h)", fontWeight: "600" }}>
          <ShieldCheck size={22} style={{ color: "var(--accent)" }} />
          <span>Plataforma Oficial de Reclamaciones</span>
        </div>
        <Link
          to="/admin"
          style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text)", textDecoration: "none", fontSize: "14px", fontWeight: "500" }}
          title="Acceso Administrativo"
        >
          <Lock size={15} />
          <span>Admin</span>
        </Link>
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
