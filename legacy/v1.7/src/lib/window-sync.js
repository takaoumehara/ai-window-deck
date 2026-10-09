export function resolveRegisteredWindowId(canvasItem, windows) {
  const explicitId = canvasItem?.registeredWindowId;
  if (explicitId && windows.some((window) => window.id === explicitId)) return explicitId;

  if (canvasItem?.id && windows.some((window) => window.id === canvasItem.id)) return canvasItem.id;

  const exactMatch = windows.find(
    (window) => window.name === canvasItem?.name && window.urls === canvasItem?.urls
  );
  if (exactMatch) return exactMatch.id;

  const nameMatches = windows.filter((window) => window.name === canvasItem?.name);
  return nameMatches.length === 1 ? nameMatches[0].id : null;
}

export function applyCanvasWindowEdit({ windows, canvasSlots, editingItem, name, urls }) {
  const registeredWindowId = resolveRegisteredWindowId(editingItem, windows);
  if (!registeredWindowId) {
    return { registeredWindowId: null, windows, canvasSlots };
  }

  return {
    registeredWindowId,
    windows: windows.map((window) => (
      window.id === registeredWindowId ? { ...window, name, urls } : window
    )),
    canvasSlots: canvasSlots.map((slot) => (
      slot.id === editingItem.id
        ? { ...slot, registeredWindowId, name, urls }
        : slot
    )),
  };
}
