import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  FileText,
  User,
  Mail,
  Tag,
  MessageSquare,
  CheckCircle2,
  Home,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { db } from "../firebase.js";
import { generateClaimId } from "../utils/id-generator.js";
import { StatefulButton } from "./ui/StatefulButton.jsx";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Descripción: Formulario controlado para registro de reclamaciones y quejas con transiciones fluidas de Framer Motion.
 * Requiere: Conexión activa a Firestore, función generadora de radicados y lucide-react.
 * Implementa: Creación y guardado de tickets en la colección 'reclamaciones' con validación previa y transición sin salto entre formulario y confirmación.
 */

const CLAIM_TYPES = ["Reclamo", "Queja"];

export function ClaimForm() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("Reclamo");
  const [mensaje, setMensaje] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedRadicado, setGeneratedRadicado] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function validateForm() {
    if (!nombre.trim()) {
      return "El nombre completo es requerido.";
    }
    if (!email.trim()) {
      return "El correo electrónico es requerido.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Por favor ingresa un correo electrónico válido.";
    }
    if (!tipo.trim()) {
      return "Debes seleccionar un tipo de solicitud.";
    }
    if (!mensaje.trim()) {
      return "El detalle del mensaje no puede estar vacío.";
    }
    return null;
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setErrorMessage("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const radicado = generateClaimId();
      const claimData = {
        nombre: nombre.trim(),
        email: email.trim(),
        tipo,
        mensaje: mensaje.trim(),
        estado: "Nuevo",
        createdAt: serverTimestamp(),
        radicado,
      };

      await addDoc(collection(db, "reclamaciones"), claimData);
      setGeneratedRadicado(claimData.radicado);
      setIsCopied(false);
      setNombre("");
      setEmail("");
      setTipo("Reclamo");
      setMensaje("");
    } catch (error) {
      console.error("Error al registrar la reclamación:", error);
      setErrorMessage("Ocurrió un error al enviar tu solicitud. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyRadicado() {
    if (!generatedRadicado) {
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedRadicado);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      setIsCopied(false);
    }
  }

  function handleReset() {
    setGeneratedRadicado(null);
    setIsCopied(false);
    setErrorMessage("");
  }

  return (
    <AnimatePresence mode="wait">
      {generatedRadicado ? (
        <motion.div
          key="claim-success"
          className="claim-success-card"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="claim-success-badge">
            <CheckCircle2
              size={16}
              style={{
                display: "inline",
                verticalAlign: "middle",
                marginRight: "6px",
              }}
            />
            ¡Solicitud Registrada con Éxito!
          </div>
          <h2>Confirmación de Registro Exitoso</h2>
          <p style={{ marginTop: "8px", color: "var(--text)" }}>
            Tu reclamación ha sido radicada correctamente en el sistema.
          </p>

          <div style={{ marginTop: "20px" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-h)" }}>
              Número de radicado:
            </span>
            <div className="claim-radicado-wrapper">
              <div className="claim-radicado-code">{generatedRadicado}</div>
              <StatefulButton
                type="button"
                variant="code"
                icon={isCopied ? Check : Copy}
                disableBounce
                disableLayoutAnimation
                className={isCopied ? "copied" : ""}
                onClick={handleCopyRadicado}
                aria-label="Copiar número de radicado"
              >
                {isCopied ? "¡Copiado!" : "Copiar radicado"}
              </StatefulButton>
            </div>
          </div>

          <p style={{ fontSize: "14px", color: "var(--text)" }}>
            Conserva este radicado para hacer seguimiento o consultar el estado de tu trámite en cualquier momento.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
            <StatefulButton
              type="button"
              variant="primary"
              fullWidth
              icon={Home}
              onClick={handleReset}
            >
              <span>Volver al inicio</span>
            </StatefulButton>
          </div>
        </motion.div>
      ) : (
        <motion.form
          key="claim-form"
          className="claim-form"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          onSubmit={handleSubmit}
          noValidate
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <FileText size={28} style={{ color: "var(--accent)" }} />
            <h2 style={{ margin: 0 }}>Libro de Reclamaciones</h2>
          </div>
          <p className="claim-description">
            Ingresa tus datos y el detalle de tu reclamo o queja. Te asignaremos un
            número de radicado.
          </p>

          {errorMessage && (
            <div
              className="claim-error-alert"
              role="alert"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="claim-field">
            <label
              htmlFor="nombre"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <User size={15} />
              Nombre Completo
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Juan Pérez"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="claim-field">
            <label
              htmlFor="email"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Mail size={15} />
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="claim-field">
            <label
              htmlFor="tipo"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Tag size={15} />
              Tipo de Solicitud
            </label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              disabled={isSubmitting}
            >
              {CLAIM_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="claim-field">
            <label
              htmlFor="mensaje"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <MessageSquare size={15} />
              Detalle / Mensaje
            </label>
            <textarea
              id="mensaje"
              rows={5}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Describe detalladamente los hechos o motivo de tu solicitud..."
              disabled={isSubmitting}
              required
            />
          </div>

          <StatefulButton
            type="submit"
            fullWidth
            disabled={isSubmitting}
            status={isSubmitting ? "loading" : "idle"}
          >
            <span>{isSubmitting ? "Enviando solicitud..." : "Enviar Solicitud"}</span>
          </StatefulButton>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

export default ClaimForm;
