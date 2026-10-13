import React, { useEffect, useMemo, useState } from "react";
import { Sheet } from "@desktop/components/ui/Sheet";
import { Button, Field } from "@desktop/components/ui/controls";
import { hostLabel, parsePastedList, urlList } from "@desktop/lib/deck-data";

function Choice({ name, value, checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="h-3.5 w-3.5 accent-[var(--cie-ink)]" />
      {children}
    </label>
  );
}

// Paste a plain list of URLs or the extension's window list, check the
// preview, then add the windows to this set or to a new one.
export function PasteListSheet({ t, open, currentSetName, onClose, onSubmit }) {
  const fieldId = React.useId();
  const [text, setText] = useState("");
  const [together, setTogether] = useState(false);
  const [destination, setDestination] = useState("current");
  const [setName, setSetName] = useState("");

  useEffect(() => {
    if (!open) return;
    setText("");
    setTogether(false);
    setDestination("current");
    setSetName(t("pastedSetName"));
  }, [open, t]);

  const { windows, named } = useMemo(() => parsePastedList(text, { together }), [text, together]);
  const urlCount = windows.reduce((sum, item) => sum + urlList(item).length, 0);

  const submit = (event) => {
    event.preventDefault();
    if (!windows.length) return;
    onSubmit({ windows, newSetName: destination === "new" ? setName.trim() || t("pastedSetName") : null });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={t("pasteList")} closeLabel={t("close")}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${fieldId}-text`} className="cie-mono text-paper-mute">{t("pasteLabel")}</label>
          <textarea
            id={`${fieldId}-text`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("pastePlaceholder")}
            rows={7}
            spellCheck={false}
            className="w-full resize-y rounded-tick border border-ink/25 bg-transparent px-3 py-2 font-mono text-xs leading-5 text-ink transition-colors duration-fast placeholder:text-paper-mute hover:border-ink/50 focus:border-ink focus:outline-none"
          />
          <p className="text-xs leading-5 text-paper-mute">{t("pasteHelp")}</p>
        </div>

        {!named && urlCount > 1 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">{t("pastePreview")}</legend>
            <Choice name={`${fieldId}-group`} value="split" checked={!together} onChange={() => setTogether(false)}>{t("pasteSplit")}</Choice>
            <Choice name={`${fieldId}-group`} value="together" checked={together} onChange={() => setTogether(true)}>{t("pasteTogether")}</Choice>
          </fieldset>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="cie-mono mb-2 text-paper-mute">{t("pasteDestination")}</legend>
          <Choice name={`${fieldId}-dest`} value="current" checked={destination === "current"} onChange={setDestination}>
            {t("pasteToCurrent", { name: currentSetName })}
          </Choice>
          <Choice name={`${fieldId}-dest`} value="new" checked={destination === "new"} onChange={setDestination}>{t("pasteToNew")}</Choice>
          {destination === "new" && (
            <Field value={setName} onChange={(event) => setSetName(event.target.value)} aria-label={t("pasteNewSetName")} placeholder={t("pasteNewSetName")} />
          )}
        </fieldset>

        <section className="flex flex-col gap-2" aria-live="polite">
          <h3 className="cie-mono text-paper-mute">{t("pastePreview")}</h3>
          {windows.length ? (
            <ol className="flex max-h-56 flex-col overflow-y-auto">
              {windows.map((item, index) => {
                const urls = urlList(item);
                return (
                  <li key={item.id} className="flex items-baseline gap-3 border-t border-ink/10 py-2">
                    <span className="register w-5 shrink-0 text-right text-paper-mute">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{item.name}</span>
                      <span className="register block truncate text-paper-mute">
                        {urls.slice(0, 3).map(hostLabel).join(" · ")}
                        {urls.length > 3 ? ` · +${urls.length - 3}` : ""}
                      </span>
                    </span>
                    <span className="register shrink-0 text-paper-mute">{urls.length} {t(urls.length === 1 ? "urlSingular" : "urlsCount")}</span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="border-t border-ink/10 py-2 text-sm text-paper-mute">{t("pasteEmpty")}</p>
          )}
        </section>

        <div className="flex justify-end gap-2 pt-1">
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button type="submit" tone="ink" disabled={!windows.length}>
            {windows.length === 1 ? t("pasteSubmitOne") : t("pasteSubmit", { count: windows.length })}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
