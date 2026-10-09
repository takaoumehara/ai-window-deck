import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle className="text-base font-bold text-zinc-100">{item ? t("editWindow") : t("addWindow")}</DialogTitle>
      </DialogHeader>
      <DialogClose onClick={onClose} label={t("close")} />
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${fieldId}-name`} className="text-xs font-semibold text-zinc-300">{t("nameLabel")}</label>
          <Input id={`${fieldId}-name`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Claude" />
        </div>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-xs font-semibold text-zinc-300">{t("urlsLabel")}</legend>
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-right font-mono text-[11px] text-zinc-500">{index + 1}</span>
              <Input
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
                className="rounded p-1.5 text-zinc-400 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => setRows([...rows, ""])} className="mt-1 self-start gap-1.5 text-zinc-300">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t("addUrl")}
          </Button>
        </fieldset>
        <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4">
          <Button type="button" variant="heroAlt" size="sm" onClick={onClose}>{t("cancel")}</Button>
          <Button type="submit" variant="hero" size="sm">{t("save")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
