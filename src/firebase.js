import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Descripción: Inicialización y configuración de Firebase (Firestore y Auth).
 * Requiere: Credenciales de configuración del proyecto Firebase.
 * Implementa: Módulo central de conexión a Firebase.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

/*
 * ---------------------------------------------------------------------------
 * NOTAS DE IMPLEMENTACIÓN
 * ---------------------------------------------------------------------------
 *
 * Descripción General:
 * Archivo centralizado para inicializar la aplicación de Firebase y exportar
 * las instancias de Firestore y Authentication para su consumo en toda la app.
 *
 * Lógica Clave:
 * - Inicializa Firebase App mediante initializeApp con la configuración del proyecto.
 * - Exporta las instancias de Firestore (db) y Auth (auth) sin lógica de negocio.
 *
 * Dependencias Externas:
 * - firebase/app (initializeApp)
 * - firebase/firestore (getFirestore)
 * - firebase/auth (getAuth)
 *
 */
