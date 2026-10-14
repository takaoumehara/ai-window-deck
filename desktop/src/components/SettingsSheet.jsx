import React from "react";
import { ChevronRight, ClipboardPaste, Keyboard, Layers, Upload } from "lucide-react";
import { Sheet } from "@desktop/components/ui/Sheet";
import { Button, Checks, Choices } from "@desktop/components/ui/controls";
import { LANGUAGES } from "@desktop/lib/strings";

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="register uppercase text-paper-mute">{title}</h3>
      {children}
    </section>
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

const DEVICE_GROUPS = [
  ["ios", "iPhone"],
  ["android", "Android"],
  ["ipados", "iPad"],
];

export function SettingsSheet({
  t, open, onClose, lang, onLang, defaultMode, onDefaultMode, modeOptions, devices, devicesUpdated, previewIds, onPreviewDevices, defaultDevice, onDefaultDevice, appVersion, keys,
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

        {devices.length > 0 && (
          <Section title={t("settingsDevice")}>
            <p className="text-xs leading-5 text-paper-mute">{t("settingsDeviceHint")}</p>
            {DEVICE_GROUPS.map(([os, label]) => {
              const list = devices.filter((device) => device.os === os);
              if (!list.length) return null;
              return (
                <div key={os} className="flex flex-col gap-1.5">
                  <span className="register text-paper-mute">{label}</span>
                  <Checks
                    label={label}
                    options={list.map((device) => ({ value: device.id, label: device.name }))}
                    values={previewIds}
                    onChange={onPreviewDevices}
                  />
                </div>
              );
            })}
            <span className="register text-paper-mute">{t("settingsDeviceStart")}</span>
            <Choices
              label={t("settingsDeviceStart")}
              options={(previewIds.length ? devices.filter((device) => previewIds.includes(device.id)) : devices).map((device) => ({ value: device.id, label: device.name }))}
              value={defaultDevice}
              onChange={onDefaultDevice}
              columns="grid-cols-2"
            />
            <span className="register text-paper-mute">
              {t("deviceCatalogInfo", { count: devices.length, date: devicesUpdated || "—" })}
            </span>
          </Section>
        )}

        <Section title={t("settingsSignIn")}>
          <p className="text-xs leading-5 text-paper-mute">{t("settingsSignInNote")}</p>
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
