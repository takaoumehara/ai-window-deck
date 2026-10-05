import React from "react";
import { Keyboard, LocateFixed, Maximize2, Sparkles } from "lucide-react";
import { getTranslation } from "@/lib/i18n";
import { SpotlightPreview } from "@/components/SpotlightPreview";
import { useShortcuts } from "@/hooks/useShortcuts";

export function SpotlightConfig({ lang, state, updateState, onAction, targetAspectRatio, canvasSlots }) {
  const t = (key) => getTranslation(lang, key);
  const currentSize = state.spotlightSize || "full";
  const currentAnchor = state.spotlightAnchor || "keep";
  const shortcuts = useShortcuts();

  const sizeOptions = [
    { id: "half", glyph: "½", label: t("spotlightHalf") },
    { id: "tall", glyph: "↕", label: t("spotlightTall") },
    { id: "threeFourths", glyph: "¾", label: t("spotlightThreeFourths") },
    { id: "full", glyph: "□", label: t("spotlightFull") },
    { id: "height", glyph: "↟", label: t("spotlightHeight") },
    { id: "custom", glyph: "×", label: t("spotlightCustom") },
  ];

  const anchorOptions = [
    { id: "keep", icon: LocateFixed, label: t("spotlightKeep") },
    { id: "center", icon: Maximize2, label: t("spotlightCenter") },
  ];

  const updateCustomSize = async (key, value) => {
    await updateState({ [key]: Math.max(20, Math.min(100, Number(value))) });
  };

  return (
    <section className="mb-6 flex flex-col gap-4 rounded-xl p-5" style={{
      background: 'var(--cie-paper)',
      border: '1px solid var(--cie-stroke)',
      borderRadius: 'var(--cie-r)',
      transition: `all var(--cie-t-cell) var(--cie-ease-expo)`
    }} aria-labelledby="spotlight-config-title">
      <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid var(--cie-stroke)' }}>
        <Sparkles style={{ width: '20px', height: '20px', color: 'var(--cie-ink-mute)' }} />
        <div>
          <h2 id="spotlight-config-title" className="text-base font-semibold tracking-tight" style={{ 
            color: 'var(--cie-ink)',
            fontFamily: 'var(--cie-sans)',
            letterSpacing: '-0.02em'
          }}>
            {t("spotlightConfigTitle")}
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--cie-ink-mute)' }}>
            {t("spotlightConfigSubtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold" style={{ 
            color: 'var(--cie-ink)',
            fontFamily: 'var(--cie-sans)'
          }}>
            {t("spotlightSizeLabel")}
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sizeOptions.map((opt) => {
              const active = currentSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateState({ spotlightSize: opt.id })}
                  aria-pressed={active}
                  className="flex min-h-[60px] flex-col items-center justify-center rounded-lg p-2.5 text-center transition-all"
                  style={{
                    background: active ? 'var(--cie-btn-hover)' : 'var(--cie-btn)',
                    border: `1px solid ${active ? 'var(--cie-ink)' : 'var(--cie-stroke)'}`,
                    borderRadius: 'var(--cie-r)',
                    color: 'var(--cie-ink)',
                    transition: `all var(--cie-t-snap) var(--cie-ease-expo)`,
                    cursor: 'pointer',
                    minHeight: '60px'
                  }}
                >
                  <span className="text-lg font-medium" style={{ fontFamily: 'var(--cie-sans)' }}>
                    {opt.glyph}
                  </span>
                  <span className="text-xs mt-1" style={{ color: 'var(--cie-ink-mute)' }}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
          {currentSize === "custom" && (
            <div className="grid grid-cols-1 gap-3 rounded-lg p-3 sm:grid-cols-2" style={{
              background: 'var(--cie-btn)',
              border: '1px solid var(--cie-stroke)',
              borderRadius: 'var(--cie-r)'
            }}>
              {[{ key: "spotlightWidth", label: t("spotlightWidth"), value: state.spotlightWidth ?? 70 }, { key: "spotlightHeight", label: t("spotlightHeightValue"), value: state.spotlightHeight ?? 90 }].map(({ key, label, value }) => (
                <label key={key} className="flex flex-col gap-2 text-xs font-semibold" style={{ color: 'var(--cie-ink)' }}>
                  <span style={{ fontFamily: 'var(--cie-mono)', fontSize: 'var(--cie-text-mono)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={value}
                      onChange={(event) => updateCustomSize(key, event.target.value)}
                      className="flex-1"
                      style={{ accentColor: 'var(--cie-ink)' }}
                    />
                    <output className="w-10 text-right tabular-nums" style={{ 
                      color: 'var(--cie-ink)',
                      fontFamily: 'var(--cie-mono)',
                      fontSize: 'var(--cie-text-mono)'
                    }}>
                      {value}%
                    </output>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold" style={{ 
            color: 'var(--cie-ink)',
            fontFamily: 'var(--cie-sans)'
          }}>
            {t("spotlightAnchorLabel")}
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {anchorOptions.map((opt) => {
              const active = currentAnchor === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateState({ spotlightAnchor: opt.id })}
                  aria-pressed={active}
                  className="flex min-h-[60px] flex-col items-center justify-center rounded-lg p-2.5 text-center transition-all"
                  style={{
                    background: active ? 'var(--cie-btn-hover)' : 'var(--cie-btn)',
                    border: `1px solid ${active ? 'var(--cie-ink)' : 'var(--cie-stroke)'}`,
                    borderRadius: 'var(--cie-r)',
                    color: 'var(--cie-ink)',
                    transition: `all var(--cie-t-snap) var(--cie-ease-expo)`,
                    cursor: 'pointer',
                    minHeight: '60px'
                  }}
                >
                  <Icon style={{ width: '20px', height: '20px' }} />
                  <span className="text-xs mt-1" style={{ color: 'var(--cie-ink-mute)' }}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <SpotlightPreview lang={lang} state={state} canvasSlots={canvasSlots} targetAspectRatio={targetAspectRatio} />

      <div className="flex flex-wrap items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--cie-stroke)' }}>
        <Keyboard style={{ width: '16px', height: '16px', color: 'var(--cie-ink-mute)' }} />
        <span className="text-xs" style={{ color: 'var(--cie-ink-mute)', fontFamily: 'var(--cie-sans)' }}>
          <span className="key-cap">{shortcuts["toggle-spotlight"]}</span> {t("shortcutToggleDesc")}
        </span>
        <span className="text-xs" style={{ color: 'var(--cie-ink-mute)', fontFamily: 'var(--cie-sans)' }}>
          <span className="key-cap">{shortcuts["restore-home"]}</span> {t("shortcutHomeDesc")}
        </span>
      </div>
    </section>
  );
}
