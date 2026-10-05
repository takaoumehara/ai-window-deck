import React, { useState, useEffect } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Download, Upload } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function RegisterModal({ lang, open, onClose, editingItem, onSaveWindow, onBulkSave, onImportFile, onExportFile }) {
  const t = (key, values) => getTranslation(lang, key, values);
  const fieldId = React.useId();

  const [name, setName] = useState("");
  const [urlRows, setUrlRows] = useState(["", ""]);
  const [bulkText, setBulkText] = useState("");
  const [mode, setMode] = useState("single"); // "single" | "bulk"

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || "");
      const lines = String(editingItem.urls || "").split("\n").map((l) => l.trim()).filter(Boolean);
      setUrlRows(lines.length ? lines : ["", ""]);
      setMode("single");
    } else {
      setName("");
      setUrlRows(["", ""]);
      setBulkText("");
    }
  }, [editingItem, open]);

  const handleAddRow = () => {
    setUrlRows([...urlRows, ""]);
  };

  const handleRemoveRow = (idx) => {
    if (urlRows.length > 1) {
      setUrlRows(urlRows.filter((_, i) => i !== idx));
    } else {
      setUrlRows([""]);
    }
  };

  const handleRowChange = (idx, val) => {
    const updated = [...urlRows];
    updated[idx] = val;
    setUrlRows(updated);
  };

  const handleSingleSubmit = () => {
    const urls = urlRows.map((r) => r.trim()).filter(Boolean).join("\n");
    if (!name && !urls) return;
    onSaveWindow({ id: editingItem?.id, name: name || t("untitledWindow"), urls });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle className="text-base font-bold text-zinc-100">
          {editingItem ? t("regTitleEdit") : mode === "bulk" ? t("regTitleBulk") : t("regTitleAdd")}
        </DialogTitle>
        <DialogClose onClick={onClose} label={t("closeDialog")} />
      </DialogHeader>

      {mode === "single" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${fieldId}-name`} className="text-xs font-semibold text-zinc-400">{t("winNameLabel")}</label>
            <Input
              id={`${fieldId}-name`}
              type="text"
              placeholder={t("winNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span id={`${fieldId}-urls`} className="text-xs font-semibold text-zinc-400">{t("urlsLabel")}</span>
            <div role="group" aria-labelledby={`${fieldId}-urls`} className="flex flex-col gap-2 max-h-48 overflow-y-auto no-scrollbar">
              {urlRows.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    aria-label={t("urlFieldLabel", { n: idx + 1 })}
                    value={url}
                    onChange={(e) => handleRowChange(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    aria-label={t("removeUrlRow", { n: idx + 1 })}
                    title={t("removeUrlRow", { n: idx + 1 })}
                    className="w-9 h-9 flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-red-400 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="mt-1 h-8 gap-1.5 border-dashed border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("addRowBtn")}</span>
            </Button>
          </div>

          {/* File Tools */}
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExportFile}
              className="h-8 gap-1.5 text-xs text-zinc-400 border-zinc-800 hover:bg-zinc-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t("exportBtn")}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onImportFile}
              className="h-8 gap-1.5 text-xs text-zinc-400 border-zinc-800 hover:bg-zinc-800"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t("importBtn")}</span>
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2">
            {!editingItem && (
              <button
                type="button"
                onClick={() => setMode("bulk")}
                className="rounded text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {t("toBulkMode")}
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={onClose}>
                {t("cancelBtn")}
              </Button>
              <Button size="sm" onClick={handleSingleSubmit}>
                {t("saveBtn")}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p id={`${fieldId}-bulk`} className="text-xs text-zinc-400">
            {t("bulkHint")}
          </p>
          <textarea
            rows={8}
            aria-labelledby={`${fieldId}-bulk`}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`Research\nhttps://example.com/docs\n\nChat AI\nhttps://claude.ai`}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-100 font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-2 focus-visible:ring-offset-2"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMode("single")}
              className="rounded text-xs text-zinc-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {t("toSingleMode")}
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                {t("cancelBtn")}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onBulkSave(bulkText);
                  onClose();
                }}
              >
                {t("bulkSaveBtn")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
