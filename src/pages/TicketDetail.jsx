import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Dropdown } from "../components/ui/Dropdown.jsx";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Send,
  Paperclip,
  X,
  Lock,
  Tag,
  ShieldCheck,
  UserCheck,
  Download,
  File as FileIcon,
  Loader2,
  FolderOpen,
  AlertTriangle,
  RotateCcw,
  Info,
} from "lucide-react";
import { db, storage } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./TicketDetail.css";

const STATUS_OPTIONS = ["Nuevo", "En proceso", "Resuelto"];
const PRIORITY_OPTIONS = ["Baja", "Media", "Alta", "Urgente"];
const CATEGORY_OPTIONS = ["Servicio", "Facturación", "Técnico", "Atención", "Reclamo", "General"];

const SLA_POLICY = {
  Baja: { label: "1 semana (7 días)", hours: 7 * 24 },
  Media: { label: "5 días", hours: 5 * 24 },
  Alta: { label: "3 días", hours: 3 * 24 },
  Urgente: { label: "12 horas", hours: 12 },
};

function getAutoSlaDeadline(createdAt, priority) {
  const policy = SLA_POLICY[priority] || SLA_POLICY["Media"];
  const baseDate = createdAt?.toDate ? createdAt.toDate() : (createdAt ? new Date(createdAt) : new Date());
  return new Date(baseDate.getTime() + policy.hours * 60 * 60 * 1000);
}

function dateToLocalIso(date) {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILES_PER_NOTE = 5;

// Configuración de movimiento Apple según DESIGN.md
const cardMotionProps = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
};

function formatTimestamp(timestamp) {
  if (!timestamp) return "Sin registro";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function TicketDetail() {
  const { ticketId } = useParams();
  const { currentUser } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [adminList, setAdminList] = useState([]);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [activeTab, setActiveTab] = useState("timeline"); // "timeline" | "files"

  // Formulario de Nota Interna
  const [noteText, setNoteText] = useState("");
  const [localFiles, setLocalFiles] = useState([]);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef(null);

  // Panel lateral: Estado de edición
  const [isUpdatingField, setIsUpdatingField] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [slaInput, setSlaInput] = useState("");

  // 1. Cargar ticket en tiempo real
  useEffect(() => {
    if (!ticketId) return;

    const ticketRef = doc(db, "reclamaciones", ticketId);
    const unsubscribe = onSnapshot(
      ticketRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTicket({ id: docSnap.id, ...data });

          if (data.slaDeadline) {
            const date = data.slaDeadline.toDate ? data.slaDeadline.toDate() : new Date(data.slaDeadline);
            setSlaInput(dateToLocalIso(date));
          } else {
            // Si no tiene SLA fijado en la DB, calcula automáticamente según su prioridad (Baja = 1 semana)
            const defaultDate = getAutoSlaDeadline(data.createdAt, data.prioridad || "Baja");
            setSlaInput(dateToLocalIso(defaultDate));
          }
        } else {
          setTicket(null);
        }
        setLoadingTicket(false);
      },
      (error) => {
        console.error("Error al escuchar ticket:", error);
        setLoadingTicket(false);
      }
    );

    return () => unsubscribe();
  }, [ticketId]);

  // 2. Cargar Timeline inmutable en tiempo real
  useEffect(() => {
    if (!ticketId) return;

    const timelineRef = collection(db, "reclamaciones", ticketId, "timeline");
    const unsubscribe = onSnapshot(
      timelineRef,
      (snapshot) => {
        const events = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        events.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });

        setTimelineEvents(events);
        setLoadingTimeline(false);
      },
      (error) => {
        console.error("Error al escuchar timeline:", error);
        setLoadingTimeline(false);
      }
    );

    return () => unsubscribe();
  }, [ticketId]);

  // 3. Cargar lista de administradores para asignación
  useEffect(() => {
    async function fetchAdmins() {
      try {
        const snap = await getDocs(collection(db, "admins"));
        const admins = snap.docs
          .map((d) => {
            const data = d.data();
            const email = data.email || d.id;
            return {
              id: d.id,
              email,
              nombre: data.nombre || data.displayName || "",
              isActive: data.isActive !== false,
            };
          })
          .filter((a) => a.email && a.isActive);

        // Aseguramos que currentUser esté incluido en la lista si no vino en Firestore
        if (
          currentUser?.email &&
          !admins.some((a) => a.email.toLowerCase() === currentUser.email.toLowerCase())
        ) {
          admins.unshift({
            id: currentUser.uid || currentUser.email,
            email: currentUser.email,
            nombre: currentUser.displayName || "",
            isActive: true,
          });
        }

        setAdminList(admins);
      } catch (err) {
        console.error("Error al consultar administradores:", err);
        if (currentUser?.email) {
          setAdminList([
            {
              id: currentUser.uid || currentUser.email,
              email: currentUser.email,
              nombre: currentUser.displayName || "",
              isActive: true,
            },
          ]);
        }
      }
    }
    fetchAdmins();
  }, [currentUser]);

  // 4. Consolidar todos los archivos subidos a través de la historia del ticket
  const consolidatedAttachments = useMemo(() => {
    const list = [];
    timelineEvents.forEach((event) => {
      if (Array.isArray(event.adjuntos) && event.adjuntos.length > 0) {
        event.adjuntos.forEach((att) => {
          list.push({
            ...att,
            eventId: event.id,
            uploadedAt: att.uploadedAt || event.createdAt,
            uploadedBy: att.uploadedBy || event.autor?.email || "Admin",
          });
        });
      }
    });
    return list;
  }, [timelineEvents]);

  // Cálculo de Estado SLA
  const slaDeadline = ticket?.slaDeadline;
  const slaStatus = useMemo(() => {
    if (!slaDeadline) return null;
    const deadline = slaDeadline.toDate ? slaDeadline.toDate() : new Date(slaDeadline);
    const now = new Date();
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return {
        label: "Vencido",
        className: "sla-status-expired",
        icon: AlertTriangle,
        text: `Venció hace ${Math.abs(Math.round(diffHours))}h`,
      };
    }
    if (diffHours <= 24) {
      return {
        label: "Por vencer",
        className: "sla-status-warning",
        icon: Clock,
        text: `Vence en ${Math.round(diffHours)}h`,
      };
    }
    const days = Math.round(diffHours / 24);
    return {
      label: "En tiempo",
      className: "sla-status-ok",
      icon: CheckCircle2,
      text: `${days} días restantes`,
    };
  }, [slaDeadline]);

  // Manejo de selección de archivos locales (PRE-SUBMIT)
  function handleSelectFiles(e) {
    setFormError("");
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    if (localFiles.length + selectedFiles.length > MAX_FILES_PER_NOTE) {
      setFormError(`Solo se permite un máximo de ${MAX_FILES_PER_NOTE} archivos por nota.`);
      return;
    }

    const newLocalFiles = [];
    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFormError(`El archivo "${file.name}" supera el límite de 10 MB.`);
        return;
      }

      const isImg = file.type.startsWith("image/");
      const previewUrl = isImg ? URL.createObjectURL(file) : null;

      newLocalFiles.push({
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        previewUrl,
        isImg,
      });
    }

    setLocalFiles((prev) => [...prev, ...newLocalFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveLocalFile(fileId) {
    setLocalFiles((prev) => {
      const target = prev.find((f) => f.id === fileId);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }

  function clearLocalFiles() {
    localFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setLocalFiles([]);
  }

  async function handleSubmitNote(e) {
    e.preventDefault();
    if (!noteText.trim() && localFiles.length === 0) {
      setFormError("Ingresa un mensaje o adjunta al menos un archivo.");
      return;
    }

    setIsSubmittingNote(true);
    setFormError("");

    try {
      const uploadedAttachments = [];

      for (const item of localFiles) {
        const fileTimestamp = Date.now();
        const storagePath = `tickets/${ticketId}/attachments/${fileTimestamp}_${item.name}`;
        const storageReference = ref(storage, storagePath);

        await uploadBytes(storageReference, item.file, {
          contentType: item.type,
        });

        const downloadURL = await getDownloadURL(storageReference);

        uploadedAttachments.push({
          attachmentId: `att_${fileTimestamp}_${Math.random().toString(36).substring(2, 6)}`,
          storagePath,
          downloadURL,
          originalName: item.name,
          mimeType: item.type,
          sizeBytes: item.size,
          uploadedBy: currentUser?.email || "Admin",
          uploadedAt: Timestamp.now(),
        });
      }

      const timelineRef = collection(db, "reclamaciones", ticketId, "timeline");
      await addDoc(timelineRef, {
        tipo: "nota_interna",
        esInterno: true,
        autor: {
          uid: currentUser?.uid || "admin",
          email: currentUser?.email || "Admin",
          displayName: currentUser?.displayName || currentUser?.email || "Admin",
        },
        contenido: noteText.trim(),
        adjuntos: uploadedAttachments,
        createdAt: serverTimestamp(),
      });

      const ticketRef = doc(db, "reclamaciones", ticketId);
      await updateDoc(ticketRef, {
        updatedAt: serverTimestamp(),
        lastEventAt: serverTimestamp(),
      });

      clearLocalFiles();
      setNoteText("");
    } catch (err) {
      console.error("Error al registrar nota interna:", err);
      if (err?.code?.startsWith("storage/")) {
        setFormError("Error en Firebase Storage: Asegúrate de haber activado Firebase Storage en la consola (Get Started) y de haber desplegado storage.rules.");
      } else if (err?.code === "permission-denied") {
        setFormError("Permisos insuficientes: Verifica que tu sesión esté activa y registrada como administrador en la colección 'admins'.");
      } else {
        setFormError(err?.message || "Ocurrió un error al guardar la nota. Intenta nuevamente.");
      }
    } finally {
      setIsSubmittingNote(false);
    }
  }

  async function recordSystemEvent(description, changes = []) {
    try {
      const timelineRef = collection(db, "reclamaciones", ticketId, "timeline");
      await addDoc(timelineRef, {
        tipo: "evento_sistema",
        esInterno: true,
        autor: {
          uid: currentUser?.uid || "admin",
          email: currentUser?.email || "Admin",
        },
        contenido: description,
        cambios: changes,
        adjuntos: [],
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error al registrar evento de auditoría:", err);
    }
  }

  async function handleClaimTicket() {
    if (!currentUser?.email) return;
    setIsUpdatingField(true);
    // Actualización inmediata en el front
    setTicket((prev) => (prev ? { ...prev, asignadoA: currentUser.email, asignadoEmail: currentUser.email } : prev));
    try {
      const ticketRef = doc(db, "reclamaciones", ticketId);
      await updateDoc(ticketRef, {
        asignadoA: currentUser.email,
        asignadoEmail: currentUser.email,
        updatedAt: serverTimestamp(),
      });
      await recordSystemEvent(`Ticket asignado a ${currentUser.email} (Asignar a mí)`, [
        { campo: "asignadoA", valorAnterior: ticket?.asignadoA || "Sin asignar", valorNuevo: currentUser.email },
      ]);
    } catch (err) {
      console.error("Error al asignar ticket:", err);
    } finally {
      setIsUpdatingField(false);
    }
  }

  async function handleAssigneeChange(newAssignee) {
    const val = (!newAssignee || newAssignee === "null") ? null : newAssignee;
    setIsUpdatingField(true);
    // Quita o actualiza la asignación inmediatamente en el front
    setTicket((prev) => (prev ? { ...prev, asignadoA: val, asignadoEmail: val } : prev));
    try {
      const ticketRef = doc(db, "reclamaciones", ticketId);
      await updateDoc(ticketRef, {
        asignadoA: val,
        asignadoEmail: val,
        updatedAt: serverTimestamp(),
      });
      const desc = val ? `Ticket asignado a ${val}` : "Ticket desasignado (Ninguno)";
      await recordSystemEvent(desc, [
        { campo: "asignadoA", valorAnterior: ticket?.asignadoA || "Sin asignar", valorNuevo: val || "Sin asignar" },
      ]);
    } catch (err) {
      console.error("Error al reasignar ticket:", err);
    } finally {
      setIsUpdatingField(false);
    }
  }

  async function handleStatusChange(newStatus) {
    if (newStatus === ticket.estado) return;
    setIsUpdatingField(true);
    try {
      const ticketRef = doc(db, "reclamaciones", ticketId);
      await updateDoc(ticketRef, {
        estado: newStatus,
        updatedAt: serverTimestamp(),
      });
      await recordSystemEvent(`Estado actualizado a "${newStatus}"`, [
        { campo: "estado", valorAnterior: ticket.estado, valorNuevo: newStatus },
      ]);
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    } finally {
      setIsUpdatingField(false);
    }
  }

  async function handlePriorityChange(newPriority) {
    if (newPriority === ticket?.prioridad) return;
    setIsUpdatingField(true);

    // Calcular automáticamente nueva fecha límite SLA según la prioridad seleccionada:
    // Baja = 1 semana, Media = 5 días, Alta = 3 días, Urgente = 12 horas
    const newDeadlineDate = getAutoSlaDeadline(ticket?.createdAt, newPriority);
    const newTimestamp = Timestamp.fromDate(newDeadlineDate);
    setSlaInput(dateToLocalIso(newDeadlineDate));

    // Actualización inmediata en el front
    setTicket((prev) =>
      prev ? { ...prev, prioridad: newPriority, slaDeadline: newTimestamp } : prev
    );

    try {
      const ticketRef = doc(db, "reclamaciones", ticketId);
      await updateDoc(ticketRef, {
        prioridad: newPriority,
        slaDeadline: newTimestamp,
        updatedAt: serverTimestamp(),
      });
      const policyDesc = SLA_POLICY[newPriority]?.label || "";
      await recordSystemEvent(
        `Prioridad cambiada a "${newPriority}". Fecha límite SLA recalculada a ${policyDesc}: ${formatTimestamp(newTimestamp)}`,
        [
          { campo: "prioridad", valorAnterior: ticket?.prioridad || "No definida", valorNuevo: newPriority },
          { campo: "slaDeadline", valorAnterior: ticket?.slaDeadline ? formatTimestamp(ticket.slaDeadline) : "Sin definir", valorNuevo: formatTimestamp(newTimestamp) },
        ]
      );
    } catch (err) {
      console.error("Error al actualizar prioridad y SLA:", err);
    } finally {
      setIsUpdatingField(false);
    }
  }

  async function handleRecalculateSla() {
    setIsUpdatingField(true);
    const priority = ticket?.prioridad || "Baja";
    const newDeadlineDate = getAutoSlaDeadline(ticket?.createdAt, priority);
    const newTimestamp = Timestamp.fromDate(newDeadlineDate);
    setSlaInput(dateToLocalIso(newDeadlineDate));

    setTicket((prev) =>
      prev ? { ...prev, slaDeadline: newTimestamp } : prev
    );

    try {
      const ticketRef = doc(db, "reclamaciones", ticketId);
      await updateDoc(ticketRef, {
        slaDeadline: newTimestamp,
        updatedAt: serverTimestamp(),
      });
      const policyDesc = SLA_POLICY[priority]?.label || "";
      await recordSystemEvent(
        `Fecha límite SLA recalculada según prioridad ${priority} (${policyDesc}): ${formatTimestamp(newTimestamp)}`
      );
    } catch (err) {
      console.error("Error al recalcular SLA:", err);
    } finally {
      setIsUpdatingField(false);
    }
  }

  async function handleCategoryChange(newCategory) {
    if (newCategory === ticket.categoria) return;
    setIsUpdatingField(true);
    try {
      const ticketRef = doc(db, "reclamaciones", ticketId);
      await updateDoc(ticketRef, {
        categoria: newCategory,
        updatedAt: serverTimestamp(),
      });
      await recordSystemEvent(`Categoría clasificada como "${newCategory}"`, [
        { campo: "categoria", valorAnterior: ticket.categoria || "General", valorNuevo: newCategory },
      ]);
    } catch (err) {
      console.error("Error al actualizar categoría:", err);
    } finally {
      setIsUpdatingField(false);
    }
  }

  async function handleSaveSla() {
    if (!slaInput) return;
    setIsUpdatingField(true);
    try {
      const dateObj = new Date(slaInput);
      const timestamp = Timestamp.fromDate(dateObj);
      const ticketRef = doc(db, "reclamaciones", ticketId);
      await updateDoc(ticketRef, {
        slaDeadline: timestamp,
        updatedAt: serverTimestamp(),
      });
      await recordSystemEvent(`Fecha límite SLA fijada para: ${formatTimestamp(timestamp)}`);
    } catch (err) {
      console.error("Error al actualizar SLA:", err);
    } finally {
      setIsUpdatingField(false);
    }
  }

  async function handleAddTag(e) {
    e.preventDefault();
    const tag = newTagInput.trim().toLowerCase();
    if (!tag) return;
    const currentTags = Array.isArray(ticket.etiquetas) ? ticket.etiquetas : [];
    if (currentTags.includes(tag)) {
      setNewTagInput("");
      return;
    }
    const updatedTags = [...currentTags, tag];
    try {
      const ticketRef = doc(db, "reclamaciones", ticketId);
      await updateDoc(ticketRef, {
        etiquetas: updatedTags,
        updatedAt: serverTimestamp(),
      });
      setNewTagInput("");
    } catch (err) {
      console.error("Error al añadir etiqueta:", err);
    }
  }

  async function handleRemoveTag(tagToRemove) {
    const currentTags = Array.isArray(ticket.etiquetas) ? ticket.etiquetas : [];
    const updatedTags = currentTags.filter((t) => t !== tagToRemove);
    try {
      const ticketRef = doc(db, "reclamaciones", ticketId);
      await updateDoc(ticketRef, {
        etiquetas: updatedTags,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error al quitar etiqueta:", err);
    }
  }

  if (loadingTicket) {
    return (
      <div className="ticket-detail-loading-box">
        <Loader2 size={36} className="animate-spin ticket-detail-spinner" />
        <p className="ticket-detail-loading-text">Cargando información del ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="ticket-detail-empty-box">
        <AlertCircle size={40} style={{ margin: "0 auto 16px", color: "var(--color-danger)" }} />
        <h2>Ticket no encontrado</h2>
        <p className="ticket-detail-empty-msg">
          El ticket solicitado no existe o fue eliminado.
        </p>
        <Link to="/admin" className="ticket-back-link">
          <ArrowLeft size={16} /> Volver al Panel
        </Link>
      </div>
    );
  }

  return (
    <motion.div className="ticket-detail-container" {...cardMotionProps}>
      {/* Header */}
      <header className="ticket-detail-header">
        <div className="ticket-header-title-box">
          <Link to="/admin" className="ticket-back-link" title="Regresar al panel de reclamaciones">
            <ArrowLeft size={16} /> Panel
          </Link>
          <span className="ticket-radicado-badge">{ticket.radicado || ticket.id}</span>
          <span className="ticket-type-pill">{ticket.tipo || "Reclamo"}</span>
        </div>

        <div className="ticket-header-actions">
          <span className="status-badge">
            Estado: {ticket.estado || "Nuevo"}
          </span>
        </div>
      </header>

      {/* Grid Principal: 2 Columnas */}
      <div className="ticket-detail-grid">
        {/* Columna Izquierda: Mensaje Original, Tabs, Timeline y Notas */}
        <div className="ticket-main-column">
          {/* Tarjeta de Reclamación Inicial del Cliente */}
          <motion.div className="ticket-original-card" {...cardMotionProps}>
            <div className="ticket-original-header">
              <div className="ticket-client-meta">
                <span>
                  <strong>Cliente:</strong> {ticket.nombre || "Anónimo"}
                </span>
                <span>
                  <strong>Correo:</strong> {ticket.email || "No registrado"}
                </span>
              </div>
              <div className="ticket-client-date">
                <Calendar size={14} />
                <span>Registrado: {formatTimestamp(ticket.createdAt)}</span>
              </div>
            </div>

            <div className="ticket-original-body-title">
              Detalle inicial de la solicitud del cliente:
            </div>
            <div className="ticket-original-body">{ticket.mensaje || "(Sin mensaje inicial)"}</div>
          </motion.div>

          {/* Navegación por pestañas (Timeline vs Archivos Subidos) */}
          <div className="ticket-tabs-nav">
            <button
              type="button"
              className={`ticket-tab-btn ${activeTab === "timeline" ? "active" : ""}`}
              onClick={() => setActiveTab("timeline")}
            >
              <Clock size={16} />
              <span>Trazabilidad</span>
              <span className="ticket-tab-count">{timelineEvents.length}</span>
            </button>

            <button
              type="button"
              className={`ticket-tab-btn ${activeTab === "files" ? "active" : ""}`}
              onClick={() => setActiveTab("files")}
            >
              <FolderOpen size={16} />
              <span>Archivos Subidos</span>
              <span className="ticket-tab-count">{consolidatedAttachments.length}</span>
            </button>
          </div>

          {/* Vista Pestaña 1: Timeline de Trazabilidad */}
          {activeTab === "timeline" && (
            <section className="timeline-section">
              <div className="timeline-container">
                {loadingTimeline ? (
                  <div className="ticket-detail-loading-box">
                    <Loader2 size={24} className="animate-spin ticket-detail-spinner" />
                  </div>
                ) : timelineEvents.length === 0 ? (
                  <div className="consolidated-files-empty">
                    No hay eventos registrados aún. Utiliza el formulario inferior para agregar la primera nota interna.
                  </div>
                ) : (
                  <AnimatePresence>
                    {timelineEvents.map((event, index) => {
                      if (event.tipo === "evento_sistema") {
                        return (
                          <motion.div
                            key={event.id}
                            className="timeline-event-system"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18, delay: Math.min(index * 0.02, 0.1) }}
                          >
                            <div className="timeline-event-system-content">
                              <ShieldCheck size={15} className="timeline-event-icon" />
                              <span>{event.contenido}</span>
                            </div>
                            <span className="timeline-event-system-date">{formatTimestamp(event.createdAt)}</span>
                          </motion.div>
                        );
                      }

                      // Nota Interna Administrativa
                      return (
                        <motion.article
                          key={event.id}
                          className="timeline-note-card"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.12) }}
                        >
                          <div className="timeline-note-header">
                            <div className="timeline-note-author-box">
                              <span className="timeline-private-pill">
                                <Lock size={12} /> Nota Interna
                              </span>
                              <span className="timeline-author-badge">
                                <User size={14} />
                                {event.autor?.email || "Admin"}
                              </span>
                            </div>
                            <span className="timeline-note-date">{formatTimestamp(event.createdAt)}</span>
                          </div>

                          {event.contenido && <div className="timeline-note-content">{event.contenido}</div>}

                          {/* Adjuntos integrados en la nota */}
                          {Array.isArray(event.adjuntos) && event.adjuntos.length > 0 && (
                            <div className="note-attachments-grid">
                              {event.adjuntos.map((att) => {
                                const isImg = att.mimeType?.startsWith("image/");
                                return (
                                  <a
                                    key={att.attachmentId}
                                    href={att.downloadURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="attachment-chip"
                                    title={`Descargar ${att.originalName}`}
                                  >
                                    {isImg ? (
                                      <img
                                        src={att.downloadURL}
                                        alt={att.originalName}
                                        className="attachment-img-preview"
                                      />
                                    ) : (
                                      <FileIcon size={24} style={{ color: "var(--accent)", flexShrink: 0 }} />
                                    )}
                                    <div className="attachment-chip-info">
                                      <span className="attachment-chip-name">{att.originalName}</span>
                                      <span className="attachment-chip-size">{formatBytes(att.sizeBytes)}</span>
                                    </div>
                                    <Download size={14} className="attachment-chip-icon" />
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>

              {/* Formulario de Nueva Nota Interna */}
              <motion.form onSubmit={handleSubmitNote} className="new-note-form" {...cardMotionProps}>
                <div className="new-note-header">
                  <Lock size={16} style={{ color: "var(--ticket-progreso)" }} />
                  <span>Añadir Nota Interna y Adjuntos</span>
                </div>

                {formError && (
                  <div className="claim-error-alert" role="alert">
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <textarea
                  className="new-note-textarea"
                  placeholder="Escribe comentarios, hallazgos o acuerdos internos de esta reclamación..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  disabled={isSubmittingNote}
                />

                {/* Previsualización Local Pre-Submit */}
                {localFiles.length > 0 && (
                  <div className="local-attachments-preview">
                    {localFiles.map((fileItem) => (
                      <div key={fileItem.id} className="local-attachment-tag">
                        {fileItem.isImg && fileItem.previewUrl ? (
                          <img
                            src={fileItem.previewUrl}
                            alt={fileItem.name}
                            className="local-attachment-thumb"
                          />
                        ) : (
                          <FileIcon size={16} style={{ color: "var(--accent)" }} />
                        )}
                        <span className="local-attachment-name">{fileItem.name}</span>
                        <span className="local-attachment-size">({formatBytes(fileItem.size)})</span>
                        <button
                          type="button"
                          className="remove-local-att-btn"
                          onClick={() => handleRemoveLocalFile(fileItem.id)}
                          title="Quitar archivo antes de enviar"
                          disabled={isSubmittingNote}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="cloudinary-service-alert" role="status">
                  <Info size={16} />
                  <span>El servicio de imágenes no está disponible hasta concretar el servicio de Cloudinary.</span>
                </div>

                <div className="new-note-actions">
                  <div className="disabled-attach-wrapper" title="Servicio deshabilitado temporalmente hasta implementar la conexión con Cloudinary.">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="internal-file-input"
                      multiple
                      className="file-input-hidden"
                      onChange={handleSelectFiles}
                      disabled={true}
                    />
                    <label htmlFor="internal-file-input" className="attach-btn-label disabled">
                      <Paperclip size={16} />
                      <span>Adjuntar archivos</span>
                      <Info size={15} className="attach-disabled-info-icon" />
                    </label>
                  </div>

                  <motion.button
                    type="submit"
                    className="submit-note-btn"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmittingNote || (!noteText.trim() && localFiles.length === 0)}
                  >
                    {isSubmittingNote ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Subiendo y Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Registrar Nota</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            </section>
          )}

          {/* Vista Pestaña 2: Apartado Consolidado de "Archivos Subidos" */}
          {activeTab === "files" && (
            <motion.section className="consolidated-files-container" {...cardMotionProps}>
              <div className="consolidated-files-header">
                <h3 className="consolidated-files-title">
                  Historial Consolidado de Archivos del Ticket
                </h3>
                <span className="consolidated-files-total">
                  Total: {consolidatedAttachments.length} archivos
                </span>
              </div>

              <div className="cloudinary-service-alert" role="status">
                <Info size={16} />
                <span>El servicio de imágenes no está disponible hasta concretar el servicio de Cloudinary.</span>
              </div>

              {consolidatedAttachments.length === 0 ? (
                <div className="consolidated-files-empty">
                  <FolderOpen size={40} className="consolidated-files-empty-icon" />
                  <p>No se han adjuntado archivos a este ticket todavía.</p>
                </div>
              ) : (
                <div className="consolidated-files-grid">
                  {consolidatedAttachments.map((file) => {
                    const isImg = file.mimeType?.startsWith("image/");
                    return (
                      <div key={file.attachmentId} className="consolidated-file-card">
                        {isImg ? (
                          <img
                            src={file.downloadURL}
                            alt={file.originalName}
                            className="consolidated-file-preview"
                          />
                        ) : (
                          <div className="consolidated-doc-icon-box">
                            <FileIcon size={44} style={{ color: "var(--accent)", opacity: 0.8 }} />
                          </div>
                        )}

                        <div className="consolidated-file-meta">
                          <strong title={file.originalName}>{file.originalName}</strong>
                          <span>Tamaño: {formatBytes(file.sizeBytes)}</span>
                          <span>Por: {file.uploadedBy}</span>
                          <span>Fecha: {formatTimestamp(file.uploadedAt)}</span>
                        </div>

                        <a
                          href={file.downloadURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="claim-ticket-btn consolidated-download-btn"
                        >
                          <Download size={14} /> Descargar Archivo
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.section>
          )}
        </div>

        {/* Columna Derecha: Panel Lateral de Gestión */}
        <aside className="ticket-sidebar-panel">
          <motion.div className="sidebar-card" {...cardMotionProps}>
            <div className="sidebar-card-title">
              <ShieldCheck size={18} style={{ color: "var(--accent)" }} />
              <span>Panel de Gestión</span>
            </div>

            {/* Asignado A */}
            <div className="sidebar-field-group">
              <label>Asignado a:</label>

              <div className="ticket-assignee-header-box">
                {ticket.asignadoA ? (
                  <div className="ticket-assigned-user-box">
                    <User size={15} style={{ color: "var(--accent)" }} />
                    <span>{ticket.asignadoA}</span>
                  </div>
                ) : (
                  <span className="ticket-unassigned-text">
                    Sin asignar
                  </span>
                )}

                {/* Botón Asignar a mí en la parte superior */}
                {currentUser?.email && ticket.asignadoA !== currentUser.email && (
                  <motion.button
                    type="button"
                    className="claim-ticket-btn"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClaimTicket}
                    disabled={isUpdatingField}
                  >
                    <UserCheck size={16} /> Asignar a mí
                  </motion.button>
                )}
              </div>

              {/* Selector para elegir admin o Ninguno */}
              <Dropdown
                options={[
                  { value: "null", label: "Ninguno" },
                  ...adminList.map((admin) => ({
                    value: admin.email,
                    label: `${admin.email} ${admin.nombre ? `(${admin.nombre})` : ""}`,
                  }))
                ]}
                value={ticket.asignadoA || "null"}
                onChange={(value) => handleAssigneeChange(value)}
                disabled={isUpdatingField}
                fullWidth
                showSearch
              />
            </div>

            {/* Estado */}
            <div className="sidebar-field-group">
              <label>Estado del Ticket:</label>
              <Dropdown
                options={STATUS_OPTIONS.map((st) => ({ value: st, label: st }))}
                value={ticket.estado || "Nuevo"}
                onChange={(value) => handleStatusChange(value)}
                disabled={isUpdatingField}
                fullWidth
              />
            </div>

            {/* Prioridad */}
            <div className="sidebar-field-group">
              <label>Prioridad:</label>
              <Dropdown
                options={PRIORITY_OPTIONS.map((pr) => ({ value: pr, label: pr }))}
                value={ticket.prioridad || "Media"}
                onChange={(value) => handlePriorityChange(value)}
                disabled={isUpdatingField}
                fullWidth
              />
            </div>

            {/* Categoría */}
            <div className="sidebar-field-group">
              <label>Categoría:</label>
              <Dropdown
                options={CATEGORY_OPTIONS.map((cat) => ({ value: cat, label: cat }))}
                value={ticket.categoria || "General"}
                onChange={(value) => handleCategoryChange(value)}
                disabled={isUpdatingField}
                fullWidth
                showSearch
              />
            </div>

            {/* SLA / Fecha Límite */}
            <div className="sidebar-field-group">
              <label>Fecha Límite (SLA):</label>

              <div className="sla-policy-hint">
                <strong>Regla SLA:</strong> Baja (1 sem) • Media (5 d) • Alta (3 d) • Urgente (12 h)
              </div>

              <input
                type="datetime-local"
                className="sidebar-input"
                value={slaInput}
                onChange={(e) => setSlaInput(e.target.value)}
                disabled={isUpdatingField}
              />

              <div className="sla-actions-row">
                <button
                  type="button"
                  className="attach-btn-label sla-save-btn"
                  onClick={handleSaveSla}
                  disabled={isUpdatingField || !slaInput}
                >
                  Guardar Fecha
                </button>

                <button
                  type="button"
                  className="attach-btn-label sla-save-btn"
                  onClick={handleRecalculateSla}
                  disabled={isUpdatingField}
                  title="Recalcular automáticamente según la prioridad del ticket"
                >
                  <RotateCcw size={13} />
                  <span>Auto SLA</span>
                </button>
              </div>

              {slaStatus && (
                <div className={`sla-badge-box ${slaStatus.className}`}>
                  <slaStatus.icon size={15} />
                  <span>{slaStatus.label}: {slaStatus.text}</span>
                </div>
              )}
            </div>

            {/* Etiquetas (Tags) */}
            <div className="sidebar-field-group">
              <label>Etiquetas:</label>
              <div className="tags-list">
                {Array.isArray(ticket.etiquetas) && ticket.etiquetas.length > 0 ? (
                  ticket.etiquetas.map((t) => (
                    <span key={t} className="tag-chip">
                      <Tag size={11} />
                      <span>{t}</span>
                      <button
                        type="button"
                        className="tag-remove-btn"
                        onClick={() => handleRemoveTag(t)}
                        title="Quitar etiqueta"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Sin etiquetas</span>
                )}
              </div>

              <form onSubmit={handleAddTag} className="add-tag-box">
                <input
                  type="text"
                  placeholder="Nueva etiqueta..."
                  className="add-tag-input"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                />
                <button type="submit" className="add-tag-btn" disabled={!newTagInput.trim()}>
                  +
                </button>
              </form>
            </div>
          </motion.div>
        </aside>
      </div>
    </motion.div>
  );
}

export default TicketDetail;
