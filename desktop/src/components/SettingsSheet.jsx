import React from "react";
import { ChevronRight, ClipboardPaste, Keyboard, Layers, LogIn, Upload } from "lucide-react";
import { Sheet } from "@desktop/components/ui/Sheet";
import { Button, CheckRow, Choices } from "@desktop/components/ui/controls";
import { LANGUAGES } from "@desktop/lib/strings";
import { DeviceList, deviceLabel } from "@desktop/components/DevicePicker";
import aiCatalog from "../../electron/ai-sites.json";

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

export function SettingsSheet({
  t, open, onClose, lang, onLang, defaultMode, onDefaultMode, modeOptions, devices, devicesUpdated, defaultDevice, onDefaultDevice, recentDevices, appVersion, keys,
  onPasteList, onImport, onManageSets, onShortcuts, onCheckUpdates, onSignIn, ai, onAi,
}) {
  const currentDevice = devices.find((device) => device.id === defaultDevice);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("settings")}
      closeLabel={t("close")}
      footer={
        <>
          <span className="register mr-auto text-paper-mute">{t("versionLabel", { version: appVersion || "dev" })}</span>
          <Button tone="ink" onClick={onCheckUpdates}>{t("checkUpdates")}</Button>
        </>
      }
    >
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
            <p className="text-sm">
              <span className="text-paper-mute">{t("settingsDeviceCurrent")} </span>
              {currentDevice ? deviceLabel(t, currentDevice) : defaultDevice}
            </p>
            <div className="flex h-72 flex-col overflow-hidden rounded-block border border-ink-edge">
              <DeviceList t={t} devices={devices} value={defaultDevice} recent={recentDevices} tone="paper" autoFocus={false} onPick={onDefaultDevice} />
            </div>
            <span className="register text-paper-mute">
              {t("deviceCatalogInfo", { count: devices.length, date: devicesUpdated || "—" })}
            </span>
          </Section>
        )}

        <Section title={t("settingsAi")}>
          <p className="text-xs leading-5 text-paper-mute">{t("settingsAiNote")}</p>
          <div className="flex flex-col">
            <CheckRow checked={ai.enabled} onChange={(enabled) => onAi({ ...ai, enabled })} title={t("settingsAiEnabled")} />
            <CheckRow checked={ai.notify} disabled={!ai.enabled} onChange={(notify) => onAi({ ...ai, notify })} title={t("settingsAiNotify")} />
            <CheckRow checked={ai.sound} disabled={!ai.enabled || !ai.notify} onChange={(sound) => onAi({ ...ai, sound })} title={t("settingsAiSound")} />
          </div>
          <fieldset disabled={!ai.enabled} className="flex flex-col gap-1.5 disabled:opacity-40">
            <legend className="register mb-1.5 uppercase text-paper-mute">{t("settingsAiSites")}</legend>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1">
              {aiCatalog.sites.map((site) => (
                <label key={site.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={!ai.off.includes(site.id)}
                    onChange={(event) => onAi({ ...ai, off: event.target.checked ? ai.off.filter((id) => id !== site.id) : [...ai.off, site.id] })}
                    className="deck-focus-ring h-4 w-4 shrink-0 accent-ink [color-scheme:light]"
                  />
                  <span className="truncate">{site.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Section>

        <Section title={t("settingsSignIn")}>
          <p className="text-xs leading-5 text-paper-mute">{t("settingsSignInNote")}</p>
          <div className="flex flex-col">
            {[["google", "cmdGoogleSignIn"], ["github", "cmdGitHubSignIn"], ["vercel", "cmdVercelSignIn"]].map(([provider, label]) => (
              <ActionRow key={provider} icon={LogIn} title={t(label)} hint={t("signInWindowHint")} onClick={() => onSignIn(provider)} />
            ))}
          </div>
          <p className="text-xs leading-5 text-paper-mute">{t("settingsPasskeyNote")}</p>
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
      </div>
    </Sheet>
  );
}
