import React, { useEffect, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Sheet } from "@desktop/components/ui/Sheet";
import { Button, Field } from "@desktop/components/ui/controls";

export function WindowEditor({ t, open, item, onClose, onSave }) {
  const fieldId = React.useId();
  const [name, setName] = useState("");
  const [rows, setRows] = useState([""]);

  useEffect(() => {
    if (!open) return;
    setName(item?.name || "");
    const lines = String(item?.urls || "").split("\n").map((line) => line.trim()).filter(Boolean);
    setRows(lines.length ? lines : [""]);
  }, [open, item]);

  const submit = (event) => {
    event.preventDefault();
    const urls = rows.map((row) => row.trim()).filter(Boolean).join("\n");
    if (!name.trim() && !urls) return;
    onSave({ id: item?.id, name: name.trim() || t("untitledWindow"), urls });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={item ? t("editWindow") : t("addWindow")} closeLabel={t("close")}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${fieldId}-name`} className="cie-mono text-paper-mute">{t("nameLabel")}</label>
          <Field id={`${fieldId}-name`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Claude" />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="cie-mono mb-2 text-paper-mute">{t("urlsLabel")}</legend>
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="register w-5 shrink-0 text-right text-paper-mute">{String(index + 1).padStart(2, "0")}</span>
              <Field
                value={row}
                aria-label={`URL ${index + 1}`}
                onChange={(event) => setRows(rows.map((value, i) => (i === index ? event.target.value : value)))}
                placeholder="https://claude.ai"
                className="font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setRows(rows.length > 1 ? rows.filter((_, i) => i !== index) : [""])}
                aria-label={t("removeUrl")}
                title={t("removeUrl")}
                className="cie-tap grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-btn transition-colors duration-fast hover:bg-btn-hover"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRows([...rows, ""])}
            className="cie-press cie-mono mt-1 inline-flex items-center gap-1.5 self-start py-1 text-ink"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t("addUrl")}
          </button>
        </fieldset>
        <div className="flex justify-end gap-2 pt-1">
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button type="submit" tone="ink">{t("save")}</Button>
        </div>
      </form>
    </Sheet>
  );
}
