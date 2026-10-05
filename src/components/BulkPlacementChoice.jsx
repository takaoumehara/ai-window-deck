import React from "react";
import { LayoutGrid, Library } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTranslation } from "@/lib/i18n";

export function BulkPlacementChoice({ lang, count, open, onAutoPlace, onLibraryOnly, onClose }) {
  const t = (key) => getTranslation(lang, key);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{t("bulkPlacementTitle")}</DialogTitle>
        <p className="text-xs leading-5 text-zinc-400">{t("bulkPlacementDescription").replace("{count}", String(count))}</p>
      </DialogHeader>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onAutoPlace} className="rounded-lg border border-primary bg-primary/10 p-4 text-left transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-2 focus-visible:ring-offset-2">
          <LayoutGrid className="mb-3 h-5 w-5 text-primary" />
          <span className="block text-sm font-semibold text-white">{t("bulkPlaceAuto")}</span>
          <span className="mt-1 block text-xs leading-5 text-zinc-400">{t("bulkPlaceAutoDesc")}</span>
        </button>
        <button type="button" onClick={onLibraryOnly} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-2 focus-visible:ring-offset-2">
          <Library className="mb-3 h-5 w-5 text-zinc-300" />
          <span className="block text-sm font-semibold text-white">{t("bulkPlaceManual")}</span>
          <span className="mt-1 block text-xs leading-5 text-zinc-400">{t("bulkPlaceManualDesc")}</span>
        </button>
      </div>
      <div className="mt-4 flex justify-end"><Button variant="outline" size="sm" onClick={onClose}>{t("cancelBtn")}</Button></div>
    </Dialog>
  );
}
