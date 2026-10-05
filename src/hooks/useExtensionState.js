import { useState, useEffect } from "react";

const DEFAULTS = {
  // "" = follow the browser UI language until the user picks one. It must stay
  // a key here (storage.get only returns listed keys) and must not be null
  // (storage.get rejects null defaults).
  language: "",
  activePreset: 0,
  presets: [
    {
      name: "A",
      layoutId: "2x2",
      columns: 2,
      rows: 2,
      cells: null,
      shape: null,
      slots: [],
    },
    {
      name: "B",
      layoutId: "3x1",
      columns: 3,
      rows: 1,
      cells: null,
      shape: null,
      slots: [],
    },
  ],
  profiles: [
    {
      id: "profile-default",
      name: "Default Profile",
      createdAt: Date.now(),
    },
  ],
  activeProfileId: "profile-default",
  targetDisplay: "focused",
  targetDisplays: [],
  sameDisplayOnly: true,
  spotlightSize: "full",
  spotlightWidth: 70,
  spotlightHeight: 90,
  spotlightAnchor: "keep",
  oddMode: "blank",
  splitMode: "auto",
  onboardingSeen: false,
};

export function useExtensionState() {
  const [state, setState] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      chrome.storage.sync.get(DEFAULTS, (items) => {
        setState({ ...DEFAULTS, ...items });
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const updateState = (updates) => {
    const nextState = { ...state, ...updates };
    setState(nextState);
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      chrome.storage.sync.set(updates);
    }
  };

  return { state, updateState, loading, defaultState: DEFAULTS };
}
