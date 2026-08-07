import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, LayoutList, Globe } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function Header({ lang, onLanguageChange, onOpenBig, onOpenDock }) {
  const t = (key) => getTranslation(lang, key);

  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
      <div className="flex items-center gap-3.5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-blue-400/30 bg-blue-600 shadow-[0_6px_16px_rgba(37,99,235,0.2)]">
          <div className="w-2.5 h-2.5 rounded bg-zinc-900 absolute top-1.5 right-1.5" />
        </div>
        <div>
          <h1 className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.01em] text-white">
            {t("appTitle")}
          </h1>
          <p className="mt-0.5 text-xs leading-5 text-zinc-400">{t("appSubtitle")}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language Selector Dropdown */}
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5">
          <Globe className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={lang}
            onChange={(e) => onLanguageChange(e.target.value)}
            aria-label="Language"
            className="cursor-pointer bg-transparent text-xs font-medium text-zinc-200 focus:outline-none"
          >
            <option value="ja" className="bg-zinc-900 text-zinc-200">日本語</option>
            <option value="en" className="bg-zinc-900 text-zinc-200">English</option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenDock}
          className="h-9 gap-1.5 border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          <LayoutList className="w-3.5 h-3.5" />
          <span>{t("openDock")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenBig}
          className="h-9 gap-1.5 border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{t("openBig")}</span>
        </Button>
      </div>
    </header>
  );
}
