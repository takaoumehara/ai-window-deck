import React, { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Download, Upload } from "lucide-react";
import { getTranslation } from "@/lib/i18n";
import { canFix, fixAll, fixIssue, ISSUE, parseBulkText } from "@/lib/bulk-import";

const ISSUE_MESSAGE = {
  [ISSUE.nameWithoutBlank]: "bulkIssueNameWithoutBlank",
  [ISSUE.missingScheme]: "bulkIssueMissingScheme",
  [ISSUE.notUrl]: "bulkIssueNotUrl",
  [ISSUE.badUrl]: "bulkIssueBadUrl",
};

// The textarea and its highlight layer must wrap identically, so they share these classes.
const BULK_TEXT_CLASS = "p-3 text-xs leading-5 font-mono whitespace-pre-wrap break-words overflow-y-scroll";

export function RegisterModal({ lang, open, onClose, editingItem, onSaveWindow, onBulkSave, onImportFile, onExportFile }) {
  const t = (key, values) => getTranslation(lang, key, values);
  const fieldId = React.useId();

  const [name, setName] = useState("");
  const [urlRows, setUrlRows] = useState(["", ""]);
  const [bulkText, setBulkText] = useState("");
  const [mode, setMode] = useState("single"); // "single" | "bulk"
  const [bulkChecked, setBulkChecked] = useState(false);
  const bulkRef = useRef(null);
  const backdropRef = useRef(null);
  const bulkIssues = useMemo(() => (bulkChecked ? parseBulkText(bulkText).issues : []), [bulkChecked, bulkText]);
  const issueLines = useMemo(() => new Set(bulkIssues.map((issue) => issue.line)), [bulkIssues]);

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
    setBulkChecked(false);
  }, [editingItem, open]);

  const jumpToLine = (line) => {
    const textarea = bulkRef.current;
    if (!textarea) return;
    const lines = bulkText.split("\n");
    const start = lines.slice(0, line - 1).reduce((sum, l) => sum + l.length + 1, 0);
    textarea.focus();
    textarea.setSelectionRange(start, start + (lines[line - 1]?.length ?? 0));
    const row = backdropRef.current?.children[line - 1];
    if (row) textarea.scrollTop = Math.max(0, row.offsetTop - 24);
  };

  const handleBulkSubmit = () => {
    if (parseBulkText(bulkText).issues.length) {
      setBulkChecked(true);
      return;
    }
    onBulkSave(bulkText);
    onClose();
  };

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
                    className="w-9 h-9 flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-red-400 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
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
                className="rounded text-xs text-blue-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
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
          <div className={`relative h-48 overflow-hidden rounded-md border bg-zinc-900 ${bulkIssues.length ? "border-red-500/70" : "border-zinc-800"}`}>
            <div ref={backdropRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 text-transparent ${BULK_TEXT_CLASS}`}>
              {bulkText.split("\n").map((lineText, idx) => (
                <span
                  key={idx}
                  className={issueLines.has(idx + 1) ? "block -mx-3 px-3 bg-red-500/25 shadow-[inset_3px_0_0_rgb(239,68,68)]" : "block"}
                >
                  {lineText || " "}
                </span>
              ))}
            </div>
            <textarea
              ref={bulkRef}
              aria-labelledby={`${fieldId}-bulk`}
              aria-invalid={bulkIssues.length > 0}
              aria-describedby={bulkIssues.length ? `${fieldId}-issues` : undefined}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              onScroll={(e) => { if (backdropRef.current) backdropRef.current.scrollTop = e.currentTarget.scrollTop; }}
              placeholder={`Research\nhttps://example.com/docs\n\nChat AI\nhttps://claude.ai`}
              className={`relative block h-full w-full resize-none bg-transparent text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${BULK_TEXT_CLASS}`}
            />
          </div>
          {bulkIssues.length > 0 && (
            <div id={`${fieldId}-issues`} role="alert" className="rounded-md border border-red-500/50 bg-red-500/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-red-300">{t("bulkIssuesTitle", { count: bulkIssues.length })}</p>
                {bulkIssues.filter(canFix).length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setBulkText(fixAll(bulkText))} className="h-7 text-xs">
                    {t("bulkFixAllBtn")}
                  </Button>
                )}
              </div>
              <ul className="mt-2 flex max-h-32 flex-col gap-1.5 overflow-y-auto">
                {bulkIssues.map((issue) => (
                  <li key={`${issue.line}-${issue.text}`} className="flex items-start gap-2 text-xs leading-5 text-zinc-200">
                    <button
                      type="button"
                      onClick={() => jumpToLine(issue.line)}
                      aria-label={t("bulkJumpLabel", { n: issue.line })}
                      className="shrink-0 rounded bg-red-500/20 px-1.5 font-mono font-semibold text-red-200 hover:bg-red-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                    >
                      {t("bulkLineLabel", { n: issue.line })}
                    </button>
                    <span className="flex-1">{t(ISSUE_MESSAGE[issue.kind], { text: issue.text })}</span>
                    {canFix(issue) && (
                      <button
                        type="button"
                        onClick={() => setBulkText(fixIssue(bulkText, issue))}
                        className="shrink-0 rounded border border-zinc-700 px-2 font-semibold text-zinc-100 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                      >
                        {t("bulkFixBtn")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMode("single")}
              className="rounded text-xs text-zinc-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              {t("toSingleMode")}
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                {t("cancelBtn")}
              </Button>
              <Button size="sm" onClick={handleBulkSubmit}>
                {t("bulkSaveBtn")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
