// Mobile preview: a pane shows its page at a device's viewport inside a
// device frame drawn in the DOM. The page is a native view laid over the
// frame's screen, scaled down (never up) to fit the pane.

// Bezel around the screen, in device pixels: phones with a home button
// (no rounded screen) have deep top and bottom bezels.
export function bezelOf(device, landscape = false) {
  const side = device.type === "tablet" ? 18 : 12;
  const classic = device.cutout === "none" && !device.radius && device.type === "phone";
  const portrait = classic ? { top: 64, right: side, bottom: 64, left: side } : { top: side, right: side, bottom: side, left: side };
  return landscape ? { top: portrait.left, right: portrait.top, bottom: portrait.right, left: portrait.bottom } : portrait;
}

export function deviceViewport(device, landscape = false) {
  return landscape ? { width: device.height, height: device.width } : { width: device.width, height: device.height };
}

/**
 * Size of the frame and its screen for a device in a stage of `box` DOM px,
 * keeping `padding` around it. `scale` maps device px to DOM px.
 */
export function fitDevice(box, device, { landscape = false, padding = 16 } = {}) {
  const viewport = deviceViewport(device, landscape);
  const bezel = bezelOf(device, landscape);
  const outer = { width: viewport.width + bezel.left + bezel.right, height: viewport.height + bezel.top + bezel.bottom };
  const room = { width: Math.max(0, box.width - padding * 2), height: Math.max(0, box.height - padding * 2) };
  const scale = Math.max(0.05, Math.min(1, room.width / outer.width, room.height / outer.height));
  const screen = { width: Math.round(viewport.width * scale), height: Math.round(viewport.height * scale) };
  return {
    scale,
    viewport,
    screen,
    bezel: {
      top: Math.round(bezel.top * scale),
      right: Math.round(bezel.right * scale),
      bottom: Math.round(bezel.bottom * scale),
      left: Math.round(bezel.left * scale),
    },
    radius: Math.round((device.radius || 0) * scale),
  };
}

export function findDevice(devices, id, fallbackId) {
  return devices.find((device) => device.id === id) ?? devices.find((device) => device.id === fallbackId) ?? devices[0] ?? null;
}

// What the main process needs to emulate a pane's device.
export function deviceForPane(device, landscape) {
  if (!device) return null;
  const { id, os, type, width, height, dpr, ua, model, radius } = device;
  return { id, os, type, width, height, dpr, ua, model, radius: radius || 0, landscape: Boolean(landscape) };
}

// "402×874 · 3×", in the orientation shown.
export function deviceMetrics(device, landscape = false) {
  const { width, height } = deviceViewport(device, landscape);
  return `${width}×${height} · ${Number(device.dpr.toFixed(3))}×`;
}
