import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase.js";

/**
 * Descripción: Contexto global de autenticación y autorización con verificación de rol administrativo en Firestore.
 * Requiere: Instancias de auth y db (Firestore) inicializadas.
 * Implementa: Proveedor de estado de sesión, verificación contra colección 'admins' y métodos de acceso/cierre de sesión.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        try {
          const adminRef = doc(db, "admins", user.email);
          const adminSnap = await getDoc(adminRef);

          if (adminSnap.exists()) {
            setCurrentUser(user);
            setIsAdmin(true);
          } else {
            // No autorizado: cierra sesión y no lo dejes pasar
            await signOut(auth);
            setCurrentUser(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error(error);
          // En caso de error de permisos o red, se revoca la sesión local
          await signOut(auth);
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  function logout() {
    return signOut(auth);
  }

  const value = {
    currentUser,
    isAdmin,
    login,
    loginWithGoogle,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}

export default AuthContext;

/*
 * ---------------------------------------------------------------------------
 * NOTAS DE IMPLEMENTACIÓN
 * ---------------------------------------------------------------------------
 *
 * Descripción General:
 * Administra el estado de autenticación y autorización del usuario mediante
 * Firebase Auth y Firestore, verificando la membresía en la colección 'admins'.
 *
 * Lógica Clave:
 * - Monitorea cambios de sesión en tiempo real con onAuthStateChanged.
 * - Comprueba la existencia del documento correspondiente al correo del usuario en 'admins'.
 * - Cierra la sesión automáticamente mediante signOut si el correo no está registrado como administrador.
 * - Expone el estado isAdmin junto a currentUser y los métodos de autenticación.
 *
 * Dependencias Externas:
 * - firebase/auth (onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut)
 * - firebase/firestore (doc, getDoc)
 * - src/firebase.js (auth, db)
 *
 */
