import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Sheet } from "@desktop/components/ui/Sheet";
import { searchPalette } from "@desktop/lib/palette";

/**
 * ⌘K: every feature in plain words. Typing filters (synonyms and English
 * words count too), ↑↓ choose, Enter runs the command on the focused pane.
 */
export function CommandPalette({ t, open, onClose, entries, groups, groupLabel, targetName, onRun, onAskAi }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
  }, [open]);

  const results = useMemo(() => {
    const found = searchPalette(entries, query);
    if (query.trim()) return found;
    // Unfiltered, the list reads as a table of contents, group by group.
    return groups.flatMap((group) => found.filter((entry) => entry.group === group));
  }, [entries, groups, query]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, results]);

  const onKeyDown = (event) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!results.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current + step + results.length) % results.length);
    } else if (event.key === "Home" && results.length) {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End" && results.length) {
      event.preventDefault();
      setActive(results.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (results[active]) onRun(results[active].id);
      else if (query.trim()) onAskAi(query.trim());
    }
  };

  const searching = Boolean(query.trim());
  const optionId = (index) => `${listId}-option-${index}`;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("paletteTitle")}
      closeLabel={t("close")}
      wide
      bodyClassName="h-[min(52vh,420px)]"
      toolbar={
        <div className="flex flex-col gap-3">
          <label className="deck-focus-within flex items-center gap-2 rounded-tick border border-ink-edge px-3 focus-within:border-ink">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={results[active] ? optionId(active) : undefined}
              aria-label={t("paletteTitle")}
              placeholder={t("palettePlaceholder")}
              spellCheck={false}
              autoComplete="off"
              className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-paper-mute"
            />
          </label>
          <p className="text-xs text-paper-mute">{targetName ? t("paletteTarget", { name: targetName }) : t("paletteNoPane")}</p>
        </div>
      }
      footer={<p className="register mr-auto text-paper-mute" aria-hidden="true">{t("paletteHint")}</p>}
    >
      <div className="flex flex-col gap-3">
        <ul ref={listRef} id={listId} role="listbox" aria-label={t("paletteTitle")} className="-mx-2 flex flex-col">
          {results.map((entry, index) => {
            const selected = index === active;
            const header = !searching && (index === 0 || results[index - 1].group !== entry.group);
            return (
              <React.Fragment key={entry.id}>
                {header && (
                  <li role="presentation" className="register px-2 pb-1 pt-3 uppercase text-paper-mute first:pt-0">
                    {groupLabel(entry.group)}
                  </li>
                )}
                <li
                  id={optionId(index)}
                  data-index={index}
                  role="option"
                  aria-selected={selected}
                  onMouseMove={() => !selected && setActive(index)}
                  onClick={() => onRun(entry.id)}
                  className={`flex cursor-pointer items-center gap-3 rounded-tick px-2 py-2 ${selected ? "bg-ink text-paper" : ""}`}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm">{entry.label}</span>
                    {searching && <span className={`truncate text-xs ${selected ? "text-ink-mute" : "text-paper-mute"}`}>{groupLabel(entry.group)}</span>}
                  </span>
                  {entry.shortcut && <kbd className={`key shrink-0 ${selected ? "border-paper-edge" : ""}`}>{entry.shortcut}</kbd>}
                </li>
              </React.Fragment>
            );
          })}
        </ul>

        {searching && !results.length && (
          <div className="flex flex-col items-start gap-2 border-t border-ink/10 pt-3">
            <p className="text-sm">{t("paletteEmpty")}</p>
            <button
              type="button"
              onClick={() => onAskAi(query.trim())}
              className="cie-tap inline-flex h-9 items-center gap-1.5 rounded-pill bg-ink px-4 text-sm text-paper transition-colors duration-fast hover:bg-ink/85"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t("paletteAskAi", { query: query.trim() })}
            </button>
          </div>
        )}

        <span className="sr-only" aria-live="polite">{searching ? t("paletteResults", { count: results.length }) : ""}</span>
      </div>
    </Sheet>
  );
}
