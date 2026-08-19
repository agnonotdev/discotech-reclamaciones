import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  FileText,
  User,
  Mail,
  Tag,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { db } from "../firebase.js";
import { generateClaimId } from "../utils/id-generator.js";

/**
 * Descripción: Formulario controlado para registro de reclamaciones y quejas con iconos Lucide y copiado de radicado.
 * Requiere: Conexión activa a Firestore, función generadora de radicados y lucide-react.
 * Implementa: Creación y guardado de tickets en la colección 'reclamaciones' con validación previa.
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
    e.preventDefault();
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
        estado: "Pendiente",
        createdAt: serverTimestamp(),
        radicado,
      };

      await addDoc(collection(db, "reclamaciones"), claimData);
      setGeneratedRadicado(radicado);
      setIsCopied(false);
      setNombre("");
      setEmail("");
      setTipo("Reclamo");
      setMensaje("");
    } catch (error) {
      setErrorMessage(
        error,
        "Ocurrió un error al enviar tu solicitud. Intenta nuevamente.",
      );
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
      // Fallback si clipboard API no está disponible
      setIsCopied(false);
    }
  }

  function handleReset() {
    setGeneratedRadicado(null);
    setIsCopied(false);
    setErrorMessage("");
  }

  if (generatedRadicado) {
    return (
      <div className="claim-success-card">
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
        <h2>Número de Radicado:</h2>
        <div className="claim-radicado-wrapper">
          <div className="claim-radicado-code">{generatedRadicado}</div>
          <button
            type="button"
            className={`claim-copy-button ${isCopied ? "copied" : ""}`}
            onClick={handleCopyRadicado}
          >
            {isCopied ? (
              <>
                <Check size={16} />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copiar Radicado</span>
              </>
            )}
          </button>
        </div>
        <p>
          Guarda este código para consultar el estado de tu trámite en cualquier
          momento.
        </p>
        <button
          type="button"
          className="claim-button"
          onClick={handleReset}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          <RotateCcw size={18} />
          Registrar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form className="claim-form" onSubmit={handleSubmit} noValidate>
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

      <button
        type="submit"
        className="claim-submit-button"
        disabled={isSubmitting}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Enviando solicitud...</span>
          </>
        ) : (
          <>
            <Send size={18} />
            <span>Enviar Solicitud</span>
          </>
        )}
      </button>
    </form>
  );
}

export default ClaimForm;

/*
 * ---------------------------------------------------------------------------
 * NOTAS DE IMPLEMENTACIÓN
 * ---------------------------------------------------------------------------
 *
 * Descripción General:
 * Componente de formulario controlado enriquecido con iconos Lucide que recolecta
 * la información del usuario, valida en el cliente y guarda en Firestore.
 *
 * Lógica Clave:
 * - Control de inputs mediante estados independientes de React.
 * - Validación preliminar para evitar operaciones innecesarias.
 * - Inserción en Firestore respetando el esquema oficial de seguridad.
 * - Feedback visual interactivo con iconos lucide-react y copiado al portapapeles.
 *
 * Dependencias Externas:
 * - lucide-react (FileText, User, Mail, Tag, MessageSquare, Send, Loader2, CheckCircle2, RotateCcw, AlertCircle, Copy, Check)
 * - firebase/firestore (collection, addDoc, serverTimestamp)
 * - src/firebase.js (db)
 * - src/utils/id-generator.js (generateClaimId)
 *
 */
