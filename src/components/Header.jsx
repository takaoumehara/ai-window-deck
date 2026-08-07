import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, LayoutList, Globe } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function Header({ lang, onLanguageChange, onOpenBig, onOpenDock }) {
  const t = (key) => getTranslation(lang, key);

  return (
    <header className="flex flex-wrap items-center justify-between pb-3.5 border-b border-zinc-800/80 mb-4 gap-3">
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
          <div className="w-2.5 h-2.5 rounded bg-zinc-900 absolute top-1.5 right-1.5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            {t("appTitle")}
          </h1>
          <p className="text-xs text-zinc-400">{t("appSubtitle")}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language Selector Dropdown */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1">
          <Globe className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={lang}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer font-medium"
          >
            <option value="ja" className="bg-zinc-900 text-zinc-200">日本語</option>
            <option value="en" className="bg-zinc-900 text-zinc-200">English</option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenDock}
          className="h-8 gap-1.5 text-xs text-zinc-300 border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
        >
          <LayoutList className="w-3.5 h-3.5" />
          <span>{t("openDock")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenBig}
          className="h-8 gap-1.5 text-xs text-zinc-300 border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{t("openBig")}</span>
        </Button>
      </div>
    </header>
  );
}
