import React, { useEffect, useRef, useState } from "react";
import { Plus, Minus, ClipboardPaste, ClipboardList, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Sheet } from "@desktop/components/ui/Sheet";
import { Button, Choices, Field } from "@desktop/components/ui/controls";
import { dropTarget, moveItem } from "@desktop/lib/tabs";
import { extractUrls, mergeUrls, urlKey } from "@desktop/lib/deck-data";

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
  const [paste, setPaste] = useState(null);
  const [lastChange, setLastChange] = useState(null);
  const buttons = useRef(new Map());
  const pasteRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setName(item?.name || "");
    const lines = String(item?.urls || "").split("\n").map((line) => line.trim()).filter(Boolean);
    setRows(lines.length ? lines.map((line) => makeRow(line)) : [makeRow()]);
    setAnnouncement("");
    setPaste(null);
    setLastChange(null);
  }, [open, item]);

  const focusField = (key) => requestAnimationFrame(() => buttons.current.get(`${key}:field`)?.focus());

  // A bulk change keeps the rows it replaced, so Undo under the list puts them back.
  const applyRows = (next, message, focusKey) => {
    setLastChange({ rows, message });
    setRows(next.length ? next : [makeRow()]);
    setAnnouncement(message);
    if (focusKey) focusField(focusKey);
  };

  const undoChange = () => {
    if (!lastChange) return;
    setRows(lastChange.rows);
    setLastChange(null);
    setAnnouncement(t("urlsUndone"));
  };

  const pasted = paste ? extractUrls(paste.text) : [];
  const preview = paste ? mergeUrls(rows.map((row) => row.value), pasted, paste.mode) : null;

  const applyPaste = () => {
    if (!paste || !pasted.length) return;
    const kept = paste.mode === "replace" ? [] : rows.filter((row) => row.value.trim());
    const known = new Set(kept.map((row) => urlKey(/^[a-z][a-z0-9+.-]*:/i.test(row.value.trim()) ? row.value.trim() : `https://${row.value.trim()}`)));
    const added = pasted.filter((url) => !known.has(urlKey(url))).map((url) => makeRow(url));
    if (!added.length) {
      setAnnouncement(t("urlsPasteNothingNew"));
      return;
    }
    applyRows(
      [...kept, ...added],
      paste.mode === "replace" ? t("urlsReplacedMsg", { count: added.length }) : t("urlsAddedMsg", { count: added.length }),
      added[0].key
    );
    setPaste(null);
  };

  // Several URLs pasted into one field become rows of their own.
  const splitPaste = (event, index) => {
    const text = event.clipboardData?.getData("text") ?? "";
    if (!/[\r\n]/.test(text.trim()) && !/[\s,;、]/.test(text.trim())) return;
    const urls = extractUrls(text);
    if (urls.length < 2) return;
    event.preventDefault();
    const row = rows[index];
    const field = event.currentTarget;
    const whole = !row.value.trim() || (field.selectionStart === 0 && field.selectionEnd === row.value.length);
    const others = rows.filter((_, at) => at !== index || !whole);
    const known = new Set(others.map((candidate) => candidate.value.trim()).filter(Boolean).map((value) => urlKey(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`)));
    const fresh = urls.filter((url) => !known.has(urlKey(url))).map((url) => makeRow(url));
    if (!fresh.length) return;
    const next = whole ? [...rows.slice(0, index), ...fresh, ...rows.slice(index + 1)] : [...rows.slice(0, index + 1), ...fresh, ...rows.slice(index + 1)];
    applyRows(next, t("urlsSplitMsg", { count: fresh.length }), fresh.at(-1).key);
  };

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
      toolbar={
        <div className="flex items-center gap-3">
          <label htmlFor={`${fieldId}-name`} className="cie-mono shrink-0 text-paper-mute">{t("nameLabel")}</label>
          <Field id={`${fieldId}-name`} form={`${fieldId}-form`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Claude" />
        </div>
      }
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
                  onPaste={(event) => splitPaste(event, index)}
                  onKeyDown={(event) => {
                    if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
                    event.preventDefault();
                    move(index, index + (event.key === "ArrowUp" ? -1 : 1), [row.key, "field"]);
                  }}
                  placeholder="https://claude.ai"
                  spellCheck={false}
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
          {lastChange && (
            <p className="mt-1 flex items-center gap-3 rounded-tick bg-ink/[0.05] px-3 py-1.5 text-xs">
              <span className="min-w-0 flex-1">{lastChange.message}</span>
              <button type="button" onClick={undoChange} className="cie-press cie-mono shrink-0 text-ink underline-offset-2 hover:underline">
                {t("undo")}
              </button>
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1">
            <button
              type="button"
              onClick={() => {
                const row = makeRow();
                setRows([...rows, row]);
                focusField(row.key);
              }}
              className="cie-press cie-mono inline-flex items-center gap-1.5 py-1 text-ink"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t("addUrl")}
            </button>
            <button
              type="button"
              aria-expanded={Boolean(paste)}
              onClick={() => {
                setPaste(paste ? null : { text: "", mode: "append" });
                if (!paste) requestAnimationFrame(() => pasteRef.current?.focus());
              }}
              className="cie-press cie-mono inline-flex items-center gap-1.5 py-1 text-ink"
            >
              <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
              {t("urlsPasteMode")}
            </button>
          </div>
          {paste && (
            <div className="mt-1 flex flex-col gap-3 rounded-block border border-ink-edge p-3">
              <label htmlFor={`${fieldId}-paste`} className="cie-mono text-paper-mute">{t("urlsPasteLabel")}</label>
              <textarea
                ref={pasteRef}
                id={`${fieldId}-paste`}
                value={paste.text}
                onChange={(event) => setPaste({ ...paste, text: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    applyPaste();
                  }
                }}
                placeholder={t("urlsPastePlaceholder")}
                rows={5}
                spellCheck={false}
                className="w-full resize-y rounded-tick border border-ink-edge bg-transparent px-3 py-2 font-mono text-xs leading-5 text-ink transition-colors duration-fast placeholder:text-ink-hint hover:border-ink focus:border-ink deck-focus-ring"
              />
              <p className="text-xs leading-5 text-paper-mute">{t("urlsPasteHelp")}</p>
              <Choices
                label={t("urlsPasteHow")}
                columns="grid-cols-2"
                options={[{ value: "append", label: t("urlsPasteAppend") }, { value: "replace", label: t("urlsPasteReplace") }]}
                value={paste.mode}
                onChange={(mode) => setPaste({ ...paste, mode })}
              />
              <div className="flex flex-wrap items-center gap-3">
                <span className="register min-w-0 flex-1 text-paper-mute" aria-live="polite">
                  {!pasted.length
                    ? paste.text.trim() ? t("urlsPasteNone") : ""
                    : preview.duplicates
                      ? t("urlsPasteFoundDupes", { count: pasted.length, dupes: preview.duplicates })
                      : t("urlsPasteFound", { count: pasted.length })}
                </span>
                <Button onClick={() => setPaste(null)}>{t("cancel")}</Button>
                <Button tone="ink" disabled={!pasted.length || (paste.mode === "append" && !preview.added)} onClick={applyPaste}>
                  {paste.mode === "replace" ? t("urlsPasteReplaceN", { count: pasted.length }) : t("urlsPasteAppendN", { count: preview?.added ?? 0 })}
                </Button>
              </div>
            </div>
          )}
        </fieldset>
      </form>
    </Sheet>
  );
}
