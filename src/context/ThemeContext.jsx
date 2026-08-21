import { createContext, useContext, useEffect, useState } from "react";

/**
 * Descripción: Contexto para gestionar el tema de la aplicación (claro, oscuro, solarized-light, solarized-dark, system).
 * Requiere: React Context.
 * Implementa: Estado global del tema, persistencia en localStorage y actualización del atributo data-theme.
 */

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app-theme") || "system";
  });

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    const root = document.documentElement;

    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme debe ser usado dentro de un ThemeProvider");
  }
  return context;
}

/*
 * ---------------------------------------------------------------------------
 * NOTAS DE IMPLEMENTACIÓN
 * ---------------------------------------------------------------------------
 *
 * Descripción General:
 * Proporciona el estado global del tema actual de la aplicación, permitiendo
 * alternar entre los distintos modos configurados en el proyecto.
 *
 * Lógica Clave:
 * - El estado inicial intenta leer app-theme de localStorage, por defecto es 'system'.
 * - Un useEffect sincroniza el valor del tema con el atributo data-theme del html.
 * - Soporta los temas: claro, oscuro, solarized-light, solarized-dark, y system.
 *
 */
