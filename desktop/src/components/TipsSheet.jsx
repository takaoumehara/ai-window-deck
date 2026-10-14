import React from "react";
import { Sheet } from "@desktop/components/ui/Sheet";

const TIPS = ["tip1", "tip2", "tip3", "tip4", "tip5"];

// Shown once on first launch (settings.tipsSeen), and again from the palette or the Help menu.
export function TipsSheet({ t, open, onClose, keys }) {
  return (
    <Sheet open={open} onClose={onClose} title={t("tipsTitle")} closeLabel={t("close")}>
      <div className="flex flex-col gap-5">
        <ol className="flex flex-col gap-4">
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
        <p className="text-xs text-paper-mute">{t("tipsFooter", keys)}</p>
        <button
          type="button"
          onClick={onClose}
          className="cie-tap inline-flex h-10 items-center justify-center self-end rounded-pill bg-ink px-5 text-sm text-paper transition-colors duration-fast hover:bg-ink/85"
        >
          {t("tipsDone")}
        </button>
      </div>
    </Sheet>
  );
}
