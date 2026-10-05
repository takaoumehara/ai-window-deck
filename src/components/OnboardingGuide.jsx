import React from "react";
import { Check, HelpCircle } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function OnboardingGuide({ lang, open, onComplete, onReplay }) {
  const t = (key) => getTranslation(lang, key);
  return open
    ? <button type="button" onClick={onComplete} className="fixed bottom-4 right-4 z-40 inline-flex h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold shadow-lg focus-visible:outline-none" style={{
        border: '1px solid var(--cie-stroke)',
        background: 'var(--cie-ink)',
        color: 'var(--cie-paper)',
        fontFamily: 'var(--cie-sans)',
        borderRadius: 'var(--cie-r)',
        cursor: 'pointer',
        transition: `all var(--cie-t-snap) var(--cie-ease-expo)`
      }}><Check className="h-4 w-4" aria-hidden="true" />{t("guideDone")}</button>
    : <button type="button" onClick={onReplay} className="fixed bottom-4 right-4 z-40 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold shadow-lg focus-visible:outline-none" style={{
        border: '1px solid var(--cie-stroke)',
        background: 'var(--cie-btn)',
        color: 'var(--cie-ink)',
        fontFamily: 'var(--cie-sans)',
        borderRadius: 'var(--cie-r-pill)',
        cursor: 'pointer',
        transition: `all var(--cie-t-snap) var(--cie-ease-expo)`
      }}><HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />{t("guideReplay")}</button>;
}
