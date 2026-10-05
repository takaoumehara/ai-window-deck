import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, LayoutList, Globe, Sun, Moon } from "lucide-react";
import { getTranslation, LANGUAGES } from "@/lib/i18n";
import { useTheme } from "@/hooks/useTheme";

export function Header({ lang, onLanguageChange, onOpenBig, onOpenDock }) {
  const t = (key) => getTranslation(lang, key);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--cie-stroke)' }}>
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg" style={{ 
          background: theme === 'dark' ? 'var(--cie-ink)' : 'var(--cie-paper)', 
          border: `1px solid ${theme === 'dark' ? 'var(--cie-ink-mute)' : 'var(--cie-paper-mute)'}`,
          borderRadius: 'var(--cie-r)'
        }}>
          <div className="w-2.5 h-2.5 rounded" style={{ 
            background: theme === 'dark' ? 'var(--cie-paper)' : 'var(--cie-ink)',
            position: 'absolute',
            top: '6px',
            right: '6px'
          }} />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight" style={{ 
            fontFamily: 'var(--cie-sans)',
            letterSpacing: '-0.03em',
            fontWeight: 600,
            color: theme === 'dark' ? 'var(--cie-ink)' : 'var(--cie-paper)'
          }}>
            {t("appTitle")}
          </h1>
          <p className="text-xs mt-0.5" style={{ 
            color: theme === 'dark' ? 'var(--cie-ink-mute)' : 'var(--cie-paper-mute)',
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
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all"
          style={{
            background: 'var(--cie-btn)',
            border: '1px solid var(--cie-stroke)',
            borderRadius: 'var(--cie-r-pill)',
            transition: 'all var(--cie-t-snap) var(--cie-ease-expo)'
          }}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" style={{ color: 'var(--cie-ink)' }} />
          ) : (
            <Moon className="w-4 h-4" style={{ color: 'var(--cie-paper)' }} />
          )}
        </button>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{
          background: 'var(--cie-btn)',
          border: '1px solid var(--cie-stroke)',
          borderRadius: 'var(--cie-r)'
        }}>
          <Globe className="w-3.5 h-3.5" style={{ color: theme === 'dark' ? 'var(--cie-ink-mute)' : 'var(--cie-paper-mute)' }} aria-hidden="true" />
          <select
            value={lang}
            onChange={(e) => onLanguageChange(e.target.value)}
            aria-label={t("languageLabel")}
            className="cursor-pointer rounded bg-transparent text-xs font-medium focus:outline-none"
            style={{
              color: theme === 'dark' ? 'var(--cie-ink)' : 'var(--cie-paper)',
              fontFamily: 'var(--cie-sans)'
            }}
          >
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code} lang={code} style={{
                background: theme === 'dark' ? 'var(--cie-paper)' : 'var(--cie-ink)',
                color: theme === 'dark' ? 'var(--cie-ink)' : 'var(--cie-paper)'
              }}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenDock}
          className="h-9 gap-1.5 text-xs"
          style={{
            background: 'var(--cie-btn)',
            border: '1px solid var(--cie-stroke)',
            borderRadius: 'var(--cie-r)',
            color: theme === 'dark' ? 'var(--cie-ink)' : 'var(--cie-paper)',
            transition: 'all var(--cie-t-snap) var(--cie-ease-expo)'
          }}
        >
          <LayoutList className="w-3.5 h-3.5" />
          <span>{t("openDock")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenBig}
          className="h-9 gap-1.5 text-xs"
          style={{
            background: 'var(--cie-btn)',
            border: '1px solid var(--cie-stroke)',
            borderRadius: 'var(--cie-r)',
            color: theme === 'dark' ? 'var(--cie-ink)' : 'var(--cie-paper)',
            transition: 'all var(--cie-t-snap) var(--cie-ease-expo)'
          }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{t("openBig")}</span>
        </Button>
      </div>
    </header>
  );
}
