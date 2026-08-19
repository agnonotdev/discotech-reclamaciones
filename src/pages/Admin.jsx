import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import {
  ShieldCheck,
  LogOut,
  Clock,
  RefreshCw,
  CheckCircle2,
  Filter,
  Calendar,
  User,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  Inbox,
  Home,
  MessageSquare,
} from "lucide-react";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Descripción: Panel de administración en tiempo real para gestión de reclamaciones y quejas con iconos Lucide.
 * Requiere: Sesión activa de administrador, conexión a Firestore y lucide-react.
 * Implementa: Listener onSnapshot para reactividad en vivo, filtrado local y transición de estados con updateDoc.
 */

const STATUS_OPTIONS = ["Todos", "Pendiente", "En proceso", "Resuelto"];

const NEXT_STATUS = {
  "Pendiente": "En proceso",
  "En proceso": "Resuelto",
  "Resuelto": "Pendiente",
};

export function Admin() {
  const { currentUser, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const reclamacionesRef = collection(db, "reclamaciones");

    const unsubscribe = onSnapshot(
      reclamacionesRef,
      (snapshot) => {
        const fetchedTickets = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        // Orden descendente por fecha de creación
        fetchedTickets.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });

        setTickets(fetchedTickets);
        setLoading(false);
      },
      (error) => {
        console.error("Error al escuchar reclamaciones:", error);
        setErrorMessage("Error al cargar los tickets en tiempo real.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function handleStatusTransition(ticketId, currentStatus) {
    const nextStatus = NEXT_STATUS[currentStatus] || "Pendiente";
    setUpdatingId(ticketId);
    setErrorMessage("");

    try {
      const ticketRef = doc(db, "reclamaciones", ticketId);
      await updateDoc(ticketRef, {
        estado: nextStatus,
      });
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      setErrorMessage("No se pudo actualizar el estado del ticket.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) {
      return "Pendiente de registro";
    }
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderStatusBadge(status) {
    switch (status) {
      case "Pendiente":
        return (
          <span className="status-badge status-pendiente">
            <Clock size={14} />
            <span>Pendiente</span>
          </span>
        );
      case "En proceso":
        return (
          <span className="status-badge status-en-proceso">
            <RefreshCw size={14} />
            <span>En proceso</span>
          </span>
        );
      case "Resuelto":
        return (
          <span className="status-badge status-resuelto">
            <CheckCircle2 size={14} />
            <span>Resuelto</span>
          </span>
        );
      default:
        return <span className="status-badge">{status || "Pendiente"}</span>;
    }
  }

  // Filtrado local en memoria para no complicar el listener de Firestore
  const filteredTickets = useMemo(() => {
    if (filterStatus === "Todos") {
      return tickets;
    }
    return tickets.filter((ticket) => ticket.estado === filterStatus);
  }, [tickets, filterStatus]);

  const counts = useMemo(() => {
    return {
      Todos: tickets.length,
      Pendiente: tickets.filter((t) => t.estado === "Pendiente").length,
      "En proceso": tickets.filter((t) => t.estado === "En proceso").length,
      Resuelto: tickets.filter((t) => t.estado === "Resuelto").length,
    };
  }, [tickets]);

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={28} style={{ color: "var(--accent)" }} />
            <h1 style={{ margin: 0 }}>Panel de Gestión de Reclamaciones</h1>
          </div>
          <p className="admin-user-info">
            Administrador: <strong>{currentUser?.email}</strong>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            to="/"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text)", textDecoration: "none", fontSize: "14px", fontWeight: "500" }}
          >
            <Home size={16} />
            <span>Ir a Inicio</span>
          </Link>
          <button
            type="button"
            className="admin-logout-btn"
            onClick={handleLogout}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="claim-error-alert" role="alert" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Barra de Filtros de Estado */}
      <div className="admin-filter-bar" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text)", fontSize: "14px", marginRight: "4px" }}>
          <Filter size={16} />
          <span>Filtrar:</span>
        </div>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            className={`admin-filter-pill ${filterStatus === status ? "active" : ""}`}
            onClick={() => setFilterStatus(status)}
          >
            {status}
            <span className="admin-filter-count">{counts[status] || 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-empty-state">
          <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--accent)" }} />
          <p>Conectando y cargando tickets en tiempo real...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="admin-empty-state">
          <Inbox size={36} style={{ margin: "0 auto 12px", opacity: 0.6 }} />
          <p>No se encontraron tickets con el filtro seleccionado ({filterStatus}).</p>
        </div>
      ) : (
        <div className="admin-tickets-grid">
          {filteredTickets.map((ticket) => (
            <article key={ticket.id} className="admin-ticket-card">
              <div className="admin-ticket-top">
                <span className="admin-ticket-radicado">{ticket.radicado || "S/R"}</span>
                <span className="admin-ticket-type">{ticket.tipo || "Reclamo"}</span>
              </div>

              <div className="admin-ticket-info">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <User size={15} style={{ opacity: 0.7 }} />
                  <span><strong>Cliente:</strong> {ticket.nombre || "Anónimo"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Mail size={15} style={{ opacity: 0.7 }} />
                  <span><strong>Correo:</strong> {ticket.email || "No registrado"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={15} style={{ opacity: 0.7 }} />
                  <span><strong>Fecha:</strong> {formatTimestamp(ticket.createdAt)}</span>
                </div>
              </div>

              <div className="admin-ticket-message">
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  <MessageSquare size={14} />
                  <span>Mensaje:</span>
                </div>
                {ticket.mensaje || "(Sin detalle registrado)"}
              </div>

              <div className="admin-ticket-actions">
                <div>
                  {renderStatusBadge(ticket.estado)}
                </div>

                <button
                  type="button"
                  className="admin-status-change-btn"
                  onClick={() => handleStatusTransition(ticket.id, ticket.estado)}
                  disabled={updatingId === ticket.id}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  {updatingId === ticket.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <span>Avanzar a: {NEXT_STATUS[ticket.estado] || "Pendiente"}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Admin;

/*
 * ---------------------------------------------------------------------------
 * NOTAS DE IMPLEMENTACIÓN
 * ---------------------------------------------------------------------------
 *
 * Descripción General:
 * Vista interactiva de administración que sincroniza tickets en tiempo real con Firestore,
 * permite transiciones de estado ágiles y filtrado local sin recargar con iconos Lucide.
 *
 * Lógica Clave:
 * - onSnapshot: Suscripción en vivo a la colección 'reclamaciones' con limpieza al desmontar.
 * - Filtro Local (useState): Clasificación en memoria ('Todos', 'Pendiente', 'En proceso', 'Resuelto').
 * - updateDoc: Actualización atómica del campo 'estado' hacia el siguiente estado en el ciclo.
 * - Formato de Fechas: Conversión segura de Timestamp de Firestore a formato legible en español.
 *
 * Dependencias Externas:
 * - lucide-react (ShieldCheck, LogOut, Clock, RefreshCw, CheckCircle2, Filter, Calendar, User, Mail, ArrowRight, Loader2, AlertCircle, Inbox, Home, MessageSquare)
 * - firebase/firestore (collection, onSnapshot, doc, updateDoc)
 * - react-router-dom (Link)
 * - src/firebase.js (db)
 * - src/context/AuthContext.jsx (useAuth)
 *
 */
