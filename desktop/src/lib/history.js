// Undo / redo for deck edits. History holds patches, not snapshots: each entry
// names only the sets one edit touched, with their content before and after.
// Undoing in one deck window therefore never rolls back what another window
// did to its own set in the meantime. View state (mode, focus, active tabs) is
// not content, so focusing or spotlighting a pane never lands in history; the
// arrangement (`layout`: grid shape and dragged sizes) is.

export const EMPTY_HISTORY = Object.freeze({ past: [], future: [] });

const content = (set) => (set ? JSON.stringify([set.name ?? "", set.windows ?? [], set.layout ?? null]) : null);

/** The patch that turns `prev` into `next`, or null when no content changed. */
export function diffSets(prev, next) {
  const before = new Map(prev.map((set) => [set.id, set]));
  const after = new Map(next.map((set) => [set.id, set]));
  const sets = {};
  for (const id of new Set([...before.keys(), ...after.keys()])) {
    const a = before.get(id) ?? null;
    const b = after.get(id) ?? null;
    if (content(a) !== content(b)) sets[id] = { before: a, after: b };
  }
  const orderBefore = prev.map((set) => set.id);
  const orderAfter = next.map((set) => set.id);
  const reordered = orderBefore.join("\n") !== orderAfter.join("\n");
  if (!Object.keys(sets).length && !reordered) return null;
  return { sets, order: reordered ? { before: orderBefore, after: orderAfter } : null };
}

export function record(history, entry) {
  if (!entry) return history;
  return { past: [...history.past, entry], future: [] };
}

/** Replaces the newest entry, so a burst of small steps (arrow-key resizing) undoes as one. */
export function replaceLast(history, entry) {
  if (!history.past.length) return record(history, entry);
  const past = history.past.slice(0, -1);
  return { past: entry ? [...past, entry] : past, future: [] };
}

/**
 * Applies one side of a patch. A set that still exists keeps its own view
 * state and takes only the recorded name, windows and arrangement; a set that is gone comes back
 * whole. `locked` ids (sets open in another deck window) are never removed.
 */
export function applyPatch(sets, entry, side, locked = new Set()) {
  let list = [...sets];
  for (const [id, change] of Object.entries(entry.sets)) {
    const target = change[side];
    const index = list.findIndex((set) => set.id === id);
    if (!target) {
      if (index >= 0 && !locked.has(id)) list.splice(index, 1);
    } else if (index >= 0) {
      const { layout, ...rest } = list[index];
      list[index] = { ...rest, name: target.name, windows: target.windows, ...(target.layout ? { layout: target.layout } : {}) };
    } else {
      list.push(target);
    }
  }
  const order = entry.order?.[side];
  if (order) {
    const rank = new Map(order.map((id, index) => [id, index]));
    list = list
      .map((set, index) => ({ set, index }))
      .sort((a, b) => (rank.get(a.set.id) ?? order.length + a.index) - (rank.get(b.set.id) ?? order.length + b.index))
      .map(({ set }) => set);
  }
  return list;
}

export function undo(history, sets, locked) {
  const entry = history.past[history.past.length - 1];
  if (!entry) return null;
  return {
    history: { past: history.past.slice(0, -1), future: [entry, ...history.future] },
    sets: applyPatch(sets, entry, "before", locked),
    entry,
  };
}

export function redo(history, sets, locked) {
  const entry = history.future[0];
  if (!entry) return null;
  return {
    history: { past: [...history.past, entry], future: history.future.slice(1) },
    sets: applyPatch(sets, entry, "after", locked),
    entry,
  };
}

/** What the main process needs to turn its copy of `prev` into `next` (any field, layout included). */
export function storePatchBetween(prev, next) {
  const before = new Map(prev.map((set) => [set.id, set]));
  const ids = new Set(next.map((set) => set.id));
  const put = next.filter((set) => {
    const old = before.get(set.id);
    return old !== set && JSON.stringify(old) !== JSON.stringify(set);
  });
  const remove = prev.filter((set) => !ids.has(set.id)).map((set) => set.id);
  const order = next.map((set) => set.id);
  const added = next.some((set) => !before.has(set.id));
  const reordered = added || prev.filter((set) => ids.has(set.id)).map((set) => set.id).join("\n") !== order.filter((id) => before.has(id)).join("\n");
  if (!put.length && !remove.length && !reordered) return null;
  return { put, remove, ...(reordered ? { order } : {}) };
}
