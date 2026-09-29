import { Link } from "react-router-dom";
import { ShieldCheck, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { ClaimForm } from "../components/ClaimForm.jsx";

/**
 * Descripción: Página principal pública que presenta el libro de reclamaciones con iconos Lucide y animaciones fluidas.
 * Requiere: Componente ClaimForm, react-router-dom, lucide-react y framer-motion.
 * Implementa: Vista pública para registro de quejas y reclamos con animaciones de entrada orquestadas.
 */

export function Home() {
  return (
    <main className="home-page" style={{ padding: "20px" }}>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        style={{ maxWidth: "560px", margin: "0 auto 24px", position: "relative" }}
      >
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
            transition: "color 0.2s ease, opacity 0.2s ease",
          }}
          title="Acceso Administrativo"
        >
          <Lock size={15} />
          <span>Admin</span>
        </Link>

        {/* Título centrado con icono grande arriba */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center", paddingTop: "8px" }}>
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
          >
            <ShieldCheck size={48} style={{ color: "var(--accent)" }} />
          </motion.div>
          <span style={{ color: "var(--text-h)", fontWeight: "600", fontSize: "20px" }}>
            Plataforma Oficial de Reclamaciones
          </span>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: 0.08 }}
      >
        <ClaimForm />
      </motion.div>
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
