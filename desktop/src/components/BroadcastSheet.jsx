import React, { useEffect, useState } from "react";
import { Sheet } from "@desktop/components/ui/Sheet";
import { Button, CheckRow } from "@desktop/components/ui/controls";

// Send to several AIs: one prompt typed into each chosen AI pane. Send is
// pressed only when the user ticks it; the prompt is kept for the next time.
export function BroadcastSheet({ t, open, panes, onClose, onSubmit }) {
  const fieldId = React.useId();
  const [text, setText] = useState("");
  const [chosen, setChosen] = useState([]);
  const [submit, setSubmit] = useState(false);
  const [compare, setCompare] = useState(false);

  useEffect(() => {
    if (open) setChosen(panes.map((pane) => pane.id));
    // Only when the sheet opens: a pane changing site meanwhile keeps the ticks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const targets = chosen.filter((id) => panes.some((pane) => pane.id === id));
  const ready = text.trim() && targets.length > 0;

  const send = (event) => {
    event?.preventDefault();
    if (!ready) return;
    onSubmit({ paneIds: targets, text, submit, compare });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("broadcastTitle")}
      closeLabel={t("close")}
      footer={
        <>
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button type="submit" form={`${fieldId}-form`} tone="ink" disabled={!ready}>
            {t(submit ? "broadcastSend" : "broadcastInsert")}
          </Button>
        </>
      }
    >
      <form id={`${fieldId}-form`} onSubmit={send} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${fieldId}-text`} className="cie-mono text-paper-mute">{t("broadcastPrompt")}</label>
          <textarea
            id={`${fieldId}-text`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing) send(event);
            }}
            rows={6}
            className="w-full resize-y rounded-tick border border-ink-edge bg-transparent px-3 py-2 text-sm leading-6 text-ink transition-colors duration-fast placeholder:text-paper-mute hover:border-ink focus:border-ink deck-focus-ring"
          />
        </div>

        <fieldset className="flex flex-col">
          <legend className="cie-mono mb-2 text-paper-mute">{t("broadcastPanes")}</legend>
          {panes.length ? (
            panes.map((pane) => (
              <CheckRow
                key={pane.id}
                checked={chosen.includes(pane.id)}
                onChange={(checked) => setChosen((list) => (checked ? [...list, pane.id] : list.filter((id) => id !== pane.id)))}
                title={pane.name}
              >
                <span className="register shrink-0 text-paper-mute">{pane.site}</span>
              </CheckRow>
            ))
          ) : (
            <p className="border-t border-ink/10 py-2 text-sm text-paper-mute">{t("broadcastNoPanes")}</p>
          )}
        </fieldset>

        <div className="flex flex-col">
          <CheckRow checked={submit} onChange={setSubmit} title={t("broadcastSubmit")} hint={t("broadcastSubmitHint")} />
          <CheckRow checked={compare} onChange={setCompare} title={t("broadcastCompare")} />
        </div>
      </form>
    </Sheet>
  );
}
