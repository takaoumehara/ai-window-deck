import React, { useState, useEffect } from "react";
import { Monitor, Check } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function DisplaySelector({ lang, targetDisplays, onToggleDisplay, showGuide = false }) {
  const [displays, setDisplays] = useState([]);
  const t = (key) => getTranslation(lang, key);
  const largestEdge = Math.max(1, ...displays.map((display) => Math.max(display.bounds?.width || 0, display.bounds?.height || 0)));

  const fetchDisplays = () => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "displays" }, (res) => {
        if (res?.ok && Array.isArray(res.displays)) {
          setDisplays(res.displays);
        }
      });
    }
  };

  useEffect(() => {
    fetchDisplays();
  }, []);

  return (
    <section className="mb-5 flex flex-col gap-3 rounded-xl p-4" style={{
      border: '1px solid var(--cie-stroke)',
      background: 'var(--card)',
      borderRadius: 'var(--cie-r)'
    }} aria-labelledby="display-selector-title">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="display-selector-title" className="flex items-center gap-2 text-sm font-semibold tracking-tight" style={{
            color: 'var(--card-foreground)',
            fontFamily: 'var(--cie-sans)',
            letterSpacing: '-0.02em'
          }}>
            <Monitor style={{ width: '16px', height: '16px', color: 'var(--cie-ink-mute)' }} />
            <span>{t("displaySelectTitle")}</span>
          </h2>
          <p className="mt-1 text-xs leading-5" style={{ color: 'var(--cie-ink-mute)', fontFamily: 'var(--cie-sans)' }}>{t("displaySelectSubtitle")}</p>
          {showGuide && <p className="mt-2 inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold" style={{
            border: '1px solid var(--cie-stroke)',
            background: 'var(--cie-btn-hover)',
            color: 'var(--card-foreground)',
            fontFamily: 'var(--cie-sans)',
            borderRadius: 'calc(var(--cie-r) / 2)'
          }}><span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px]" style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)'
          }}>1</span>{t("guideStep1Description")}</p>}
        </div>
      </div>

      <div className="mt-1 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
        {displays.length === 0 ? (
          <div className="rounded-lg p-3 text-xs" style={{
            border: '1px solid var(--cie-stroke)',
            background: 'var(--cie-btn)',
            color: 'var(--cie-ink-mute)',
            fontFamily: 'var(--cie-sans)',
            borderRadius: 'var(--cie-r)'
          }}>
            {t("screenNum")} 1 ({t("currentDisplay")})
          </div>
        ) : (
          displays.map((disp) => {
            const isSelected = targetDisplays.includes(disp.id) || (targetDisplays.length === 0 && disp.isFocused);
            const name = disp.name || `${t("screenNum")} ${disp.number}`;
            const width = disp.bounds?.width || 1920;
            const height = disp.bounds?.height || 1080;
            const ratio = (width / height).toFixed(2);

            return (
              <button
                type="button"
                key={disp.id}
                onClick={() => onToggleDisplay(disp.id)}
                aria-pressed={isSelected}
                aria-label={`${name} (${width}×${height})`}
                className="relative flex min-h-[142px] flex-col justify-between rounded-xl p-3 text-left transition-all focus-visible:outline-none"
                style={{
                  border: isSelected ? '2px solid var(--cie-ink)' : '1px solid var(--cie-stroke)',
                  background: isSelected ? 'var(--cie-ink)' : 'var(--card)',
                  color: isSelected ? 'var(--cie-paper)' : 'var(--card-foreground)',
                  borderRadius: 'var(--cie-r)',
                  cursor: 'pointer',
                  transition: `all var(--cie-t-snap) var(--cie-ease-expo)`
                }}
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs font-bold truncate" style={{ fontFamily: 'var(--cie-sans)' }}>{name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {disp.isFocused && (
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{
                        background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--cie-ink)',
                        color: isSelected ? 'inherit' : 'var(--cie-paper)',
                        fontFamily: 'var(--cie-sans)',
                        borderRadius: 'calc(var(--cie-r) / 3)'
                      }}>
                        {t("currentDisplay")}
                      </span>
                    )}
                    {isSelected && <Check style={{ width: '14px', height: '14px', marginLeft: '4px' }} />}
                  </div>
                </div>

                {/* Aspect Ratio Screen Visual Frame */}
                <div className="w-full flex items-center justify-center py-2 rounded-lg my-1" style={{
                  background: isSelected ? 'rgba(0,0,0,0.15)' : 'var(--cie-btn)',
                  border: '1px solid var(--cie-stroke)',
                  borderRadius: 'calc(var(--cie-r) / 2)'
                }}>
                  <div style={{ 
                    width: `${Math.max(44, (width / largestEdge) * 160)}px`, 
                    height: `${Math.max(30, (height / largestEdge) * 160)}px`,
                    border: '1px solid var(--cie-stroke)',
                    background: 'transparent',
                    borderRadius: 'calc(var(--cie-r) / 3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      border: '1px dashed var(--cie-stroke)',
                      borderRadius: 'calc(var(--cie-r) / 4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{
                        fontFamily: 'var(--cie-mono)',
                        fontSize: '10px',
                        color: 'var(--cie-ink-mute)'
                      }}>
                        {width}×{height}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
