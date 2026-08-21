import { ThemeProvider } from "./context/ThemeContext.jsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { Home } from "./pages/Home.jsx";
import { Login } from "./pages/Login.jsx";
import { Admin } from "./pages/Admin.jsx";
import { Footer } from "./components/Footer.jsx";
import { ThemeToggle } from "./components/ThemeToggle.jsx";

/**
 * Descripción: Componente raíz de la aplicación con configuración de rutas y proveedores globales.
 * Requiere: React Router DOM y AuthProvider.
 * Implementa: Enrutamiento general y protección de acceso administrativo.
 */

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <ThemeToggle />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

/*
 * ---------------------------------------------------------------------------
 * NOTAS DE IMPLEMENTACIÓN
 * ---------------------------------------------------------------------------
 *
 * Descripción General:
 * Define el árbol de navegación principal envolviendo toda la aplicación con AuthProvider
 * y configurando las rutas públicas, la ruta protegida /admin y el pie de página global.
 *
 * Lógica Clave:
 * - / : Página pública con el formulario de reclamaciones (Home).
 * - /admin/login : Página de autenticación para administradores (Login).
 * - /admin : Panel administrativo restringido exclusivamente a través de ProtectedRoute.
 * - * : Redirección automática a la raíz para rutas no reconocidas.
 * - Footer : Componente global visible en la parte inferior de todas las vistas.
 *
 * Dependencias Externas:
 * - react-router-dom (BrowserRouter, Routes, Route, Navigate)
 * - src/context/AuthContext.jsx (AuthProvider)
 * - src/components/ProtectedRoute.jsx (ProtectedRoute)
 * - src/components/Footer.jsx (Footer)
 * - src/pages/Home.jsx (Home)
 * - src/pages/Login.jsx (Login)
 * - src/pages/Admin.jsx (Admin)
 *
 */


