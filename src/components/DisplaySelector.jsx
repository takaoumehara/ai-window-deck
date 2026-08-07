import React, { useState, useEffect } from "react";
import { Monitor, Check } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function DisplaySelector({ lang, targetDisplays, onToggleDisplay }) {
  const [displays, setDisplays] = useState([]);
  const t = (key) => getTranslation(lang, key);

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
    <div className="flex flex-col gap-2.5 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-blue-400" />
            <span>{t("displaySelectTitle")}</span>
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">{t("displaySelectSubtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-1">
        {displays.length === 0 ? (
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400">
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
              <div
                key={disp.id}
                onClick={() => onToggleDisplay(disp.id)}
                className={`relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                    : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 hover:bg-zinc-850"
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs font-bold text-zinc-100 truncate">{name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {disp.isFocused && (
                      <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">
                        {t("currentDisplay")}
                      </span>
                    )}
                    {disp.isPrimary && (
                      <span className="text-[9px] font-medium bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
                        {t("primaryDisplay")}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 ml-1" />}
                  </div>
                </div>

                {/* Aspect Ratio Screen Visual Frame */}
                <div className="w-full flex items-center justify-center py-2 bg-zinc-950/80 rounded-lg border border-zinc-800/80 my-1">
                  <div
                    style={{ aspectRatio: `${ratio}` }}
                    className="w-20 rounded border border-blue-500/30 bg-blue-500/5 flex flex-col items-center justify-center p-1"
                  >
                    <div className="w-full h-full border border-dashed border-blue-400/40 rounded flex items-center justify-center">
                      <span className="text-[9px] font-mono text-zinc-400">
                        {width}×{height}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
