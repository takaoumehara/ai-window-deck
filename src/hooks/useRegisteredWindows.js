import { useState, useEffect } from "react";

export function useRegisteredWindows() {
  const [windows, setWindows] = useState([]);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      chrome.storage.sync.get({ registeredWindows: [] }, (res) => {
        if (Array.isArray(res.registeredWindows) && res.registeredWindows.length > 0) {
          setWindows(res.registeredWindows);
        } else {
          // Initial default windows if empty
          const defaults = [
            { id: "win-1", name: "Research", urls: "https://example.com/docs\nhttps://example.org", color: "auto" },
            { id: "win-2", name: "Chat AI", urls: "https://claude.ai\nhttps://chatgpt.com", color: "auto" },
          ];
          setWindows(defaults);
          chrome.storage.sync.set({ registeredWindows: defaults });
        }
      });
    }
  }, []);

  const saveWindows = (newWindows) => {
    setWindows(newWindows);
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      chrome.storage.sync.set({ registeredWindows: newWindows });
    }
  };

  const addWindow = (item) => {
    const updated = [...windows, { ...item, id: `win-${Date.now()}` }];
    saveWindows(updated);
  };

  const updateWindow = (id, updatedItem) => {
    const updated = windows.map((w) => (w.id === id ? { ...w, ...updatedItem } : w));
    saveWindows(updated);
  };

  const deleteWindow = (id) => {
    const updated = windows.filter((w) => w.id !== id);
    saveWindows(updated);
  };

  return { windows, setWindows: saveWindows, addWindow, updateWindow, deleteWindow };
}
