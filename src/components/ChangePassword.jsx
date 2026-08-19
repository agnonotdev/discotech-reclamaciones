import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { auth } from "../firebase.js";

/**
 * Descripción: Componente para cambiar la contraseña del usuario actual.
 * Requiere: Sesión activa con proveedor de Email/Contraseña.
 * Implementa: Reautenticación con contraseña actual y actualización segura en Firebase Auth.
 */

export function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Por favor completa todos los campos.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("No hay usuario autenticado.");
      }

      // Reautenticar
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Cambiar contraseña
      await updatePassword(user, newPassword);

      setSuccess("¡Contraseña actualizada exitosamente!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("La contraseña actual es incorrecta.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos. Intenta más tarde.");
      } else if (err.code === "auth/requires-recent-login") {
        setError("Por seguridad, necesitas volver a iniciar sesión para hacer esto.");
      } else {
        setError("Ocurrió un error al intentar cambiar la contraseña.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-ticket-card" style={{ marginTop: "20px", padding: "20px", display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <Key size={20} style={{ color: "var(--accent)" }} />
        <h3 style={{ margin: 0 }}>Cambiar Contraseña</h3>
      </div>

      <p style={{ fontSize: "14px", color: "var(--text)", opacity: 0.8, marginBottom: "20px" }}>
        Cambia tu contraseña de administrador. Por seguridad, te pediremos tu contraseña actual.
      </p>

      {error && (
        <div className="claim-error-alert" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="claim-error-alert" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", backgroundColor: "#e6f4ea", color: "#1e8e3e", border: "1px solid #cce8d6" }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="claim-field">
          <label htmlFor="current-password" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Lock size={15} /> Contraseña actual
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="claim-field">
          <label htmlFor="new-password" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Key size={15} /> Nueva contraseña
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="claim-field">
          <label htmlFor="confirm-password" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Key size={15} /> Confirmar nueva contraseña
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className="claim-submit-button"
          disabled={loading}
          style={{ alignSelf: "flex-start", marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", width: "auto", padding: "10px 24px" }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Actualizando...</span>
            </>
          ) : (
            <span>Actualizar contraseña</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default ChangePassword;

/*
 * ---------------------------------------------------------------------------
 * NOTAS DE IMPLEMENTACIÓN
 * ---------------------------------------------------------------------------
 *
 * Descripción General:
 * Componente que gestiona el flujo de actualización de contraseña para el usuario autenticado.
 *
 * Lógica Clave:
 * - Valida longitud de la contraseña y coincidencias en el frontend.
 * - Reautentica con `EmailAuthProvider.credential` antes de aplicar el cambio.
 * - Captura errores específicos como 'auth/invalid-credential' para feedback preciso.
 *
 * Dependencias Externas:
 * - firebase/auth (EmailAuthProvider, reauthenticateWithCredential, updatePassword)
 * - src/firebase.js (auth)
 * - lucide-react (Iconos)
 *
 */
