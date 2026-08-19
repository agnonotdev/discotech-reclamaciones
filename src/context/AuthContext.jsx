import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase.js";

/**
 * Descripción: Contexto global de autenticación con Firebase Auth.
 * Requiere: Instancia de auth inicializada.
 * Implementa: Proveedor de estado de sesión y métodos de login/logout.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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
 * Administra el estado de autenticación del usuario mediante Firebase Auth,
 * sincronizando la sesión con onAuthStateChanged y exponiendo métodos de acceso.
 *
 * Lógica Clave:
 * - Monitorea cambios de sesión en tiempo real.
 * - Soporta inicio de sesión con correo/contraseña y proveedor Google.
 * - Evita renderizar antes de resolver el estado inicial de autenticación (loading).
 * - Provee el hook useAuth para un consumo seguro y desacoplado.
 *
 * Dependencias Externas:
 * - firebase/auth (onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut)
 * - src/firebase.js (auth)
 *
 */
