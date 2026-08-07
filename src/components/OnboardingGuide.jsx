import React from "react";
import { Check, HelpCircle } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function OnboardingGuide({ lang, open, onComplete, onReplay }) {
  const t = (key) => getTranslation(lang, key);
  return open
    ? <button type="button" onClick={onComplete} className="fixed bottom-4 right-4 z-40 inline-flex h-10 items-center gap-2 rounded-lg border border-blue-300 bg-blue-600 px-3 text-xs font-semibold text-white shadow-lg shadow-blue-950/50 hover:bg-blue-500"><Check className="h-4 w-4" />{t("guideDone")}</button>
    : <button type="button" onClick={onReplay} className="fixed bottom-4 right-4 z-40 inline-flex h-9 items-center gap-1.5 rounded-full border border-blue-500/60 bg-zinc-900 px-3 text-xs font-semibold text-blue-200 shadow-lg hover:bg-zinc-800"><HelpCircle className="h-3.5 w-3.5" />{t("guideReplay")}</button>;
}
