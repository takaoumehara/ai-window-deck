import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("light");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      chrome.storage.sync.get({ theme: "light" }, (items) => {
        const savedTheme = items.theme || "light";
        setThemeState(savedTheme);
        applyTheme(savedTheme);
        setLoading(false);
      });
    } else {
      applyTheme("light");
      setLoading(false);
    }
  }, []);

  const applyTheme = (newTheme) => {
    // Remove old classes and attributes
    document.documentElement.classList.remove("light", "dark");
    document.body.classList.remove("light", "dark");
    
    // Apply new theme with both class and data-theme
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.classList.add("dark");
      document.body.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      document.body.setAttribute("data-theme", "light");
    }
    
    console.log('[AI Window Deck] Theme applied:', newTheme);
  };

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      try {
        await chrome.storage.sync.set({ theme: newTheme });
      } catch (error) {
        console.error('[AI Window Deck] Failed to save theme:', error);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  if (loading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
