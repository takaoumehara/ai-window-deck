import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setThemeState] = useState("dark");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      chrome.storage.sync.get({ theme: "dark" }, (items) => {
        const savedTheme = items.theme || "dark";
        setThemeState(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      chrome.storage.sync.set({ theme: newTheme });
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return { theme, setTheme, toggleTheme, loading };
}
