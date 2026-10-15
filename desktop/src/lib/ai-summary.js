// Renderer side of the AI status (electron/ai-status.cjs reads the pages).

export const AI_DEFAULTS = { enabled: true, notify: true, sound: false, off: [] };

export function aiSettingsOf(saved) {
  const value = saved && typeof saved === "object" ? saved : {};
  return {
    enabled: value.enabled !== false,
    notify: value.notify !== false,
    sound: value.sound === true,
    off: Array.isArray(value.off) ? value.off.filter((id) => typeof id === "string") : [],
  };
}

/** Counts for the top bar. */
export function summarize(statuses) {
  const counts = { working: 0, "needs-you": 0, done: 0, error: 0 };
  for (const entry of statuses) if (entry?.status && entry.status in counts) counts[entry.status] += 1;
  return counts;
}

/**
 * The pane to jump to with ⌘J: one that needs you first, then errors, then
 * finished ones, starting after the current pane and wrapping. Working panes
 * are never jumped to.
 */
export function nextAttention(order, statuses, current) {
  const start = order.indexOf(current);
  const rotated = start < 0 ? order : [...order.slice(start + 1), ...order.slice(0, start + 1)];
  for (const status of ["needs-you", "error", "done"]) {
    const found = rotated.find((id) => statuses[id]?.status === status && id !== current);
    if (found) return found;
  }
  return null;
}

/** Panes that can take a broadcast prompt, in deck order. */
export function broadcastTargets(order, sites) {
  return order.filter((id) => sites[id]);
}
