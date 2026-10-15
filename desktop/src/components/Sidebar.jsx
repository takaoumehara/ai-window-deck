import React from "react";
import { Plus, Minus, Eye, EyeOff, PanelLeftOpen, ChevronsUpDown, Moon, Coffee } from "lucide-react";
import { IconButton } from "@desktop/components/ui/controls";
import { urlList, hostLabel } from "@desktop/lib/deck-data";
import { AiBadge } from "@desktop/components/AiBadge";

function initials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  const word = words[0] || "?";
  return word[0].toUpperCase() + (word[1] || "").toLowerCase();
}

// The page's own icon once it has loaded, else the site's /favicon.ico (hidden
// windows have no page yet), else the window's initials.
function Favicon({ favicon, url, name }) {
  const candidates = React.useMemo(() => {
    const list = [];
    if (favicon) list.push(favicon);
    try {
      const { protocol, host } = new URL(url);
      if (/^https?:$/.test(protocol)) list.push(`${protocol}//${host}/favicon.ico`);
    } catch {
      // No usable URL; initials it is.
    }
    return [...new Set(list)];
  }, [favicon, url]);
  // Failures are counted per candidate list: an image can fail before an
  // effect would get the chance to reset the count.
  const key = candidates.join(" ");
  const [failure, setFailure] = React.useState({ key, count: 0 });
  const src = candidates[failure.key === key ? failure.count : 0];
  if (!src) {
    return (
      <span className="weight grid h-[18px] min-w-[18px] shrink-0 place-items-center text-[11px] leading-none tracking-[-0.02em]" style={{ "--w": 550 }}>
        {initials(name)}
      </span>
    );
  }
  // A paper tile keeps dark logos visible on the ink ground.
  return (
    <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-tick bg-paper">
      <img
        src={src}
        alt=""
        className="h-3.5 w-3.5 rounded-[2px] object-contain"
        onError={() => setFailure((current) => ({ key, count: (current.key === key ? current.count : 0) + 1 }))}
        draggable={false}
      />
    </span>
  );
}

function VisibilityButton({ t, item, className = "" }) {
  const visible = item.visible !== false;
  const label = t(visible ? "hidePane" : "showPane", { name: item.name || t("untitledWindow") });
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        item.onToggle();
      }}
      onDoubleClick={(event) => event.stopPropagation()}
      aria-pressed={visible}
      aria-label={label}
      title={label}
      className={`cie-tap grid h-6 w-6 shrink-0 place-items-center rounded-pill transition-[opacity,background-color] duration-fast hover:bg-btn ${className}`}
    >
      {visible ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
    </button>
  );
}

// Current set; a click opens the set list (⌥S). With several sets the expanded
// sidebar also lists them as chips for one-click switching.
function SetSwitcher({ t, sets, currentSetId, openElsewhere, setLabel, onSwitchSet, onOpenSets, setsKey, compact }) {
  const current = sets.find((set) => set.id === currentSetId);
  const label = t("switchSet", { key: setsKey });
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onOpenSets}
        aria-label={`${label}: ${setLabel(current)}`}
        title={label}
        className="cie-tap ink-swap flex min-w-0 items-center gap-2 rounded-pill border border-solid border-paper-edge px-3 py-1.5 text-left hover:border-paper"
      >
        <span className={`weight min-w-0 flex-1 truncate ${compact ? "text-xs" : "text-sm"}`} style={{ "--w": 550 }}>{setLabel(current)}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ink-mute" aria-hidden="true" />
      </button>
      {!compact && sets.length > 1 && (
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={t("setsTitle")}>
          {sets.map((set, index) => {
            const selected = set.id === currentSetId;
            const elsewhere = openElsewhere.includes(set.id);
            return (
              <button
                key={set.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSwitchSet(set.id)}
                title={elsewhere ? `${setLabel(set)} — ${t("setOpenElsewhere")}` : setLabel(set)}
                className={`register cie-tap ink-swap flex max-w-full items-center gap-1 rounded-pill border border-solid px-2 py-0.5 ${
                  selected ? "border-paper bg-paper text-ink" : "border-paper-edge text-ink-mute hover:border-paper hover:text-paper"
                }`}
              >
                <span>{index + 1}</span>
                <span className="truncate">{setLabel(set)}</span>
                {elsewhere && <span className="h-1.5 w-1.5 shrink-0 rounded-pill bg-current" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Small marks on a card: the pane's page is asleep, or the pane never sleeps.
function PaneMarks({ t, keepAwake, asleep, focused }) {
  if (!keepAwake && !asleep) return null;
  return (
    <span className={`flex shrink-0 items-center gap-1 self-center ${focused ? "text-paper-mute" : "text-ink-mute"}`}>
      {asleep && (
        <span role="img" aria-label={t("sleepingLabel")} title={t("sleepingLabel")}>
          <Moon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      )}
      {keepAwake && (
        <span role="img" aria-label={t("keepAwakeLabel")} title={t("keepAwakeLabel")}>
          <Coffee className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      )}
    </span>
  );
}

function RailTile({ t, item, order, focused, favicon, ai, onClick, onDoubleClick }) {
  const inDeck = order >= 0;
  const urls = urlList(item);
  const name = item.name || t("untitledWindow");
  const hosts = [...new Set(urls.map(hostLabel))].slice(0, 2);
  const mute = focused ? "text-paper-mute" : "text-ink-mute";
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        aria-current={focused ? "true" : undefined}
        aria-label={inDeck ? `${String(order + 1).padStart(2, "0")} ${name}` : t("showPane", { name })}
        title={[name, ...urls].join("\n")}
        className={`ink-swap cie-tap flex w-full flex-col gap-1 rounded-block border border-solid px-2 py-1.5 text-left ${
          focused
            ? "border-paper bg-paper text-ink"
            : inDeck
              ? "border-paper-edge bg-ink hover:border-paper"
              : "border-dashed border-paper/20 bg-ink text-ink-mute hover:border-paper/50 hover:text-paper"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className={inDeck ? "" : "opacity-60"}>
            <Favicon favicon={favicon} url={urls[0]} name={name} />
          </span>
          <span className={`register leading-none ${mute}`}>{inDeck ? String(order + 1).padStart(2, "0") : "—"}</span>
          {ai && <AiBadge t={t} status={ai.status} site={ai.site} iconOnly className="ml-auto" />}
        </span>
        <span className="weight truncate text-xs leading-tight" style={{ "--w": focused ? 600 : 500 }}>{name}</span>
        {hosts.map((host) => (
          <span key={host} className={`register truncate leading-tight ${mute}`}>{host}</span>
        ))}
      </button>
      <VisibilityButton t={t} item={item} className="absolute right-1 top-1 opacity-0 focus:opacity-100 group-hover:opacity-100" />
    </div>
  );
}

// Collapsed sidebar: one small card per window, so panes stay one click away.
function SidebarRail({ t, windows, deckOrder, focusedId, favicons, aiStatuses = {}, switcher, onAdd, onEdit, onFocus, onReveal, onToggleVisible, onExpand, expandLabel }) {
  return (
    <nav className="flex h-full w-36 flex-col gap-3 py-4 pl-3 pr-2" aria-label={t("windowsHeader")}>
      <SetSwitcher t={t} {...switcher} compact />
      <ul className="cie-stagger -mr-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        {windows.map((item) => {
          const order = deckOrder.indexOf(item.id);
          return (
            <li key={item.id} className="cie-rise">
              <RailTile
                t={t}
                item={{ ...item, onToggle: () => onToggleVisible(item.id) }}
                order={order}
                focused={item.id === focusedId && order >= 0}
                favicon={favicons[item.id]}
                ai={order >= 0 ? aiStatuses[item.id] : null}
                onClick={() => (order >= 0 ? onFocus(item.id) : onReveal(item.id))}
                onDoubleClick={() => onEdit(item)}
              />
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-center gap-2">
        <IconButton onClick={onAdd} aria-label={t("addWindow")} title={t("addWindow")}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </IconButton>
        <IconButton onClick={onExpand} aria-label={expandLabel} title={expandLabel}>
          <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>
    </nav>
  );
}

export function Sidebar({ collapsed, favicons = {}, onReveal, onExpand, expandLabel, ...props }) {
  return (
    <aside
      className={`shrink-0 overflow-hidden transition-[width] duration-move ease-expo motion-reduce:transition-none ${collapsed ? "w-36" : "w-72"}`}
      aria-label={props.t("windowsHeader")}
    >
      {collapsed ? (
        <SidebarRail {...props} favicons={favicons} onReveal={onReveal} onExpand={onExpand} expandLabel={expandLabel} />
      ) : (
        <SidebarPanel {...props} favicons={favicons} />
      )}
    </aside>
  );
}

function SidebarPanel({ t, windows, deckOrder, focusedId, favicons, aiStatuses = {}, sleeping = {}, switcher, onAdd, onEdit, onDelete, onToggleVisible, onFocus, onMove }) {
  const [dragging, setDragging] = React.useState(null);
  const [dropIndex, setDropIndex] = React.useState(null);
  const endDrag = () => {
    setDragging(null);
    setDropIndex(null);
  };
  return (
    <div className="flex h-full w-72 flex-col gap-4 py-4 pl-4 pr-3">
      <SetSwitcher t={t} {...switcher} />

      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="deck-display text-xl">{t("windowsHeader")}</h2>
          <span className="register text-ink-mute">{String(windows.length).padStart(2, "0")}</span>
        </div>
        <IconButton onClick={onAdd} aria-label={t("addWindow")} title={t("addWindow")}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>

      <p className="text-[13px] leading-5 text-ink-mute">{t("windowsHint")}</p>

      <ul className="cie-stagger -mr-1 flex flex-1 flex-col gap-2 overflow-y-auto pr-1" onDragLeave={(event) => event.currentTarget === event.target && setDropIndex(null)}>
        {windows.map((item, index) => {
          const urls = urlList(item);
          const order = deckOrder.indexOf(item.id);
          const inDeck = order >= 0;
          const focused = item.id === focusedId && inDeck;
          const name = item.name || t("untitledWindow");
          return (
            <li
              key={item.id}
              className={`cie-rise relative ${dragging === item.id ? "opacity-40" : ""}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", item.id);
                setDragging(item.id);
              }}
              onDragOver={(event) => {
                if (!dragging) return;
                event.preventDefault();
                const box = event.currentTarget.getBoundingClientRect();
                setDropIndex(event.clientY < box.top + box.height / 2 ? index : index + 1);
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragging && dropIndex != null) onMove(dragging, dropIndex);
                endDrag();
              }}
              onDragEnd={endDrag}
            >
              {dragging && dropIndex === index && <span className="absolute -top-1.5 left-0 right-0 h-0.5 rounded-pill bg-paper" aria-hidden="true" />}
              {dragging && dropIndex === index + 1 && index === windows.length - 1 && (
                <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-pill bg-paper" aria-hidden="true" />
              )}
              <div
                tabIndex={0}
                role="button"
                aria-label={`${t("editWindow")}: ${name}`}
                aria-current={focused ? "true" : undefined}
                onClick={() => inDeck && onFocus(item.id)}
                onDoubleClick={() => onEdit(item)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onEdit(item);
                  } else if (event.key === "Delete" || event.key === "Backspace") {
                    event.preventDefault();
                    onDelete(item.id);
                  } else if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
                    event.preventDefault();
                    onMove(item.id, event.key === "ArrowUp" ? index - 1 : index + 2);
                  }
                }}
                className={`ink-swap weight-hover cie-lift group flex cursor-pointer flex-col gap-2 rounded-block border p-3 ${
                  focused
                    ? "border-paper bg-paper text-ink"
                    : inDeck
                      ? "border-paper-edge bg-ink hover:border-paper"
                      : "border-paper/10 bg-ink text-ink-mute hover:border-paper/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`grid w-5 shrink-0 place-items-center ${inDeck ? "" : "opacity-60"}`}>
                    <Favicon favicon={favicons[item.id]} url={urls[0]} name={name} />
                  </span>
                  <span className="weight min-w-0 flex-1 truncate text-sm" style={{ "--w": focused ? 600 : inDeck ? 500 : 400 }}>
                    {name}
                  </span>
                  <span className={`register shrink-0 ${focused ? "text-paper-mute" : "text-ink-mute"}`}>
                    {inDeck ? String(order + 1).padStart(2, "0") : "—"}
                  </span>
                  <VisibilityButton t={t} item={{ ...item, onToggle: () => onToggleVisible(item.id) }} />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(item.id);
                    }}
                    onDoubleClick={(event) => event.stopPropagation()}
                    aria-label={t("deleteItem", { name })}
                    title={t("deleteItem", { name })}
                    className="cie-tap grid h-6 w-6 shrink-0 place-items-center rounded-pill opacity-0 transition-[opacity,background-color] duration-fast hover:bg-btn focus:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex items-start gap-2 pl-7">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    {urls.slice(0, 2).map((url, urlIndex) => (
                      <span key={urlIndex} className={`register truncate ${focused ? "text-paper-mute" : "text-ink-mute"}`}>{hostLabel(url)}</span>
                    ))}
                    {urls.length > 2 && (
                      <span className={`register ${focused ? "text-paper-mute" : "text-ink-mute"}`}>+{urls.length - 2} {t("urlsCount")}</span>
                    )}
                  </div>
                  <PaneMarks t={t} keepAwake={item.keepAwake} asleep={inDeck && sleeping[item.id]} focused={focused} />
                  {inDeck && aiStatuses[item.id] && <AiBadge t={t} status={aiStatuses[item.id].status} site={aiStatuses[item.id].site} className="shrink-0" />}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
