import defaults from "../../electron/pane-sleep.json" with { type: "json" };

export const SLEEP_MINUTES = defaults.choices;

// Same rules as electron/pane-sleep.cjs sleepSettingsOf, which the main process uses.
export function sleepPrefsOf(saved) {
  const value = saved && typeof saved === "object" ? saved : {};
  return {
    enabled: value.enabled === undefined ? defaults.enabled : value.enabled === true,
    minutes: SLEEP_MINUTES.includes(value.minutes) ? value.minutes : defaults.minutes,
  };
}
