import React, { useState } from "react";
import { HelpCircle, Monitor, LayoutGrid, MousePointer2, X } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

const steps = [Monitor, LayoutGrid, MousePointer2];

export function OnboardingGuide({ lang, open, onComplete, onReplay }) {
  const t = (key) => getTranslation(lang, key);
  const [step, setStep] = useState(0);
  if (!open) return <button type="button" onClick={onReplay} className="fixed bottom-4 right-4 z-40 inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-xs font-semibold text-zinc-200 shadow-lg hover:bg-zinc-800"><HelpCircle className="h-3.5 w-3.5 text-blue-300" />{t("guideReplay")}</button>;
  const Icon = steps[step];
  const finish = () => { setStep(0); onComplete(); };
  return (
    <aside className="fixed bottom-4 right-4 z-40 w-[min(360px,calc(100vw-2rem))] rounded-xl border border-blue-500/40 bg-zinc-950 p-4 shadow-2xl" aria-label={t("guideTitle")}>
      <button type="button" onClick={finish} aria-label={t("guideSkip")} className="absolute right-3 top-3 rounded p-1 text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button>
      <div className="flex items-start gap-3 pr-6"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300"><Icon className="h-4 w-4" /></span><div><p className="text-[11px] font-semibold uppercase tracking-wider text-blue-300">{t("guideTitle")} · {step + 1}/3</p><h2 className="mt-1 text-sm font-semibold text-white">{t(`guideStep${step + 1}Title`)}</h2><p className="mt-1 text-xs leading-5 text-zinc-400">{t(`guideStep${step + 1}Description`)}</p></div></div>
      <div className="mt-4 flex items-center justify-between"><button type="button" onClick={finish} className="text-xs text-zinc-500 hover:text-zinc-300">{t("guideSkip")}</button><button type="button" onClick={() => step === 2 ? finish() : setStep(step + 1)} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500">{step === 2 ? t("guideDone") : t("guideNext")}</button></div>
    </aside>
  );
}
