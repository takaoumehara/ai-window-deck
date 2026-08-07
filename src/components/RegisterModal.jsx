import React, { useState, useEffect } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Download, Upload } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function RegisterModal({ lang, open, onClose, editingItem, onSaveWindow, onBulkSave, onImportFile, onExportFile }) {
  const t = (key) => getTranslation(lang, key);

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
    onSaveWindow({ id: editingItem?.id, name: name || "Window", urls });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle className="text-base font-bold text-zinc-100">
          {editingItem ? t("regTitleEdit") : mode === "bulk" ? t("regTitleBulk") : t("regTitleAdd")}
        </DialogTitle>
        <DialogClose onClick={onClose} />
      </DialogHeader>

      {mode === "single" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400">{t("winNameLabel")}</label>
            <Input
              type="text"
              placeholder={t("winNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400">{t("urlsLabel")}</label>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto no-scrollbar">
              {urlRows.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => handleRowChange(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    className="w-9 h-9 flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-red-400 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
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
                className="text-xs text-blue-400 hover:underline"
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
          <p className="text-xs text-zinc-400">
            {t("bulkHint")}
          </p>
          <textarea
            rows={8}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`Research\nhttps://example.com/docs\n\nChat AI\nhttps://claude.ai`}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMode("single")}
              className="text-xs text-zinc-400 hover:underline"
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
