// Inline "Register URLs + Window" view for the 1.11.x bundle, inserted just before the
// register dialog component `hm`. It runs in the bundle's module scope and uses its
// helpers: `a` (JSX runtime), `P` (React), `Pd` (dialog title id context), `ze` (strings),
// `Km` (reduced motion), `$d` (animated keycaps), `Zs` (is Mac) and the icons `cl` (X),
// `eh` (ArrowLeft), `yd` (Pause), `wd` (Play), `Vr` (Plus).

// A new window starts at the choice between one-by-one and bulk; editing goes straight to
// the form. The dialog (dock mode) keeps opening on the form as before.
function regInMode(editing, inline) {
  return inline && !editing ? "choose" : "single";
}
// Esc steps back to the choice first, then closes, so a pasted list is never lost to one key.
function regInEscape(editing, inline, mode) {
  return inline && !editing && mode !== "choose" ? "choose" : "close";
}

function regInPanel({ open, onClose, onEscape, focusKey, testId = "register-panel", children }) {
  const ref = P.useRef(null), id = P.useId(), esc = P.useRef(onEscape || onClose);
  esc.current = onEscape || onClose;
  P.useEffect(() => {
    const opener = document.activeElement;
    const onKey = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      e.preventDefault();
      esc.current && esc.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener instanceof HTMLElement && opener.isConnected && opener.offsetParent !== null) opener.focus();
      else { const main = document.getElementById("workspace-main"); main && main.focus(); }
    };
  }, []);
  P.useEffect(() => {
    const h = ref.current && ref.current.querySelector("h2");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
  }, [focusKey]);
  return open
    ? a.jsx(Pd.Provider, { value: id, children: a.jsx("section", { ref, className: "deck-panel register-panel", "aria-labelledby": id, "data-testid": testId, children }) })
    : null;
}

function regInHead({ title, hint, onBack, backLabel, onClose, closeLabel }) {
  const id = P.useContext(Pd);
  return a.jsxs("div", { className: "onboarding-heading register-heading", children: [
    a.jsxs("div", { children: [a.jsx("h2", { id, tabIndex: -1, children: title }), hint && a.jsx("p", { className: "quiet", children: hint })] }),
    a.jsxs("div", { className: "register-heading-actions", children: [
      onBack && a.jsxs("button", { type: "button", className: "deck-button", "data-testid": "register-back", onClick: onBack, children: [a.jsx(eh, { size: 14, "aria-hidden": "true" }), backLabel] }),
      a.jsxs("button", { type: "button", className: "deck-button", "data-testid": "register-close", onClick: onClose, children: [a.jsx(cl, { size: 14, "aria-hidden": "true" }), closeLabel] }),
    ] }),
  ] });
}

function regInWrap(inline, lang, kind, node) {
  if (!inline) return node;
  return kind === "bulk"
    ? a.jsxs("div", { className: "register-bulk", children: [node, a.jsx("div", { className: "register-bulk-figure", children: a.jsx(regInAnim, { lang }) })] })
    : a.jsx("div", { className: "register-single", children: node });
}

function regInChoose({ lang, onPick }) {
  const t = (k, v) => ze(lang, k, v), id = P.useId();
  const card = (n, mode, title, desc, figure) => a.jsxs("div", { className: "register-choice", "data-mode": mode, children: [
    a.jsxs("h3", { className: "register-choice-head", children: [
      a.jsx("span", { className: "step-index", "aria-hidden": "true", children: n }),
      a.jsx("button", { type: "button", className: "register-choice-btn", "data-testid": `register-choose-${mode}`, "aria-describedby": `${id}-${mode}`, onClick: () => onPick(mode), children: title }),
    ] }),
    a.jsx("p", { id: `${id}-${mode}`, className: "register-choice-desc quiet", children: desc }),
    a.jsx("div", { className: "register-choice-figure", children: figure }),
    a.jsxs("span", { className: "deck-button primary register-choice-cta", "aria-hidden": "true", children: [title, " \u2192"] }),
  ] });
  return a.jsxs("div", { className: "register-choices", children: [
    card("01", "single", t("regOneTitle"), t("regOneDesc"), a.jsx(regInSketch, { lang })),
    card("02", "bulk", t("regBulkTitle"), t("regBulkDesc"), a.jsx(regInAnim, { lang, compact: true })),
  ] });
}

function regInSketch() {
  const row = (text, cls = "") => a.jsx("span", { className: `register-sketch-row ${cls}`, children: text });
  return a.jsxs("div", { className: "register-sketch", "aria-hidden": "true", children: [
    row("Research", "is-name"),
    row("https://docs.example.com"),
    row("https://claude.ai"),
    a.jsxs("span", { className: "register-sketch-row is-add", children: [a.jsx(Vr, { size: 12 }), "URL"] }),
  ] });
}

const regInLines = ["Research", "docs.example.com", "", "Chat AI", "claude.ai", "", "Design", "figma.com"];
const regInTiles = [["Research", 0, 0, 50, 100], ["Chat AI", 50, 0, 50, 50], ["Design", 50, 50, 50, 50]];
const regInDur = [2000, 1700, 1900, 3200];

function regInText({ lines, intro }) {
  return a.jsxs("span", { className: "register-lines", children: [
    intro && a.jsx("span", { className: "register-line is-intro", children: intro }),
    lines.map((l, i) => a.jsx("span", { className: `register-line${l && !l.includes(".") ? " is-name" : ""}`, children: l || " " }, i)),
  ] });
}

function regInStage({ lang, phase }) {
  const t = (k, v) => ze(lang, k, v);
  return a.jsxs("div", { className: "register-stage", "data-reg-phase": phase, "aria-hidden": "true", children: [
    a.jsxs("div", { className: "register-msg", children: [a.jsx("span", { className: "register-msg-label", children: t("regAnimChat") }), a.jsx(regInText, { lines: regInLines, intro: t("regAnimIntro") })] }),
    a.jsx("span", { className: "register-stage-arrow", children: "\u2192" }),
    a.jsxs("div", { className: "register-box", children: [a.jsx("span", { className: "register-box-caret" }), a.jsx(regInText, { lines: regInLines })] }),
    a.jsx("div", { className: "register-tiles", children: regInTiles.map(([name, left, top, width, height], i) => a.jsx("div", {
      className: "diagram-tile register-tile",
      style: { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, transitionDelay: `${i * 140}ms` },
      children: a.jsxs("div", { className: "diagram-tile-inner", children: [a.jsx("span", { className: "diagram-bar" }), a.jsx("span", { className: "register-tile-name", children: name }), a.jsx("span", { className: "diagram-num", children: String(i + 1).padStart(2, "0") })] }),
    }, name)) }),
  ] });
}

function regInKeys(lang, phase) {
  const t = (k) => ze(lang, k), mod = Zs ? "\u2318" : "Ctrl";
  if (phase === 1) return { keys: [mod, "C"], caption: t("regAnimKeyCopy") };
  if (phase === 2) return { keys: [mod, "V"], caption: t("regAnimKeyPaste") };
  if (phase === 3) return { keys: [t("bulkSaveBtn")], caption: t("regAnimKeySave") };
  return null;
}

function regInAnim({ lang, compact = false }) {
  const t = (k, v) => ze(lang, k, v);
  const q = typeof window < "u" ? new URLSearchParams(window.location.search).get("regPhase") : null;
  const frozen = /^[0-3]$/.test(q ?? "") ? Number(q) : null;
  const [step, setStep] = P.useState(0), [reduced, setReduced] = P.useState(Km), [paused, setPaused] = P.useState(false);
  P.useEffect(() => {
    const m = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!m) return;
    const on = () => setReduced(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  P.useEffect(() => {
    if (reduced || paused || frozen !== null) return;
    const id = setTimeout(() => setStep((s) => (s + 1) % 4), regInDur[step]);
    return () => clearTimeout(id);
  }, [step, reduced, paused, frozen]);
  const cls = `onboarding-animated register-anim${compact ? " is-compact" : ""}`;
  if (reduced) {
    const keys = (p) => regInKeys(lang, p).keys.join(Zs ? "" : "+");
    return a.jsxs("div", { className: `${cls} is-static`, "data-testid": "register-anim", role: "img", "aria-label": t("regAnimLabel"), children: [
      a.jsxs("div", { className: "register-static", "aria-hidden": "true", children: [
        a.jsxs("figure", { children: [a.jsx("figcaption", { children: t("regAnimPhase0") }), a.jsxs("div", { className: "register-msg", children: [a.jsx("span", { className: "register-msg-label", children: t("regAnimChat") }), a.jsx(regInText, { lines: regInLines, intro: t("regAnimIntro") })] })] }),
        a.jsxs("div", { className: "diagram-arrow", children: [a.jsx("span", { children: "\u2192" }), a.jsx("kbd", { className: "key-cap", children: keys(1) }), a.jsx("kbd", { className: "key-cap", children: keys(2) })] }),
        a.jsxs("figure", { children: [a.jsx("figcaption", { children: t("regAnimPhase3") }), a.jsx(regInStage, { lang, phase: 3 })] }),
      ] }),
    ] });
  }
  const phase = frozen ?? step, k = regInKeys(lang, phase);
  return a.jsxs("div", { className: cls, "data-testid": "register-anim", "data-phase": phase, "data-paused": paused ? "true" : void 0, children: [
    a.jsxs("div", { className: "stage-head", children: [
      a.jsx("p", { className: "diagram-phase", children: t(`regAnimPhase${phase}`) }),
      a.jsxs("button", { type: "button", className: "deck-button stage-pause", "data-testid": "register-anim-pause", "aria-pressed": paused, "aria-label": t("regAnimPauseLabel"), onClick: () => setPaused((p) => !p), children: [a.jsx(paused ? wd : yd, { size: 13, "aria-hidden": "true" }), t("obPause")] }),
    ] }),
    a.jsx("div", { role: "img", "aria-label": t("regAnimLabel"), children: a.jsx(regInStage, { lang, phase }) }),
    a.jsx("div", { className: "stage-key-row", children: k && a.jsx($d, { keys: k.keys, caption: k.caption, frozen: paused || frozen !== null, macStyle: Zs && phase < 3 }, phase) }),
  ] });
}
