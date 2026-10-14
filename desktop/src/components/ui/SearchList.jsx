import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, Check } from "lucide-react";

/**
 * A search field over a grouped listbox (combobox pattern): typing filters,
 * ↑/↓/Home/End move the active option, Enter picks it, Esc calls onEscape.
 * `groups` is [{ key, label, items: [{ id, label, detail?, icon?, selected? }] }],
 * already filtered by `query`.
 */
export function SearchList({ label, placeholder, query, onQuery, groups, onPick, onEscape, emptyLabel, tone = "ink", autoFocus = true, listClassName = "" }) {
  const id = useId();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const items = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const selectedIndex = items.findIndex((item) => item.selected);
  const [active, setActive] = useState(Math.max(0, selectedIndex));

  useEffect(() => {
    setActive(query ? 0 : Math.max(0, selectedIndex));
    // Only a new query or list resets the active option.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, items.length]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Only the list scrolls: scrollIntoView would also move a sheet around it.
  useEffect(() => {
    const list = listRef.current;
    const option = list?.querySelector(`[data-index="${active}"]`);
    if (!option) return;
    const header = 28;
    const top = option.offsetTop - header;
    const bottom = option.offsetTop + option.offsetHeight + 4;
    if (top < list.scrollTop) list.scrollTop = Math.max(0, top);
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [active]);

  const onKeyDown = (event) => {
    const last = items.length - 1;
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step) {
      event.preventDefault();
      setActive((current) => Math.min(last, Math.max(0, current + step)));
    } else if (event.key === "Home" && !query) {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End" && !query) {
      event.preventDefault();
      setActive(last);
    } else if (event.key === "PageDown" || event.key === "PageUp") {
      event.preventDefault();
      setActive((current) => Math.min(last, Math.max(0, current + (event.key === "PageDown" ? 8 : -8))));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (items[active]) onPick(items[active].id);
    } else if (event.key === "Escape" && onEscape) {
      event.preventDefault();
      event.stopPropagation();
      onEscape();
    }
  };

  const onInk = tone === "ink";
  const mute = onInk ? "text-ink-mute" : "text-paper-mute";
  let index = -1;
  return (
    <div className="flex min-h-0 flex-col">
      <label className={`flex shrink-0 items-center gap-2 border-b px-3 ${onInk ? "border-paper/15" : "border-ink/15"}`}>
        <Search className={`h-3.5 w-3.5 shrink-0 ${mute}`} aria-hidden="true" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded="true"
          aria-controls={`${id}-list`}
          aria-activedescendant={items[active] ? `${id}-${active}` : undefined}
          aria-autocomplete="list"
          aria-label={label}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className={`h-9 min-w-0 flex-1 bg-transparent text-[13px] outline-none ${onInk ? "text-paper placeholder:text-paper-hint" : "text-ink placeholder:text-ink-hint"}`}
        />
      </label>
      <div ref={listRef} id={`${id}-list`} role="listbox" aria-label={label} className={`relative min-h-0 flex-1 overflow-y-auto py-1 ${listClassName}`}>
        {items.length === 0 && <p className={`px-3 py-3 text-xs ${mute}`}>{emptyLabel}</p>}
        {groups.map((group) =>
          group.items.length ? (
            <div key={group.key} role="group" aria-labelledby={`${id}-g-${group.key}`}>
              {group.label && (
                <div id={`${id}-g-${group.key}`} className={`register sticky top-0 z-[1] px-3 pb-1 pt-2 uppercase ${mute} ${onInk ? "bg-ink" : "bg-paper"}`}>
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                index += 1;
                const at = index;
                const isActive = at === active;
                return (
                  <div
                    key={`${group.key}:${item.id}`}
                    id={`${id}-${at}`}
                    data-index={at}
                    role="option"
                    aria-selected={Boolean(item.selected)}
                    title={item.title}
                    onMouseMove={() => active !== at && setActive(at)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onPick(item.id)}
                    className={`mx-1 flex cursor-pointer items-center gap-2 rounded-tick px-2 py-1.5 text-[13px] ${
                      isActive ? (onInk ? "bg-paper/10" : "bg-ink/[0.07]") : ""
                    }`}
                  >
                    {item.icon}
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.detail && <span className={`register shrink-0 tabular-nums ${mute}`}>{item.detail}</span>}
                    <Check className={`h-3.5 w-3.5 shrink-0 ${item.selected ? "" : "invisible"}`} aria-hidden="true" />
                  </div>
                );
              })}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
