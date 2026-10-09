import React, { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const SHEET_MS = 300;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// cie-ds centered sheet (interactions.css .cie-sheet--center): paper panel on the
// ink ground. Stays mounted through the --cie-t-sheet close so it can animate out.
export function Sheet({ open, onClose, title, closeLabel, children }) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const panelRef = useRef(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(frame);
    }
    setShown(false);
    const timer = window.setTimeout(() => setMounted(false), reducedMotion() ? 0 : SHEET_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open || !mounted) return undefined;
    const opener = document.activeElement;
    const panel = panelRef.current;
    const focusables = () => [...(panel?.querySelectorAll(FOCUSABLE) ?? [])];
    (panel?.querySelector("input, textarea, select") ?? focusables()[0] ?? panel)?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [open, mounted]);

  if (!mounted) return null;

  return (
    <>
      <div className={`cie-sheet-backdrop ${shown ? "is-on" : ""}`} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`cie-sheet cie-sheet--center cie-on-paper focus:outline-none ${shown ? "is-open" : ""}`}
      >
        <div className="cie-sheet__head">
          <h2 id={titleId} className="cie-sheet__title">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="cie-tap grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-btn transition-colors duration-fast hover:bg-btn-hover"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
