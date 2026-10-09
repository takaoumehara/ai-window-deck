#!/usr/bin/env node
// Builds AI Window Deck 1.11.1 from the unpacked 1.11.0 store package, which has no source
// in this repo: the bulk import dialog highlights the lines it can't read, lists them with
// "Line N" jump links and one-click fixes, and the parser no longer merges a window into the
// one above when the blank line between them is missing.
//
//   node tools/patch-v1.11-bulk-import.mjs <unpacked-1.11.0-dir> <output-dir>
//
// Every edit is an exact string replacement that must match exactly once, so running it on
// any other build fails loudly instead of producing a half-patched bundle.

import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = join(dirname(fileURLToPath(import.meta.url)), "v1.11.1");
const [src, out] = process.argv.slice(2);
if (!src || !out) {
  console.error("usage: node tools/patch-v1.11-bulk-import.mjs <unpacked-1.11.0-dir> <output-dir>");
  process.exit(2);
}

const FROM_VERSION = "1.11.0";
const TO_VERSION = "1.11.1";
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

if (existsSync(out)) rmSync(out, { recursive: true });
cpSync(src, out, { recursive: true });

// manifest.json: only the version changes, keeping the file's formatting.
const manifestPath = join(out, "manifest.json");
const manifest = readFileSync(manifestPath, "utf8");
writeFileSync(manifestPath, replaceOnce(manifest, `"version": "${FROM_VERSION}"`, `"version": "${TO_VERSION}"`, "manifest version"));

const jsPath = assetPath(out, ".js");
let js = readFileSync(jsPath, "utf8");

// The tests run the new parser against these helpers, so they must be the shipped ones.
const helpers = read("url-helpers.js").trimEnd();
replaceOnce(js, helpers, helpers, "URL helpers (dm/Jn/fm/Wo/pm) unchanged");

// 1. Parser.
const OLD_PARSER =
  'function Rd(s,l){const u=[],c=[];let p="",f=[];const h=()=>{(p||f.length)&&u.push({name:p||l(u.length+1),urls:f.join(`\n`)}),p="",f=[]};return String(s).split(`\n`).forEach((m,y)=>{const g=m.trim();if(!g)h();else if(pm(g)){const S=Wo(g);S.ok?f.push(S.url):c.push({index:y,input:m,reason:S.reason})}else p=g}),h(),{items:u,errors:c}}';
js = replaceOnce(js, OLD_PARSER, `${read("bulk-parser.js").trim()}\n`, "bulk parser Rd");

// 2. Register dialog (hm): state, highlighted editor, issue list, save guard.
js = replaceOnce(js, "Pe=P.useRef(null),Se=b.map(Wo)", "Pe=P.useRef(null),bulkEdRef=P.useRef(null),Se=b.map(Wo)", "dialog backdrop ref");
js = replaceOnce(
  js,
  "se=Q&&Re.errors.length>0,",
  "se=Q&&Re.issues.length>0,bulkEdBad=new Set(se?Re.issues.map(T=>T.line):[]),bulkEdFixN=Re.issues.filter(bulkEdCanFix).length,",
  "dialog issue state",
);

const PLACEHOLDER = "placeholder:`Research\nhttps://example.com/docs\n\nChat AI\nhttps://claude.ai`";
const OLD_EDITOR =
  'a.jsx("textarea",{ref:Pe,"aria-invalid":se?"true":void 0,"aria-describedby":se?`${g}-bulk-error`:void 0,rows:8,"aria-labelledby":`${g}-bulk`,value:B,onChange:T=>R(T.target.value),' +
  PLACEHOLDER +
  ',className:"w-full rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-100 font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-2 focus-visible:ring-offset-2"}),se&&a.jsx("p",{id:`${g}-bulk-error`,role:"alert","data-testid":"url-error",className:"text-xs",children:y("urlBulkInvalid",{lines:Re.errors.map(({index:T})=>T+1).join(", ")})}),';
const NEW_EDITOR =
  'a.jsxs("div",{"data-testid":"bulk-editor",className:`relative rounded-md border border-zinc-800 bg-zinc-900 bulk-editor${se?" bulk-editor-invalid":""}`,children:[' +
  'a.jsx("div",{ref:bulkEdRef,"aria-hidden":"true",className:"bulk-editor-text bulk-editor-backdrop",children:B.split(`\n`).map((T,A)=>a.jsx("span",{className:bulkEdBad.has(A+1)?"bulk-line bulk-line-bad":"bulk-line","data-line":A+1,children:T||" "},A))}),' +
  'a.jsx("textarea",{ref:Pe,"aria-invalid":se?"true":void 0,"aria-describedby":se?`${g}-bulk-error`:void 0,"aria-labelledby":`${g}-bulk`,spellCheck:!1,autoCapitalize:"off",value:B,onChange:T=>R(T.target.value),onScroll:T=>{bulkEdRef.current&&(bulkEdRef.current.scrollTop=T.currentTarget.scrollTop)},' +
  PLACEHOLDER +
  ',className:"bulk-editor-text bulk-editor-input"})]}),' +
  'se&&a.jsxs("div",{id:`${g}-bulk-error`,role:"alert","data-testid":"url-error",className:"bulk-issues",children:[' +
  'a.jsxs("div",{className:"bulk-issues-head",children:[a.jsx("p",{className:"bulk-issues-title",children:y("bulkIssuesTitle",{count:Re.issues.length})}),' +
  'bulkEdFixN>1&&a.jsx(Ge,{type:"button",variant:"outline",size:"sm","data-testid":"bulk-fix-all",onClick:()=>R(bulkEdFixAll(B)),className:"h-7 text-xs shrink-0",children:y("bulkFixAllBtn")})]}),' +
  'a.jsx("ul",{className:"bulk-issues-list",children:Re.issues.map(T=>a.jsxs("li",{className:"bulk-issue","data-testid":"bulk-issue",children:[' +
  'a.jsx("button",{type:"button",className:"bulk-issue-line",onClick:()=>bulkEdJump(Pe.current,bulkEdRef.current,B,T.line),"aria-label":y("bulkJumpLabel",{n:T.line}),children:y("bulkLineLabel",{n:T.line})}),' +
  'a.jsxs("span",{className:"bulk-issue-text",children:[y(bulkEdMsg[T.kind],{text:T.text}),T.kind==="badUrl"&&a.jsx("span",{className:"quiet",children:y(T.reason==="tilde"?"urlTildeHint":"urlInvalidHint")})]}),' +
  'bulkEdCanFix(T)&&a.jsx(Ge,{type:"button",variant:"outline",size:"sm","data-testid":"bulk-fix",onClick:()=>R(bulkEdFix(B,T)),className:"h-7 text-xs shrink-0",children:y("bulkFixBtn")})' +
  ']},`${T.line}-${T.kind}`))})]}),';
js = replaceOnce(js, OLD_EDITOR, NEW_EDITOR, "bulk editor markup");

js = replaceOnce(
  js,
  "if(ue(!0),Re.errors.length){(T=Pe.current)==null||T.focus();return}f(B)!==!1&&u()",
  "if(ue(!0),Re.issues.length){bulkEdJump(Pe.current,bulkEdRef.current,B,Re.issues[0].line);return}f(B)!==!1&&u()",
  "bulk save guard",
);

// 3. App bulk save (also used by .txt import): name the first unreadable URL in the toast.
js = replaceOnce(
  js,
  're(T("urlBulkInvalid",{lines:H.errors.map(({index:G})=>G+1).join(", ")})),!1',
  're(`${T("urlBulkInvalid",{lines:H.errors.map(({index:G})=>G+1).join(", ")})} — ${T("bulkIssueBadUrl",{text:H.errors[0].input.trim()})}`),!1',
  "bulk save toast",
);

// 4. Strings: added after urlBulkInvalid in each locale table.
const strings = JSON.parse(read("strings.json"));
const LOCALE_KEYS = { ja: "ja", en: "en", "zh-CN": '"zh-CN"', ko: "ko", es: "es", fr: "fr", de: "de", "pt-BR": '"pt-BR"' };
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
  const table = js.slice(at, end);
  const match = table.match(/urlBulkInvalid:("(?:[^"\\]|\\.)*"|`[^`]*`|'(?:[^'\\]|\\.)*')/g);
  if (!match || match.length !== 1) throw new Error(`locale ${locale}: expected one urlBulkInvalid entry`);
  if (!strings[locale]) throw new Error(`strings.json has no ${locale}`);
  const added = Object.entries(strings[locale]).map(([k, v]) => `${k}:${JSON.stringify(v)}`).join(",");
  js = js.slice(0, at) + replaceOnce(table, match[0], `${match[0]},${added}`, `strings ${locale}`) + js.slice(end);
}

writeFileSync(jsPath, js);

const cssPath = assetPath(out, ".css");
const css = readFileSync(cssPath, "utf8");
if (css.includes(".bulk-editor")) throw new Error("CSS already patched");
writeFileSync(cssPath, `${css.trimEnd()}\n${read("bulk-editor.css")}`);

console.log(`patched ${FROM_VERSION} -> ${TO_VERSION} into ${out}`);
