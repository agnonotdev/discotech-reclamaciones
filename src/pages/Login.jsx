import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from "firebase/auth";
import {
  Lock,
  Mail,
  KeyRound,
  LogIn,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Shield,
} from "lucide-react";
import { auth } from "../firebase.js";

/**
 * Descripción: Página de inicio de sesión administrativo con soporte para Google y Correo/Contraseña y diseño enriquecido con Lucide.
 * Requiere: Firebase Auth configurado y lucide-react.
 * Implementa: Autenticación de administradores con manejo seguro de errores y redirección.
 */

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || "/admin";

  async function handleEmailLogin(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      // Por seguridad, no se expone si falló el email o la contraseña
      setError("Credenciales incorrectas. Verifica tus datos e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("El inicio de sesión con Google fue cancelado.");
      } else {
        setError("Ocurrió un error al iniciar sesión con Google.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="claim-form">
      <div style={{ marginBottom: "16px" }}>
        <Link
          to="/"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text)", textDecoration: "none", fontSize: "14px" }}
        >
          <ArrowLeft size={16} />
          <span>Volver al libro de reclamaciones</span>
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <Shield size={28} style={{ color: "var(--accent)" }} />
        <h2 style={{ margin: 0 }}>Acceso Administrativo</h2>
      </div>

      <p className="claim-description">
        Ingresa para gestionar las reclamaciones y quejas registradas.
      </p>

      {error && (
        <div className="claim-error-alert" role="alert" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        className="claim-google-button"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.01 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        {loading ? "Procesando..." : "Continuar con Google"}
      </button>

      <div className="claim-divider">
        <span>o con correo y contraseña</span>
      </div>

      <form onSubmit={handleEmailLogin} noValidate>
        <div className="claim-field">
          <label htmlFor="admin-email" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Mail size={15} />
            Correo Electrónico
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@empresa.com"
            disabled={loading}
            required
          />
        </div>

        <div className="claim-field">
          <label htmlFor="admin-password" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <KeyRound size={15} />
            Contraseña
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className="claim-submit-button"
          disabled={loading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Iniciando sesión...</span>
            </>
          ) : (
            <>
              <LogIn size={18} />
              <span>Iniciar Sesión</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default Login;

/*
 * ---------------------------------------------------------------------------
 * NOTAS DE IMPLEMENTACIÓN
 * ---------------------------------------------------------------------------
 *
 * Descripción General:
 * Vista de autenticación para administradores que ofrece inicio de sesión
 * mediante Google (Popup) y mediante formulario de credenciales (Email y Contraseña) con iconos Lucide.
 *
 * Lógica Clave:
 * - Botón Google: ejecuta signInWithPopup con GoogleAuthProvider.
 * - Formulario Email/Password: ejecuta signInWithEmailAndPassword.
 * - Manejo de errores de credenciales sin revelar qué dato específico falló.
 * - Bloqueo de botones durante la carga para evitar solicitudes duplicadas.
 * - Redirección a la ruta previa o a /admin al autenticarse.
 *
 * Dependencias Externas:
 * - lucide-react (Lock, Mail, KeyRound, LogIn, AlertCircle, ArrowLeft, Loader2, Shield)
 * - firebase/auth (signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword)
 * - react-router-dom (useNavigate, useLocation, Link)
 * - src/firebase.js (auth)
 *
 */
