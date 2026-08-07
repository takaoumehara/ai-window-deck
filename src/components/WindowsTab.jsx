import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, ExternalLink, X } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function WindowsTab({ lang, windows, onOpenAddModal, onEditWindow, onDeleteWindow }) {
  const t = (key) => getTranslation(lang, key);
  const [openWindows, setOpenWindows] = useState([]);

  const fetchOpenWindows = async () => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "windowList" }, (result) => {
        if (result?.ok && Array.isArray(result.windows)) setOpenWindows(result.windows);
      });
    }
  };

  useEffect(() => {
    fetchOpenWindows();
  }, []);

  const handleFocusWindow = (windowId) => {
    if (typeof chrome !== "undefined" && chrome.windows) {
      chrome.windows.update(windowId, { focused: true });
    }
  };

  const handleCloseWindow = async (windowId) => {
    if (typeof chrome !== "undefined" && chrome.windows) {
      await chrome.windows.remove(windowId);
      fetchOpenWindows();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Section 1: Global Registered Windows Library */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <span>{t("registeredWinHeader")}</span>
            <span className="text-xs text-zinc-500 font-normal">({windows.length})</span>
          </CardTitle>
          <Button
            size="sm"
            onClick={onOpenAddModal}
            className="h-7 px-2.5 text-xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("regTitleAdd")}</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto no-scrollbar">
            {windows.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">{t("noWindows")}</p>
            ) : (
              windows.map((w) => {
                const urlLines = (w.urls || "").split("\n").filter(Boolean);
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/80"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-bold text-zinc-200 truncate">{w.name || "Untitled"}</span>
                      <span className="text-[10px] text-zinc-500 truncate font-mono">
                        {urlLines.length} {t("urlsCount")}: {urlLines[0] || "empty"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditWindow(w)}
                        className="h-7 w-7 text-zinc-400 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteWindow(w.id)}
                        className="h-7 w-7 text-zinc-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Currently Open Browser Windows */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <span>{t("openWinHeader")}</span>
            <span className="text-xs text-zinc-500 font-normal">({openWindows.length})</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOpenWindows}
            className="h-7 text-xs border-zinc-800 text-zinc-400 hover:bg-zinc-800"
          >
            {t("refreshBtn")}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto no-scrollbar">
            {openWindows.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">{t("noWindows")}</p>
            ) : (
              openWindows.map((win, idx) => {
                return (
                  <div
                    key={win.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/80"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-bold text-zinc-200 truncate">
                        {win.title || t("untitledWindow")} {win.isFocused ? t("activeWinTag") : ""}
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate font-mono">
                        {win.tabs || 0} {t("tabsCount")}: {win.url || ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFocusWindow(win.id)}
                        className="h-7 text-xs gap-1 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{t("focusBtn")}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCloseWindow(win.id)}
                        className="h-7 w-7 text-zinc-400 hover:text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
