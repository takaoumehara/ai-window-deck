import React from "react";
import { ChevronRight, ClipboardPaste, Keyboard, Layers, Upload } from "lucide-react";
import { Sheet } from "@desktop/components/ui/Sheet";
import { Button } from "@desktop/components/ui/controls";
import { LANGUAGES } from "@desktop/lib/strings";

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="register uppercase text-paper-mute">{title}</h3>
      {children}
    </section>
  );
}

function Choices({ label, options, value, onChange, columns = "grid-cols-3" }) {
  return (
    <div role="radiogroup" aria-label={label} className={`grid gap-1.5 ${columns}`}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            lang={option.lang}
            onClick={() => onChange(option.value)}
            className={`cie-tap ink-swap h-9 truncate rounded-pill border border-solid px-3 text-sm ${
              selected ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink/60"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ActionRow({ icon: Icon, title, hint, keyLabel, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cie-tap group flex items-center gap-3 border-t border-ink/10 py-2.5 text-left"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm">{title}</span>
        {hint && <span className="text-xs text-paper-mute">{hint}</span>}
      </span>
      {keyLabel && <kbd className="key shrink-0">{keyLabel}</kbd>}
      <ChevronRight className="h-4 w-4 shrink-0 text-paper-mute transition-transform duration-fast group-hover:translate-x-0.5" aria-hidden="true" />
    </button>
  );
}

export function SettingsSheet({
  t, open, onClose, lang, onLang, defaultMode, onDefaultMode, modeOptions, appVersion, keys,
  onPasteList, onImport, onManageSets, onShortcuts, onCheckUpdates,
}) {
  return (
    <Sheet open={open} onClose={onClose} title={t("settings")} closeLabel={t("close")}>
      <div className="flex flex-col gap-6">
        <Section title={t("languageLabel")}>
          <Choices
            label={t("languageLabel")}
            options={LANGUAGES.map(({ code, label }) => ({ value: code, label, lang: code }))}
            value={lang}
            onChange={onLang}
          />
        </Section>

        <Section title={t("settingsDefaultMode")}>
          <Choices
            label={t("settingsDefaultMode")}
            options={modeOptions.map(({ id, label }) => ({ value: id, label: t(label) }))}
            value={defaultMode}
            onChange={onDefaultMode}
          />
        </Section>

        <Section title={t("settingsData")}>
          <div className="flex flex-col">
            <ActionRow icon={ClipboardPaste} title={t("pasteList")} hint={t("pasteListHint")} onClick={onPasteList} />
            <ActionRow icon={Upload} title={t("importBackup")} hint={t("importHint")} onClick={onImport} />
            <ActionRow icon={Layers} title={t("manageSets")} hint={t("manageSetsHint")} keyLabel={keys.sets} onClick={onManageSets} />
          </div>
        </Section>

        <Section title={t("settingsHelp")}>
          <div className="flex flex-col">
            <ActionRow icon={Keyboard} title={t("shortcuts")} hint={t("shortcutsHint")} onClick={onShortcuts} />
          </div>
        </Section>

        <div className="flex items-center justify-between gap-6 border-t border-ink/10 pt-4">
          <span className="register text-paper-mute">{t("versionLabel", { version: appVersion || "dev" })}</span>
          <Button tone="ink" onClick={onCheckUpdates}>{t("checkUpdates")}</Button>
        </div>
      </div>
    </Sheet>
  );
}
