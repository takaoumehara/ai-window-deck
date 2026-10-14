import React from "react";
import { Sheet } from "@desktop/components/ui/Sheet";

const TIPS = ["tip1", "tip2", "tip3", "tip4", "tip5"];

// Shown once on first launch (settings.tipsSeen), and again from the palette or the Help menu.
// Two columns on a normal window so it fits without scrolling.
export function TipsSheet({ t, open, onClose, keys }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("tipsTitle")}
      closeLabel={t("close")}
      size="xwide"
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
