import { useState } from "react";
import { Sun, Moon, Monitor, SunDim, MoonStar } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import "./ThemeToggle.css";

const themes = [
  { id: "system", label: "Sistema", icon: Monitor },
  { id: "claro", label: "Original Claro", icon: Sun },
  { id: "oscuro", label: "Original Oscuro", icon: Moon },
  { id: "solarized-light", label: "Solarized Light", icon: SunDim },
  { id: "solarized-dark", label: "Solarized Dark", icon: MoonStar }
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const currentThemeObj = themes.find((t) => t.id === theme) || themes[0];
  const CurrentIcon = currentThemeObj.icon;

  const handleSelect = (id) => {
    setTheme(id);
  };

  return (
    <div 
      className="theme-toggle-container"
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={"theme-toggle-options " + (isExpanded ? "expanded" : "")}>
        {themes.map((t) => {
          const Icon = t.icon;
          const isActive = t.id === theme;
          return (
            <button
              key={t.id}
              className={"theme-toggle-btn " + (isActive ? "active" : "")}
              onClick={() => handleSelect(t.id)}
              aria-label={t.label}
            >
              <Icon size={15} />
              <span className="theme-tooltip">{t.label}</span>
            </button>
          );
        })}
      </div>
      
      <div className="theme-toggle-main-wrapper">
        <span className="theme-toggle-beta-badge">BETA</span>
        <button 
          className="theme-toggle-main-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label="Cambiar tema"
          title="Cambiar tema"
        >
          <CurrentIcon size={16} />
        </button>
      </div>
    </div>
  );
}

