import React from "react";
import { Sheet } from "@desktop/components/ui/Sheet";

export function ShortcutsSheet({ t, open, onClose, isMac }) {
  const alt = (key) => (isMac ? `⌥${key}` : `Alt+${key}`);
  const primary = (key) => (isMac ? `⌘${key}` : `Ctrl+${key}`);
  const setKey = (n) => (isMac ? `⌘⌥${n}` : `Ctrl+Shift+${n}`);
  const groups = [
    {
      title: "kbGroupDeck",
      rows: [
        ["kbSpotlight", [alt("X")]],
        ["kbHome", [alt("Z")]],
        ["kbFill", [alt("Q")]],
        ["kbFocus", [alt("1"), "–", alt("8")]],
        ["kbCycle", [alt("Tab"), alt("⇧Tab")]],
        ["kbSidebar", [alt("B")]],
      ],
    },
    {
      title: "kbGroupEdit",
      rows: [
        ["kbUndo", [primary("Z")]],
        ["kbRedo", isMac ? [primary("⇧Z")] : [primary("Y"), primary("Shift+Z")]],
        ["kbSetsOpen", [alt("S")]],
        ["kbSetJump", [setKey(1), "–", setKey(9)]],
        ["kbNewWindow", [primary("N")]],
        ["kbSettings", [primary(",")]],
      ],
    },
    {
      title: "kbGroupTabs",
      rows: [
        ["kbNewTab", [primary("T")]],
        ["kbCloseTab", [primary("W")]],
        ["kbReopenTab", [primary("⇧T")]],
        ["kbNextTab", [isMac ? "⌃Tab" : "Ctrl+Tab", isMac ? "⌃⇧Tab" : "Ctrl+Shift+Tab"]],
        ["kbJumpTab", [primary("1"), "–", primary("8")]],
        ["kbLastTab", [primary("9")]],
      ],
    },
    {
      title: "kbGroupPage",
      rows: [
        ["kbAddress", [primary("L")]],
        ["kbFind", [primary("F")]],
        ["kbBackForward", [primary("["), primary("]")]],
        ["kbReload", [primary("R"), primary("⇧R")]],
        ["kbZoom", [primary("+"), primary("−"), primary("0")]],
      ],
    },
  ];
  const mouseRows = [
    ["mouseForward", isMac ? "⌥Tab" : "Alt+Tab"],
    ["mouseBack", isMac ? "⌥⇧Tab" : "Alt+Shift+Tab"],
    ["mouseGesture", `${alt("X")} / ${alt("Z")}`],
    ["mouseTop", alt("Q")],
  ];

  return (
    <Sheet open={open} onClose={onClose} title={t("shortcuts")} closeLabel={t("close")}>
      <div className="flex flex-col gap-5">
        {groups.map(({ title, rows }) => (
          <section key={title}>
            <h3 className="register mb-1 uppercase text-paper-mute">{t(title)}</h3>
            <dl className="cie-stagger flex flex-col">
              {rows.map(([label, keys]) => (
                <div key={label} className="cie-rise flex items-center justify-between gap-6 border-t border-ink/10 py-2">
                  <dt className="text-sm">{t(label)}</dt>
                  <dd className="flex shrink-0 items-center gap-1">
                    {keys.map((key, index) => (key === "–" ? <span key={index} className="text-paper-mute">–</span> : <kbd key={index} className="key">{key}</kbd>))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <section>
          <h3 className="register mb-1 uppercase text-paper-mute">{t("mouseTitle")}</h3>
          <p className="mb-2 text-xs leading-5 text-paper-mute">{t("mouseHint")}</p>
          <dl className="flex flex-col">
            {mouseRows.map(([label, keys]) => (
              <div key={label} className="flex items-center justify-between gap-6 border-t border-ink/10 py-2">
                <dt className="text-sm">{t(label)}</dt>
                <dd><kbd className="key">{keys}</kbd></dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs leading-5 text-paper-mute">{t("mouseNative")}</p>
        </section>
      </div>
    </Sheet>
  );
}
