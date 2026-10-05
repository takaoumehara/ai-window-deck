// Validate a store archive before upload.
//   node tools/validate-package.mjs AI-Window-Deck-v1.7.0.zip
//
// Checks: manifest parses; every file it references exists; every __MSG_key__
// it uses exists in every locale; name <= 75 and description <= 132 characters
// in every locale; HTML entry points only load local scripts; nothing that
// should not ship (source maps, tests, docs, node_modules) is inside.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const zip = resolve(process.argv[2] ?? "");
if (!existsSync(zip)) throw new Error(`usage: node tools/validate-package.mjs <zip>  (not found: ${zip})`);

const dir = mkdtempSync(join(tmpdir(), "awd-validate-"));
const problems = [];
try {
  execFileSync("unzip", ["-q", zip, "-d", dir]);
  const files = walk(dir).map((f) => f.slice(dir.length + 1));
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));

  const referenced = [
    manifest.background?.service_worker,
    manifest.action?.default_popup,
    manifest.options_ui?.page,
    ...Object.values(manifest.icons ?? {}),
    ...Object.values(manifest.action?.default_icon ?? {}),
  ].filter(Boolean);
  for (const file of referenced) if (!existsSync(join(dir, file))) problems.push(`missing referenced file ${file}`);

  // Scripts and styles referenced by shipped HTML must be local files.
  for (const html of files.filter((f) => f.endsWith(".html"))) {
    const source = readFileSync(join(dir, html), "utf8");
    for (const [, ref] of source.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(https?:)?\/\//.test(ref)) problems.push(`${html} loads remote resource ${ref}`);
      else if (!existsSync(join(dir, html, "..", ref))) problems.push(`${html} references missing ${ref}`);
    }
  }
  for (const js of files.filter((f) => f.endsWith(".js"))) {
    const source = readFileSync(join(dir, js), "utf8");
    if (/\beval\s*\(|new Function\s*\(/.test(source)) problems.push(`${js} uses eval/new Function`);
    if (/import\s*\(\s*["']https?:/.test(source)) problems.push(`${js} imports remote code`);
  }

  const keys = [...JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)].map((m) => m[1]);
  const locales = readdirSync(join(dir, "_locales"));
  if (!locales.includes(manifest.default_locale)) problems.push(`default_locale ${manifest.default_locale} missing`);
  for (const locale of locales) {
    const messages = JSON.parse(readFileSync(join(dir, "_locales", locale, "messages.json"), "utf8"));
    for (const key of new Set(keys)) if (!messages[key]?.message) problems.push(`${locale}: missing message ${key}`);
    const resolveMsg = (value) => value.replace(/__MSG_(\w+)__/g, (_, k) => messages[k]?.message ?? "");
    const name = resolveMsg(manifest.name);
    const description = resolveMsg(manifest.description);
    if ([...name].length > 75) problems.push(`${locale}: name ${[...name].length} > 75`);
    if ([...description].length > 132) problems.push(`${locale}: description ${[...description].length} > 132`);
    console.log(`  ${locale.padEnd(6)} name ${String([...name].length).padStart(2)}  description ${String([...description].length).padStart(3)}/132`);
  }

  for (const file of files) {
    if (/\.map$|(^|\/)(test|tests|docs|node_modules|src)\/|\.md$|\.DS_Store$/.test(file)) problems.push(`should not ship: ${file}`);
  }
  console.log(`  ${files.length} files, manifest v${manifest.version}, permissions: ${manifest.permissions.join(", ")}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (problems.length) {
  console.error("Package validation FAILED:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log("Package validation passed.");

function walk(path) {
  return statSync(path).isDirectory() ? readdirSync(path).flatMap((name) => walk(join(path, name))) : [path];
}
