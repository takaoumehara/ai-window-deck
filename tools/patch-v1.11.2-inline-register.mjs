#!/usr/bin/env node
// Builds AI Window Deck 1.11.2 from the unpacked 1.11.0 store package: first the 1.11.1
// bulk import patch, then "Register URLs + Window" opens inside the page instead of a modal
// dialog. The page view starts with a choice between one-by-one and bulk (with an animation
// of pasting a list of sites), and the placement choice after a bulk save is inline too.
// The small dock window (?mode=dock) keeps the dialogs. The More view gets a Ko-fi link.
//
//   node tools/patch-v1.11.2-inline-register.mjs <unpacked-1.11.0-dir> <output-dir>
//
// Every edit is an exact string replacement that must match exactly once.

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const tools = dirname(fileURLToPath(import.meta.url));
const here = join(tools, "v1.11.2");
const [src, out] = process.argv.slice(2);
if (!src || !out) {
  console.error("usage: node tools/patch-v1.11.2-inline-register.mjs <unpacked-1.11.0-dir> <output-dir>");
  process.exit(2);
}
execFileSync(process.execPath, [join(tools, "patch-v1.11-bulk-import.mjs"), src, out], { stdio: "inherit" });

const FROM_VERSION = "1.11.1";
const TO_VERSION = "1.11.2";
const read = (name) => readFileSync(join(here, name), "utf8");

function replaceOnce(text, find, replacement, label) {
  const count = text.split(find).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly 1 match, found ${count}`);
  return text.replace(find, () => replacement);
}

function assetPath(dir, ext) {
  const assets = join(dir, "dist", "assets");
  const files = readdirSync(assets).filter((f) => f.startsWith("app-") && f.endsWith(ext));
  if (files.length !== 1) throw new Error(`expected one dist/assets/app-*${ext}, found ${files.length}`);
  return join(assets, files[0]);
}

const manifestPath = join(out, "manifest.json");
writeFileSync(
  manifestPath,
  replaceOnce(readFileSync(manifestPath, "utf8"), `"version": "${FROM_VERSION}"`, `"version": "${TO_VERSION}"`, "manifest version"),
);

const jsPath = assetPath(out, ".js");
let js = readFileSync(jsPath, "utf8");
if (js.includes("regInPanel")) throw new Error("bundle already has the inline register view");

// 1. Register form (hm): accepts `inline`, starts on the choice, renders in a page panel.
const HM_SIGNATURE = "function hm({lang:s,open:l,onClose:u,editingItem:c,onSaveWindow:p,onBulkSave:f,onImportFile:h,onExportFile:m}){";
js = replaceOnce(
  js,
  HM_SIGNATURE,
  `${read("inline-register.js").trim()}\n${HM_SIGNATURE.replace("onExportFile:m}", "onExportFile:m,inline:regInl=!1}")}`,
  "register form signature",
);
js = replaceOnce(js, 'L([]),ue(!1),U("single"),c){', "L([]),ue(!1),U(regInMode(c,regInl)),c){", "register form initial mode");

const TITLE = 'y(c?"regTitleEdit":O==="bulk"?"regTitleBulk":"regTitleAdd")';
js = replaceOnce(
  js,
  `return a.jsxs(Td,{open:l,onClose:u,children:[a.jsxs(Md,{children:[a.jsx(fl,{className:"text-base font-bold text-zinc-100",children:${TITLE}}),a.jsx(lm,{onClick:u,label:y("closeDialog")})]}),`,
  `return a.jsxs(regInl?regInPanel:Td,{open:l,onClose:u,focusKey:O,onEscape:()=>regInEscape(c,regInl,O)==="choose"?U("choose"):u(),children:[` +
    `regInl?a.jsx(regInHead,{title:${TITLE},hint:O==="choose"?y("regChooseHint"):null,onBack:regInEscape(c,regInl,O)==="choose"?()=>U("choose"):null,backLabel:y("flowBack"),onClose:u,closeLabel:y("obClose")}):` +
    `a.jsxs(Md,{children:[a.jsx(fl,{className:"text-base font-bold text-zinc-100",children:${TITLE}}),a.jsx(lm,{onClick:u,label:y("closeDialog")})]}),`,
  "register form frame",
);
js = replaceOnce(
  js,
  'O==="single"?a.jsxs("div",{className:"flex flex-col gap-4",children:[a.jsxs("div",{className:"flex flex-col gap-1.5"',
  'O==="choose"?a.jsx(regInChoose,{lang:s,onPick:U}):O==="single"?regInWrap(regInl,s,"single",a.jsxs("div",{className:"flex flex-col gap-4",children:[a.jsxs("div",{className:"flex flex-col gap-1.5"',
  "register form: single start",
);
js = replaceOnce(
  js,
  'children:y("saveBtn")})]})]})]}):a.jsxs("div",{className:"flex flex-col gap-4",children:[a.jsx("p",{id:`${g}-bulk`',
  'children:y("saveBtn")})]})]})]})):regInWrap(regInl,s,"bulk",a.jsxs("div",{className:"flex flex-col gap-4",children:[a.jsx("p",{id:`${g}-bulk`',
  "register form: single end / bulk start",
);
js = replaceOnce(
  js,
  'children:y("bulkSaveBtn")})]})]})]})]})}function mm(',
  'children:y("bulkSaveBtn")})]})]})]}))]})}function mm(',
  "register form: bulk end",
);

// 2. Placement choice after a bulk save (mm): same panel when inline.
js = replaceOnce(
  js,
  "function mm({lang:s,count:l,open:u,onAutoPlace:c,onLibraryOnly:p,onClose:f}){const h=m=>ze(s,m);return a.jsxs(Td,{open:u,onClose:f,children:[",
  'function mm({lang:s,count:l,open:u,onAutoPlace:c,onLibraryOnly:p,onClose:f,inline:regInl=!1}){const h=m=>ze(s,m);return a.jsxs(regInl?regInPanel:Td,{open:u,onClose:f,testId:"placement-panel",children:[',
  "placement choice frame",
);

// 3. App: in the page, the panels replace the current view, which stays mounted (hidden)
// so its state and the button that opened the panel survive. Dock mode keeps the dialogs.
const PLACEMENT_PROPS = 'lang:$,count:De.length,onAutoPlace:()=>xt("auto"),onLibraryOnly:()=>xt("manual"),onClose:()=>Ne([])';
const FORM_PROPS = "lang:$,onClose:()=>Pe(!1),editingItem:Se,onSaveWindow:st,onBulkSave:He,onExportFile:ht,onImportFile:oe";
js = replaceOnce(
  js,
  'a.jsxs("main",{id:"workspace-main","data-testid":"workspace-main",tabIndex:"-1",className:"min-w-0",children:[S==="onboarding"&&!w&&',
  'a.jsxs("main",{id:"workspace-main","data-testid":"workspace-main",tabIndex:"-1",className:"min-w-0",children:[' +
    `!w&&(De.length>0?a.jsx(mm,{${PLACEMENT_PROPS},open:!0,inline:!0}):he&&a.jsx(hm,{${FORM_PROPS},open:!0,inline:!0})),` +
    'a.jsxs("div",{hidden:!w&&(he||De.length>0),children:[S==="onboarding"&&!w&&',
  "main view host",
);
js = replaceOnce(
  js,
  'onOpenDock:()=>En("dock")})]})]}),a.jsx("div",{"aria-live"',
  'onOpenDock:()=>En("dock")})]})]})]}),a.jsx("div",{"aria-live"',
  "main view host end",
);
js = replaceOnce(
  js,
  "a.jsx(hm,{lang:$,open:he,onClose:()=>Pe(!1),editingItem:Se,",
  "a.jsx(hm,{lang:$,open:he&&w,onClose:()=>Pe(!1),editingItem:Se,",
  "register dialog only in dock mode",
);
js = replaceOnce(
  js,
  "a.jsx(mm,{lang:$,count:De.length,open:De.length>0,",
  "a.jsx(mm,{lang:$,count:De.length,open:De.length>0&&w,",
  "placement dialog only in dock mode",
);

// 4. More view ends with a Ko-fi link.
const KOFI_URL = "https://ko-fi.com/G2G71VP1DF";
js = replaceOnce(
  js,
  "a.jsx(Hg,{lang:s,onFactoryReset:f})]})}",
  'a.jsx(Hg,{lang:s,onFactoryReset:f}),a.jsxs("p",{className:"more-support quiet","data-testid":"more-support",children:[a.jsx("span",{children:m("moreSupportText")}),' +
    `a.jsx("a",{href:${JSON.stringify(KOFI_URL)},target:"_blank",rel:"noopener noreferrer",children:m("moreSupportLink")})]})]})}`,
  "more view support link",
);

// 5. Strings: existing keys (the renamed button) are replaced, new ones added after it.
const strings = JSON.parse(read("strings.json"));
const LOCALE_KEYS = { ja: "ja", en: "en", "zh-CN": '"zh-CN"', ko: "ko", es: "es", fr: "fr", de: "de", "pt-BR": '"pt-BR"' };
const VALUE = String.raw`("(?:[^"\\]|\\.)*"|` + "`[^`]*`|" + String.raw`'(?:[^'\\]|\\.)*')`;
const starts = Object.entries(LOCALE_KEYS)
  .map(([locale, key]) => {
    const find = `${key}:{appTitle:`;
    if (js.split(find).length - 1 !== 1) throw new Error(`locale table ${locale}: expected exactly 1 match`);
    return { locale, at: js.indexOf(find) };
  })
  .sort((a, b) => a.at - b.at);
for (let i = starts.length - 1; i >= 0; i--) {
  const { locale, at } = starts[i];
  const end = i + 1 < starts.length ? starts[i + 1].at : js.indexOf("},Xc=Ch", at);
  if (end < 0) throw new Error("end of locale tables not found");
  if (!strings[locale]) throw new Error(`strings.json has no ${locale}`);
  let table = js.slice(at, end);
  const added = [];
  for (const [key, value] of Object.entries(strings[locale])) {
    const entries = table.match(new RegExp(`(?<=[,{])${key}:${VALUE}`, "g")) || [];
    if (entries.length > 1) throw new Error(`locale ${locale}: ${key} appears ${entries.length} times`);
    if (entries.length) table = replaceOnce(table, entries[0], `${key}:${JSON.stringify(value)}`, `strings ${locale} ${key}`);
    else added.push(`${key}:${JSON.stringify(value)}`);
  }
  const anchor = table.match(new RegExp(`(?<=[,{])regTitleAdd:${VALUE}`, "g"));
  if (!anchor || anchor.length !== 1) throw new Error(`locale ${locale}: expected one regTitleAdd entry`);
  if (added.length) table = replaceOnce(table, anchor[0], `${anchor[0]},${added.join(",")}`, `strings ${locale} new keys`);
  js = js.slice(0, at) + table + js.slice(end);
}

writeFileSync(jsPath, js);

const cssPath = assetPath(out, ".css");
const css = readFileSync(cssPath, "utf8");
writeFileSync(cssPath, `${css.trimEnd()}\n${read("inline-register.css")}`);

console.log(`patched ${FROM_VERSION} -> ${TO_VERSION} into ${out}`);
