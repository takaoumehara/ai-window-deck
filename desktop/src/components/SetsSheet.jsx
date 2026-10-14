import React, { useEffect, useRef, useState } from "react";
import { AppWindow, Copy, Minus, Pencil, Plus } from "lucide-react";
import { Sheet } from "@desktop/components/ui/Sheet";
import { Button, Field } from "@desktop/components/ui/controls";

function RowButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="cie-tap grid h-7 w-7 shrink-0 place-items-center rounded-pill transition-colors duration-fast hover:bg-btn disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function RenameField({ t, initial, onDone }) {
  const [value, setValue] = useState(initial);
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const finish = (save) => onDone(save ? value.trim() : null);
  return (
    <form
      className="min-w-0 flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        finish(true);
      }}
    >
      <Field
        ref={ref}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          event.stopPropagation();
          finish(false);
        }}
        aria-label={t("nameLabel")}
        className="h-8"
      />
    </form>
  );
}

// Each set is a list of windows with its own layout. A set shows in at most
// one deck window; picking one that is open elsewhere brings that window up.
export function SetsSheet({
  t, open, onClose, sets, currentSetId, openElsewhere, setLabel, setKey, newWindowKey,
  onSwitch, onCreate, onRename, onDuplicate, onDelete, onOpenWindow,
}) {
  const fieldId = React.useId();
  const [renaming, setRenaming] = useState(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!open) return;
    setRenaming(null);
    setNewName("");
  }, [open]);

  const create = (event) => {
    event.preventDefault();
    onCreate(newName.trim());
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={t("setsTitle")} closeLabel={t("close")}>
      <div className="flex flex-col gap-5">
        <p className="text-xs leading-5 text-paper-mute">{t("setsHint", { key: newWindowKey })}</p>
        <ol className="cie-stagger flex flex-col">
          {sets.map((set, index) => {
            const current = set.id === currentSetId;
            const elsewhere = openElsewhere.includes(set.id);
            const name = setLabel(set);
            const count = set.windows.length;
            return (
              <li key={set.id} className="cie-rise flex items-center gap-2 border-t border-ink/10 py-2">
                <span className="register w-5 shrink-0 text-right text-paper-mute">{index + 1}</span>
                {renaming === set.id ? (
                  <RenameField
                    t={t}
                    initial={name}
                    onDone={(value) => {
                      if (value && value !== name) onRename(set.id, value);
                      setRenaming(null);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onSwitch(set.id);
                      onClose();
                    }}
                    onDoubleClick={() => setRenaming(set.id)}
                    aria-current={current ? "true" : undefined}
                    className="cie-tap flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-tick py-0.5 text-left"
                  >
                    <span className="weight max-w-full truncate text-sm" style={{ "--w": current ? 600 : 400 }}>{name}</span>
                    <span className="register text-paper-mute">
                      {count} {t(count === 1 ? "windowSingular" : "windowsCount")}
                      {current ? ` · ${t("setCurrent")}` : elsewhere ? ` · ${t("setOpenElsewhere")}` : ""}
                    </span>
                  </button>
                )}
                {index < 9 && <kbd className="key shrink-0">{setKey(index + 1)}</kbd>}
                <RowButton label={t("renameSet", { name })} onClick={() => setRenaming(set.id)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </RowButton>
                <RowButton label={t("duplicateSet", { name })} onClick={() => onDuplicate(set.id)}>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                </RowButton>
                <RowButton
                  label={t("openSetWindow", { name })}
                  disabled={current}
                  onClick={() => {
                    onOpenWindow(set.id);
                    onClose();
                  }}
                >
                  <AppWindow className="h-3.5 w-3.5" aria-hidden="true" />
                </RowButton>
                <RowButton
                  label={elsewhere ? t("setCantDeleteOpen", { name }) : sets.length < 2 ? t("setCantDeleteLast") : t("deleteSet", { name })}
                  disabled={elsewhere || sets.length < 2}
                  onClick={() => onDelete(set.id)}
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </RowButton>
              </li>
            );
          })}
        </ol>
        <form onSubmit={create} className="flex items-center gap-2">
          <label htmlFor={`${fieldId}-new`} className="sr-only">{t("newSet")}</label>
          <Field id={`${fieldId}-new`} value={newName} onChange={(event) => setNewName(event.target.value)} placeholder={t("newSet")} />
          <Button type="submit" tone="ink" className="shrink-0">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t("createSet")}
          </Button>
        </form>
      </div>
    </Sheet>
  );
}
