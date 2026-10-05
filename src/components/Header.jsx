import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, LayoutList, Globe, Sun, Moon } from "lucide-react";
import { getTranslation, LANGUAGES } from "@/lib/i18n";
import { useTheme } from "@/contexts/ThemeContext";

export function Header({ lang, onLanguageChange, onOpenBig, onOpenDock }) {
  const t = (key) => getTranslation(lang, key);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-5" style={{ 
      borderBottom: `1px solid var(--cie-stroke)`
    }}>
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center" style={{ 
          width: '40px',
          height: '40px',
          background: 'var(--cie-btn)', 
          border: `1px solid var(--cie-stroke)`,
          borderRadius: 'var(--cie-r)'
        }}>
          <div style={{ 
            width: '10px',
            height: '10px',
            borderRadius: '2px',
            background: 'var(--cie-ink)',
            position: 'absolute',
            top: '6px',
            right: '6px'
          }} />
        </div>
        <div>
          <h1 style={{ 
            fontFamily: 'var(--cie-sans)',
            fontSize: '18px',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: 'var(--cie-ink)'
          }}>
            {t("appTitle")}
          </h1>
          <p className="text-xs mt-0.5" style={{ 
            color: 'var(--cie-ink-mute)',
            fontFamily: 'var(--cie-sans)'
          }}>
            {t("appSubtitle")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center justify-center"
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            background: 'var(--cie-btn)',
            border: '1px solid var(--cie-stroke)',
            borderRadius: 'var(--cie-r-pill)',
            transition: `all var(--cie-t-snap) var(--cie-ease-expo)`,
            cursor: 'pointer'
          }}
        >
          {theme === 'dark' ? (
            <Sun style={{ width: '16px', height: '16px', color: 'var(--cie-paper)' }} />
          ) : (
            <Moon style={{ width: '16px', height: '16px', color: 'var(--cie-ink)' }} />
          )}
        </button>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5" style={{
          background: 'var(--cie-btn)',
          border: '1px solid var(--cie-stroke)',
          borderRadius: 'var(--cie-r)',
          minHeight: '36px'
        }}>
          <Globe style={{ width: '14px', height: '14px', color: 'var(--cie-ink-mute)' }} aria-hidden="true" />
          <select
            value={lang}
            onChange={(e) => onLanguageChange(e.target.value)}
            aria-label={t("languageLabel")}
            className="cursor-pointer rounded bg-transparent text-xs font-medium"
            style={{
              color: 'var(--cie-ink)',
              fontFamily: 'var(--cie-sans)',
              border: 'none',
              outline: 'none',
              minHeight: '24px'
            }}
          >
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code} lang={code} style={{
                background: 'var(--cie-paper)',
                color: 'var(--cie-ink)'
              }}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onOpenDock}
          className="flex items-center gap-1.5 px-3 text-xs"
          style={{
            background: 'var(--cie-btn)',
            border: '1px solid var(--cie-stroke)',
            borderRadius: 'var(--cie-r)',
            color: 'var(--cie-ink)',
            transition: `all var(--cie-t-snap) var(--cie-ease-expo)`,
            cursor: 'pointer',
            minHeight: '36px',
            fontFamily: 'var(--cie-sans)',
            fontWeight: 500
          }}
        >
          <LayoutList style={{ width: '14px', height: '14px' }} />
          <span>{t("openDock")}</span>
        </button>

        <button
          onClick={onOpenBig}
          className="flex items-center gap-1.5 px-3 text-xs"
          style={{
            background: 'var(--cie-btn)',
            border: '1px solid var(--cie-stroke)',
            borderRadius: 'var(--cie-r)',
            color: 'var(--cie-ink)',
            transition: `all var(--cie-t-snap) var(--cie-ease-expo)`,
            cursor: 'pointer',
            minHeight: '36px',
            fontFamily: 'var(--cie-sans)',
            fontWeight: 500
          }}
        >
          <ExternalLink style={{ width: '14px', height: '14px' }} />
          <span>{t("openBig")}</span>
        </button>
      </div>
    </header>
  );
}
