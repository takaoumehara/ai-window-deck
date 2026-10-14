import React from "react";

// Desktop plus the devices chosen in Settings. The current tab's device stays
// in the row even when it isn't one of those, so it can be changed back.
export function DeviceSwitch({ t, focused, devices, currentId, catalog, onChange }) {
  const options = [{ id: "", name: t("deviceDesktop") }];
  const seen = new Set();
  for (const device of devices) {
    if (seen.has(device.id)) continue;
    seen.add(device.id);
    options.push({ id: device.id, name: device.name });
  }
  if (currentId && !seen.has(currentId)) {
    const extra = catalog.find((device) => device.id === currentId);
    if (extra) options.push({ id: extra.id, name: extra.name });
  }
  return (
    <div
      role="radiogroup"
      aria-label={t("deviceModel")}
      className="flex min-w-0 max-w-[14rem] items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onClick={(event) => event.stopPropagation()}
    >
      {options.map((option) => {
        const selected = (currentId || "") === option.id;
        const tone = selected
          ? focused ? "border-ink bg-ink text-paper" : "border-paper bg-paper text-ink"
          : focused ? "border-ink/25 text-ink hover:border-ink/60" : "border-paper/25 text-ink-mute hover:border-paper/60 hover:text-paper";
        return (
          <button
            key={option.id || "desktop"}
            type="button"
            role="radio"
            aria-checked={selected}
            title={option.name}
            onClick={() => onChange(option.id || null)}
            className={`register cie-tap max-w-[8.5rem] shrink-0 truncate rounded-pill border px-2 py-0.5 ${tone}`}
          >
            {option.name}
          </button>
        );
      })}
    </div>
  );
}
