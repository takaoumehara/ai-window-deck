import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const DialogTitleId = React.createContext(undefined);

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Modal dialog: Escape closes it, focus moves inside on open, Tab stays inside
// while open, and focus returns to whatever opened it on close.
const Dialog = ({ open, onClose, children }) => {
  const panelRef = React.useRef(null);
  const titleId = React.useId();
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (!open) return undefined;
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
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200 focus:outline-none"
      >
        <DialogTitleId.Provider value={titleId}>{children}</DialogTitleId.Provider>
      </div>
    </div>
  );
};

const DialogHeader = ({ className, children, ...props }) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}
    {...props}
  >
    {children}
  </div>
);

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => {
  const id = React.useContext(DialogTitleId);
  return (
    <h2
      ref={ref}
      id={id}
      className={cn("text-lg font-semibold leading-none tracking-tight text-zinc-100", className)}
      {...props}
    />
  );
});
DialogTitle.displayName = "DialogTitle";

const DialogClose = ({ onClick, label = "Close" }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none text-zinc-400 hover:text-white"
  >
    <X className="h-4 w-4" aria-hidden="true" />
  </button>
);

export { Dialog, DialogHeader, DialogTitle, DialogClose };
