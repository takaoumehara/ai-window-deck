import React, { useId } from "react";
import { Globe } from "lucide-react";
import { Sheet } from "@desktop/components/ui/Sheet";
import { LANGUAGES } from "@desktop/lib/strings";

const TIPS = ["tip1", "tip2", "tip3", "tip4", "tip5"];

// Shown once on first launch (settings.tipsSeen), and again from the palette or the Help menu.
// Two columns on a normal window so it fits without scrolling.
export function TipsSheet({ t, open, onClose, keys, lang, onLang }) {
  const languageId = useId();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("tipsTitle")}
      closeLabel={t("close")}
      size="xwide"
      toolbar={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-block bg-ink/[0.04] px-3 py-2">
          <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
          <label htmlFor={languageId} className="text-sm">{t("languageLabel")}</label>
          <select
            id={languageId}
            value={lang}
            onChange={(event) => onLang(event.target.value)}
            className="cie-tap deck-focus-ring h-8 rounded-pill border border-ink-edge bg-paper px-3 text-sm text-ink hover:border-ink"
          >
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code} lang={code}>{label}</option>
            ))}
          </select>
          <span className="text-xs text-paper-mute">{t("tipsLanguageHint")}</span>
        </div>
      }
      footer={
        <>
          <p className="mr-auto min-w-0 text-xs leading-5 text-paper-mute">{t("tipsFooter", keys)}</p>
          <button
            type="button"
            onClick={onClose}
            className="cie-tap inline-flex h-10 shrink-0 items-center justify-center rounded-pill bg-ink px-5 text-sm text-paper transition-colors duration-fast hover:bg-ink/85"
          >
            {t("tipsDone")}
          </button>
        </>
      }
    >
      <ol className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {TIPS.map((tip, index) => (
          <li key={tip} className="flex gap-3">
            <span className="register mt-0.5 shrink-0 text-paper-mute" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{t(`${tip}Title`, keys)}</p>
              <p className="text-[13px] leading-relaxed text-paper-mute">{t(`${tip}Body`, keys)}</p>
            </div>
          </li>
        ))}
      </ol>
    </Sheet>
  );
}
