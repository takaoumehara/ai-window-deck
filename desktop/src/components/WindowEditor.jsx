import React, { useEffect, useRef, useState } from "react";
import { Plus, Minus, ClipboardPaste, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Sheet } from "@desktop/components/ui/Sheet";
import { Button, Field } from "@desktop/components/ui/controls";
import { dropTarget, moveItem } from "@desktop/lib/tabs";

let rowSeed = 0;
const makeRow = (value = "") => ({ key: `row-${(rowSeed += 1)}`, value });

function RowButton({ label, onClick, disabled, buttonRef, children }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="cie-tap grid h-8 w-6 shrink-0 place-items-center rounded-pill transition-colors duration-fast hover:bg-btn disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function WindowEditor({ t, open, item, onClose, onSave, onPasteList }) {
  const fieldId = React.useId();
  const [name, setName] = useState("");
  const [rows, setRows] = useState(() => [makeRow()]);
  const [dragging, setDragging] = useState(null);
  const [gap, setGap] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const buttons = useRef(new Map());

  useEffect(() => {
    if (!open) return;
    setName(item?.name || "");
    const lines = String(item?.urls || "").split("\n").map((line) => line.trim()).filter(Boolean);
    setRows(lines.length ? lines.map((line) => makeRow(line)) : [makeRow()]);
    setAnnouncement("");
  }, [open, item]);

  const move = (from, to, focusKey) => {
    const next = moveItem(rows, from, to);
    if (next === rows) return;
    setRows(next);
    setAnnouncement(t("urlMovedMsg", { n: next.indexOf(rows[from]) + 1, count: next.length }));
    // A moved node loses focus in Chromium, so the same button takes it back
    // (or its sibling, once the row reaches the end of the list).
    if (focusKey) {
      requestAnimationFrame(() => {
        const [key, direction] = focusKey;
        const target = buttons.current.get(`${key}:${direction}`);
        const sibling = direction === "field" ? null : buttons.current.get(`${key}:${direction === "up" ? "down" : "up"}`);
        (target && !target.disabled ? target : sibling)?.focus();
      });
    }
  };

  const endDrag = () => {
    setDragging(null);
    setGap(null);
  };

  const submit = (event) => {
    event.preventDefault();
    const urls = rows.map((row) => row.value.trim()).filter(Boolean).join("\n");
    if (!name.trim() && !urls) return;
    onSave({ id: item?.id, name: name.trim() || t("untitledWindow"), urls });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={item ? t("editWindow") : t("addWindow")}
      closeLabel={t("close")}
      wide
      footer={
        <>
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button type="submit" form={`${fieldId}-form`} tone="ink">{t("save")}</Button>
        </>
      }
    >
      <form id={`${fieldId}-form`} onSubmit={submit} className="flex flex-col gap-5">
        {!item && onPasteList && (
          <button
            type="button"
            onClick={onPasteList}
            className="cie-tap flex items-center gap-3 rounded-block border border-dashed border-ink-edge px-3 py-2.5 text-left transition-colors duration-fast hover:border-ink"
          >
            <ClipboardPaste className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm">{t("pasteInstead")}</span>
              <span className="text-xs text-paper-mute">{t("pasteListHint")}</span>
            </span>
          </button>
        )}
        <div className="flex flex-col gap-2">
          <label htmlFor={`${fieldId}-name`} className="cie-mono text-paper-mute">{t("nameLabel")}</label>
          <Field id={`${fieldId}-name`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Claude" />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="cie-mono mb-1 text-paper-mute">{t("urlsLabel")}</legend>
          {rows.length > 1 && <p className="mb-1 text-xs text-paper-mute">{t("urlsOrderHint")}</p>}
          <ol className="flex flex-col gap-2" onDragLeave={(event) => event.currentTarget === event.target && setGap(null)}>
            {rows.map((row, index) => (
              <li
                key={row.key}
                className={`relative flex items-center gap-1.5 ${dragging === row.key ? "opacity-40" : ""}`}
                onDragOver={(event) => {
                  if (!dragging) return;
                  event.preventDefault();
                  const box = event.currentTarget.getBoundingClientRect();
                  setGap(event.clientY < box.top + box.height / 2 ? index : index + 1);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const from = rows.findIndex((candidate) => candidate.key === dragging);
                  if (from >= 0 && gap != null) move(from, dropTarget(from, gap));
                  endDrag();
                }}
              >
                {dragging && gap === index && <span className="absolute -top-1.5 left-0 right-0 h-0.5 rounded-pill bg-ink" aria-hidden="true" />}
                {dragging && gap === index + 1 && index === rows.length - 1 && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-pill bg-ink" aria-hidden="true" />
                )}
                {rows.length > 1 && (
                  <span
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", row.value);
                      const line = event.currentTarget.closest("li");
                      if (line) event.dataTransfer.setDragImage(line, 12, line.offsetHeight / 2);
                      setDragging(row.key);
                    }}
                    onDragEnd={endDrag}
                    title={t("dragToReorder")}
                    aria-hidden="true"
                    className="grid h-8 w-5 shrink-0 cursor-grab place-items-center text-paper-mute active:cursor-grabbing"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                )}
                <span className="register w-5 shrink-0 text-right text-paper-mute">{String(index + 1).padStart(2, "0")}</span>
                <Field
                  ref={(element) => (element ? buttons.current.set(`${row.key}:field`, element) : buttons.current.delete(`${row.key}:field`))}
                  value={row.value}
                  aria-label={`URL ${index + 1}`}
                  title={rows.length > 1 ? t("urlsOrderKeys") : undefined}
                  onChange={(event) => setRows(rows.map((candidate) => (candidate.key === row.key ? { ...candidate, value: event.target.value } : candidate)))}
                  onKeyDown={(event) => {
                    if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
                    event.preventDefault();
                    move(index, index + (event.key === "ArrowUp" ? -1 : 1), [row.key, "field"]);
                  }}
                  placeholder="https://claude.ai"
                  className="font-mono text-xs"
                />
                {rows.length > 1 && (
                  <>
                    <RowButton
                      label={t("moveUrlUp", { n: index + 1 })}
                      disabled={index === 0}
                      buttonRef={(element) => (element ? buttons.current.set(`${row.key}:up`, element) : buttons.current.delete(`${row.key}:up`))}
                      onClick={() => move(index, index - 1, [row.key, "up"])}
                    >
                      <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    </RowButton>
                    <RowButton
                      label={t("moveUrlDown", { n: index + 1 })}
                      disabled={index === rows.length - 1}
                      buttonRef={(element) => (element ? buttons.current.set(`${row.key}:down`, element) : buttons.current.delete(`${row.key}:down`))}
                      onClick={() => move(index, index + 1, [row.key, "down"])}
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </RowButton>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setRows(rows.length > 1 ? rows.filter((candidate) => candidate.key !== row.key) : [makeRow()])}
                  aria-label={t("removeUrl", { n: index + 1 })}
                  title={t("removeUrl", { n: index + 1 })}
                  className="cie-tap grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-btn transition-colors duration-fast hover:bg-btn-hover"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
          <span className="sr-only" aria-live="polite">{announcement}</span>
          <button
            type="button"
            onClick={() => setRows([...rows, makeRow()])}
            className="cie-press cie-mono mt-1 inline-flex items-center gap-1.5 self-start py-1 text-ink"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t("addUrl")}
          </button>
        </fieldset>
      </form>
    </Sheet>
  );
}
