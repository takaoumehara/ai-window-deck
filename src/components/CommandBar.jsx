import React from "react";
import { Maximize, RotateCcw, ArrowLeft, ArrowRight, Grid, Play, Undo, Expand } from "lucide-react";
import { getTranslation } from "@/lib/i18n";
import { useShortcuts } from "@/hooks/useShortcuts";

export function CommandBar({ lang, onAction }) {
  const t = (key) => getTranslation(lang, key);
  const shortcuts = useShortcuts();

  return (
    <section className="mb-5 flex flex-col gap-2.5" aria-label={t("commandsLabel")}>
      {/* Primary Hero Row (2x Height Prominent Cards) */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <button
          onClick={() => onAction("spotlight")}
          className="h-[58px] flex justify-start items-center gap-3 px-5 text-[15px] rounded-lg font-semibold transition-all"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: '1px solid var(--cie-stroke)',
            borderRadius: 'var(--cie-r)',
            fontFamily: 'var(--cie-sans)',
            cursor: 'pointer',
            transition: `all var(--cie-t-snap) var(--cie-ease-expo)`
          }}
        >
          <Maximize style={{ width: '20px', height: '20px' }} />
          <div className="flex items-center gap-2">
            <span>{t("spotlight")}</span>
            <span className="key-cap">{shortcuts["toggle-spotlight"]}</span>
          </div>
        </button>

        <button
          onClick={() => onAction("home")}
          className="h-[58px] flex justify-start items-center gap-3 px-5 text-[15px] rounded-lg font-semibold transition-all"
          style={{
            background: 'var(--cie-btn)',
            color: 'var(--foreground)',
            border: '1px solid var(--cie-stroke)',
            borderRadius: 'var(--cie-r)',
            fontFamily: 'var(--cie-sans)',
            cursor: 'pointer',
            transition: `all var(--cie-t-snap) var(--cie-ease-expo)`
          }}
        >
          <RotateCcw style={{ width: '20px', height: '20px', color: 'var(--foreground)' }} />
          <div className="flex items-center gap-2">
            <span>{t("restore")}</span>
            <span className="key-cap">{shortcuts["restore-home"]}</span>
          </div>
        </button>
      </div>

      {/* Secondary Uniform Commands Row */}
      <div className="flex flex-wrap gap-2 rounded-xl p-2" style={{
        border: '1px solid var(--cie-stroke)',
        background: 'var(--cie-btn)',
        borderRadius: 'var(--cie-r)'
      }}>
        {[
          { icon: ArrowLeft, action: 'prev', label: t("prev") },
          { icon: ArrowRight, action: 'next', label: t("next") },
          { icon: Grid, action: 'retile', label: t("retile") },
          { icon: Play, action: 'launch', label: t("launchAll") },
          { icon: Undo, action: 'undo', label: t("undo") },
          { icon: Expand, action: 'fullscreen', label: t("fullscreenWindow") }
        ].map(({ icon: Icon, action, label }) => (
          <button
            key={action}
            onClick={() => onAction(action)}
            className="h-9 flex items-center gap-2 px-3 text-xs rounded-lg transition-all"
            style={{
              background: 'var(--cie-btn)',
              border: '1px solid var(--cie-stroke)',
              borderRadius: 'calc(var(--cie-r) / 2)',
              color: 'var(--foreground)',
              fontFamily: 'var(--cie-sans)',
              cursor: 'pointer',
              transition: `all var(--cie-t-snap) var(--cie-ease-expo)`
            }}
          >
            <Icon style={{ width: '14px', height: '14px', color: 'var(--cie-ink-mute)' }} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
