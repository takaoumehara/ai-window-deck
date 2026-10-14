import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Smartphone, Tablet } from "lucide-react";
import { SearchList } from "@desktop/components/ui/SearchList";
import { RECENT_GROUP, groupDevices } from "@desktop/lib/device-catalog";

export const deviceLabel = (t, device) => (device.approx ? `${device.name} · ${t("deviceApprox")}` : device.name);

/** Grouped, searchable device list (recently used first). */
export function DeviceList({ t, devices, value, recent, onPick, onEscape, tone, autoFocus, listClassName }) {
  const [query, setQuery] = useState("");
  const groups = useMemo(
    () =>
      groupDevices(devices, { query, recent }).map((group) => ({
        key: group.key,
        label: group.key === RECENT_GROUP ? t("deviceRecent") : group.label,
        items: group.devices.map((device) => {
          const Icon = device.type === "tablet" ? Tablet : Smartphone;
          return {
            id: device.id,
            label: deviceLabel(t, device),
            detail: `${device.width}×${device.height}`,
            title: device.approx ? t("deviceApproxHint") : undefined,
            icon: <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />,
            selected: device.id === value,
          };
        }),
      })),
    [devices, query, recent, value, t]
  );
  return (
    <SearchList
      label={t("deviceSearch")}
      placeholder={t("deviceSearchPlaceholder")}
      query={query}
      onQuery={setQuery}
      groups={groups}
      onPick={onPick}
      onEscape={onEscape}
      emptyLabel={t("deviceNone")}
      tone={tone}
      autoFocus={autoFocus}
      listClassName={listClassName}
    />
  );
}

/**
 * The pane's model button and its drop-down list. The list opens over the
 * page, which is a native view above the DOM, so onOpenChange lets the deck
 * swap the pages for snapshots while it is open.
 */
export function DevicePicker({ t, device, devices, recent, onChange, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const Icon = device.type === "tablet" ? Tablet : Smartphone;

  const setOpenState = (next, { refocus = true } = {}) => {
    setOpen(next);
    onOpenChange?.(next);
    if (!next && refocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpenState(false, { refocus: false });
    };
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  });

  const openRef = useRef(open);
  openRef.current = open;
  const changeRef = useRef(onOpenChange);
  changeRef.current = onOpenChange;
  useEffect(() => () => {
    if (openRef.current) changeRef.current?.(false);
  }, []);

  return (
    <div ref={rootRef} className="min-w-0">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t("deviceModelHint")}
        onClick={() => setOpenState(!open)}
        className="cie-tap deck-focus-ring flex min-w-0 max-w-full items-center gap-1.5 rounded-pill border border-paper-edge py-0.5 pl-2 pr-1.5 text-left transition-colors duration-fast hover:border-paper"
      >
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="register shrink-0 uppercase text-ink-mute">{t("deviceModel")}</span>
        <span className="min-w-0 truncate text-[13px]">{deviceLabel(t, device)}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
      </button>
      {open && (
        <div className="deck-popover absolute left-2 top-10 z-20 flex max-h-[min(440px,calc(100%-48px))] w-[min(340px,calc(100%-16px))] flex-col overflow-hidden rounded-block border border-paper/20 bg-ink text-paper">
          <DeviceList
            t={t}
            devices={devices}
            value={device.id}
            recent={recent}
            tone="ink"
            onPick={(id) => {
              onChange(id);
              setOpenState(false);
            }}
            onEscape={() => setOpenState(false)}
          />
        </div>
      )}
    </div>
  );
}
