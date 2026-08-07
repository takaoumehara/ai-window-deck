import React, { useEffect, useState } from "react";
import { ExternalLink, Keyboard, LocateFixed, Maximize2, Sparkles } from "lucide-react";
import { getTranslation } from "@/lib/i18n";
import { SpotlightPreview } from "@/components/SpotlightPreview";

const DEFAULT_SHORTCUTS = {
  "toggle-spotlight": "⌥ X",
  "restore-home": "⌥ Z",
};

export function SpotlightConfig({ lang, state, updateState, onAction, targetAspectRatio, canvasSlots }) {
  const t = (key) => getTranslation(lang, key);
  const currentSize = state.spotlightSize || "full";
  const currentAnchor = state.spotlightAnchor || "keep";
  const [shortcuts, setShortcuts] = useState(DEFAULT_SHORTCUTS);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.commands?.getAll) return;
    chrome.commands.getAll((commands) => {
      const next = { ...DEFAULT_SHORTCUTS };
      commands.forEach((command) => {
        if (command.name in next && command.shortcut) next[command.name] = command.shortcut;
      });
      setShortcuts(next);
    });
  }, []);

  const sizeOptions = [
    { id: "half", glyph: "½", label: t("spotlightHalf"), desc: t("spotlightHalfDesc") },
    { id: "tall", glyph: "↕", label: t("spotlightTall"), desc: t("spotlightTallDesc") },
    { id: "threeFourths", glyph: "¾", label: t("spotlightThreeFourths"), desc: t("spotlightThreeFourthsDesc") },
    { id: "full", glyph: "□", label: t("spotlightFull"), desc: t("spotlightFullDesc") },
    { id: "height", glyph: "↟", label: t("spotlightHeight"), desc: t("spotlightHeightDesc") },
    { id: "custom", glyph: "×", label: t("spotlightCustom"), desc: t("spotlightCustomDesc") },
  ];

  const anchorOptions = [
    { id: "keep", icon: LocateFixed, label: t("spotlightKeep"), desc: t("spotlightKeepDesc") },
    { id: "center", icon: Maximize2, label: t("spotlightCenter"), desc: t("spotlightCenterDesc") },
  ];

  const updateCustomSize = (key, value) => {
    updateState({ [key]: Math.max(20, Math.min(100, Number(value))) });
  };

  return (
    <section className="flex flex-col gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 mb-4" aria-labelledby="spotlight-config-title">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <div>
            <h3 id="spotlight-config-title" className="text-xs font-bold text-white uppercase tracking-wider">
              {t("spotlightConfigTitle")}
            </h3>
            <p className="mt-0.5 text-[10px] text-zinc-400">{t("spotlightConfigSubtitle")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-zinc-300">{t("spotlightSizeLabel")}</span>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {sizeOptions.map((opt) => {
              const active = currentSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateState({ spotlightSize: opt.id })}
                  aria-pressed={active}
                  className={`flex min-h-[62px] flex-col items-start rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    active
                      ? "border-blue-500 bg-blue-600/20 text-white"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-bold"><span className="text-blue-300">{opt.glyph}</span>{opt.label}</span>
                  <span className="mt-0.5 text-[9px] leading-tight text-zinc-400">{opt.desc}</span>
                </button>
              );
            })}
          </div>
          {currentSize === "custom" && (
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-2.5 sm:grid-cols-2">
              {[{ key: "spotlightWidth", label: t("spotlightWidth"), value: state.spotlightWidth ?? 70 }, { key: "spotlightHeight", label: t("spotlightHeightValue"), value: state.spotlightHeight ?? 90 }].map(({ key, label, value }) => (
                <label key={key} className="flex items-center gap-2 text-[10px] font-semibold text-zinc-300">
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

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-zinc-300">{t("spotlightAnchorLabel")}</span>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {anchorOptions.map((opt) => {
              const active = currentAnchor === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateState({ spotlightAnchor: opt.id })}
                  aria-pressed={active}
                  className={`flex min-h-[62px] flex-col items-start rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    active
                      ? "border-blue-500 bg-blue-600/20 text-white"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-bold"><Icon className="h-3.5 w-3.5 text-blue-300" />{opt.label}</span>
                  <span className="mt-0.5 text-[9px] leading-tight text-zinc-400">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <SpotlightPreview lang={lang} state={state} canvasSlots={canvasSlots} targetAspectRatio={targetAspectRatio} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-800/80 pt-3">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300"><Keyboard className="h-3.5 w-3.5 text-blue-400" />{t("spotlightShortcutLabel")}</span>
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-400"><span className="key-cap">{shortcuts["toggle-spotlight"]}</span>{t("shortcutToggleDesc")}</span>
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-400"><span className="key-cap">{shortcuts["restore-home"]}</span>{t("shortcutHomeDesc")}</span>
        <button
          type="button"
          onClick={() => onAction?.("shortcuts")}
          className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-300 transition-colors hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {t("shortcutChange")}<ExternalLink className="h-3 w-3" />
        </button>
        <span className="w-full text-[9px] text-zinc-500 sm:w-auto">{t("shortcutChangeHint")}</span>
      </div>
    </section>
  );
}
