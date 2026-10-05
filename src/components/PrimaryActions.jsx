import React, { useState } from "react";
import { Play, ChevronDown, ChevronUp } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function PrimaryActions({ lang, presets, activePreset, onSelectPreset, onLaunch, canvasSlots }) {
  const t = (key) => getTranslation(lang, key);
  const [showSettings, setShowSettings] = useState(false);
  
  const currentPreset = presets[activePreset] || presets[0];
  const hasWindows = canvasSlots && canvasSlots.length > 0;

  return (
    <section className="mb-5 flex flex-col gap-4" style={{
      background: 'var(--card)',
      border: '1px solid var(--cie-stroke)',
      borderRadius: 'var(--cie-r)',
      padding: 'var(--cie-s-20)'
    }}>
      {/* Primary Open Action */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{
            color: 'var(--cie-ink)',
            fontFamily: 'var(--cie-sans)',
            letterSpacing: '-0.02em'
          }}>
            {t("arrangeTab")} {/* Using existing "Arrange" translation */}
          </h2>
          
          {/* Preset Selector */}
          {presets.length > 1 && (
            <div className="flex items-center gap-2">
              <select
                value={activePreset}
                onChange={(e) => onSelectPreset(parseInt(e.target.value))}
                className="rounded px-3 py-1 text-sm font-medium"
                style={{
                  background: 'var(--cie-btn)',
                  border: '1px solid var(--cie-stroke)',
                  borderRadius: 'calc(var(--cie-r) / 2)',
                  color: 'var(--cie-ink)',
                  fontFamily: 'var(--cie-sans)',
                  minHeight: '32px',
                  cursor: 'pointer'
                }}
              >
                {presets.map((preset, idx) => (
                  <option key={idx} value={idx} style={{
                    background: 'var(--card)',
                    color: 'var(--card-foreground)'
                  }}>
                    {preset.name || `Set ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Main Open Button */}
        <button
          onClick={onLaunch}
          disabled={!hasWindows}
          className="flex items-center justify-center gap-3 rounded-lg font-semibold transition-all"
          style={{
            background: hasWindows ? 'var(--cie-ink)' : 'var(--cie-btn)',
            color: hasWindows ? 'var(--cie-paper)' : 'var(--cie-ink-mute)',
            border: '1px solid var(--cie-stroke)',
            borderRadius: 'var(--cie-r)',
            padding: 'var(--cie-s-16) var(--cie-s-24)',
            minHeight: '56px',
            fontSize: '15px',
            fontFamily: 'var(--cie-sans)',
            letterSpacing: '-0.01em',
            cursor: hasWindows ? 'pointer' : 'not-allowed',
            transition: `all var(--cie-t-snap) var(--cie-ease-expo)`,
            opacity: hasWindows ? 1 : 0.5
          }}
        >
          <Play style={{ width: '20px', height: '20px' }} />
          <span>{t("launchAll")}</span>
          {hasWindows && (
            <span className="text-xs" style={{ 
              color: 'var(--cie-paper-mute)',
              fontFamily: 'var(--cie-mono)',
              fontSize: 'var(--cie-text-mono)'
            }}>
              {canvasSlots.length} {canvasSlots.length === 1 ? t("urlSingular") : t("windowsTab")}
            </span>
          )}
        </button>

        {!hasWindows && (
          <p className="text-xs text-center" style={{
            color: 'var(--cie-ink-mute)',
            fontFamily: 'var(--cie-sans)'
          }}>
            {t("noWindows")}
          </p>
        )}
      </div>

      {/* Settings Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="flex items-center justify-between px-2 py-2 rounded-lg transition-all"
        style={{
          background: showSettings ? 'var(--cie-btn)' : 'transparent',
          border: '1px solid transparent',
          color: 'var(--cie-ink-mute)',
          fontFamily: 'var(--cie-sans)',
          fontSize: '13px',
          cursor: 'pointer',
          transition: `all var(--cie-t-snap) var(--cie-ease-expo)`
        }}
      >
        <span>{showSettings ? t("hideSettings") : t("showSettings")}</span>
        {showSettings ? (
          <ChevronUp style={{ width: '16px', height: '16px' }} />
        ) : (
          <ChevronDown style={{ width: '16px', height: '16px' }} />
        )}
      </button>

      {/* Collapsible Settings Area */}
      {showSettings && (
        <div className="pt-3" style={{
          borderTop: '1px solid var(--cie-stroke)'
        }}>
          {/* This will contain display selector and other settings */}
          <p className="text-xs" style={{
            color: 'var(--cie-ink-mute)',
            fontFamily: 'var(--cie-sans)'
          }}>
            {t("displaySelectorLabel") || "Display settings will appear here"}
          </p>
        </div>
      )}
    </section>
  );
}
