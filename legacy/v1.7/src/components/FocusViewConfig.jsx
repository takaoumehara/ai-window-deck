import React from "react";
import { ExternalLink, Keyboard, LocateFixed, Maximize2, Sparkles } from "lucide-react";
import { getTranslation } from "@/lib/i18n";
import { FocusViewPreview } from "@/components/FocusViewPreview";
import { useShortcuts } from "@/hooks/useShortcuts";

export function FocusViewConfig({ lang, state, updateState, onAction, targetAspectRatio, canvasSlots }) {
  const t = (key) => getTranslation(lang, key);
  const currentSize = state.focusViewSize || "full";
  const currentAnchor = state.focusViewAnchor || "keep";
  const shortcuts = useShortcuts();

  const sizeOptions = [
    { id: "half", glyph: "½", label: t("focusViewHalf"), desc: t("focusViewHalfDesc") },
    { id: "tall", glyph: "↕", label: t("focusViewTall"), desc: t("focusViewTallDesc") },
    { id: "threeFourths", glyph: "¾", label: t("focusViewThreeFourths"), desc: t("focusViewThreeFourthsDesc") },
    { id: "full", glyph: "□", label: t("focusViewFull"), desc: t("focusViewFullDesc") },
    { id: "height", glyph: "↟", label: t("focusViewHeight"), desc: t("focusViewHeightDesc") },
    { id: "custom", glyph: "×", label: t("focusViewCustom"), desc: t("focusViewCustomDesc") },
  ];

  const anchorOptions = [
    { id: "keep", icon: LocateFixed, label: t("focusViewKeep"), desc: t("focusViewKeepDesc") },
    { id: "center", icon: Maximize2, label: t("focusViewCenter"), desc: t("focusViewCenterDesc") },
  ];

  const updateCustomSize = (key, value) => {
    updateState({ [key]: Math.max(20, Math.min(100, Number(value))) });
  };

  return (
    <section className="mb-5 flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5" aria-labelledby="focus-view-config-title">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <div>
            <h2 id="focus-view-config-title" className="text-sm font-semibold tracking-tight text-white">
              {t("focusViewConfigTitle")}
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-400">{t("focusViewConfigSubtitle")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-zinc-200">{t("focusViewSizeLabel")}</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sizeOptions.map((opt) => {
              const active = currentSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateState({ focusViewSize: opt.id })}
                  aria-pressed={active}
                  className={`flex min-h-[68px] flex-col items-start rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                    active
                      ? "border-blue-500 bg-blue-600/20 text-white"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold"><span className="text-blue-300">{opt.glyph}</span>{opt.label}</span>
                  <span className="mt-1 text-[11px] leading-4 text-zinc-400">{opt.desc}</span>
                </button>
              );
            })}
          </div>
          {currentSize === "custom" && (
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 sm:grid-cols-2">
              {[{ key: "focusViewWidth", label: t("focusViewWidth"), value: state.focusViewWidth ?? 70 }, { key: "focusViewHeight", label: t("focusViewHeightValue"), value: state.focusViewHeight ?? 90 }].map(({ key, label, value }) => (
                <label key={key} className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                  <span className="w-8">{label}</span>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={value}
                    onChange={(event) => updateCustomSize(key, event.target.value)}
                    className="h-1.5 flex-1 accent-blue-500"
                  />
                  <output className="w-8 text-right tabular-nums text-blue-300">{value}%</output>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-zinc-200">{t("focusViewAnchorLabel")}</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {anchorOptions.map((opt) => {
              const active = currentAnchor === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateState({ focusViewAnchor: opt.id })}
                  aria-pressed={active}
                  className={`flex min-h-[68px] flex-col items-start rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                    active
                      ? "border-blue-500 bg-blue-600/20 text-white"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold"><Icon className="h-3.5 w-3.5 text-blue-300" />{opt.label}</span>
                  <span className="mt-1 text-[11px] leading-4 text-zinc-400">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <FocusViewPreview lang={lang} state={state} canvasSlots={canvasSlots} targetAspectRatio={targetAspectRatio} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t border-zinc-800/80 pt-3.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200"><Keyboard className="h-3.5 w-3.5 text-blue-400" />{t("focusViewShortcutLabel")}</span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="key-cap">{shortcuts["toggle-focus-view"]}</span>{t("shortcutToggleDesc")}</span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="key-cap">{shortcuts["restore-home"]}</span>{t("shortcutHomeDesc")}</span>
        <button
          type="button"
          onClick={() => onAction?.("shortcuts")}
          className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 transition-colors hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          {t("shortcutChange")}<ExternalLink className="h-3 w-3" aria-hidden="true" />
        </button>
        <span className="w-full text-[11px] text-zinc-400 sm:w-auto">{t("shortcutChangeHint")}</span>
      </div>
    </section>
  );
}
