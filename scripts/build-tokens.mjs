#!/usr/bin/env node
// build-tokens.mjs
// Liest brand/tokens.json und schreibt brand/tokens.css (CSS Custom Properties).
// Danach schreibt es denselben Inhalt als erzeugten Block in jede Komposition der Bibliothek:
//
//   <!-- brand-tokens:start (erzeugt von scripts/build-tokens.mjs, nicht von Hand aendern) -->
//   <style id="brand-tokens"> ... </style>
//   <!-- brand-tokens:end -->
//
// Warum ein Block im Dokument und kein <link> auf tokens.css: Hyperframes erkennt die
// benoetigten Schriften nur aus <style>-Bloecken im Dokument und laedt sie dann von Google Fonts.
// Ueber eine verlinkte CSS-Datei wuerden Farben funktionieren, Schriften aber still auf eine
// Systemschrift zurueckfallen (geprueft mit hyperframes 0.8.199).
//
// Aufruf:
//   node scripts/build-tokens.mjs                         Standard: brand/tokens.json -> brand/tokens.css + alle Beispiele
//   node scripts/build-tokens.mjs --tokens pfad.json      andere Token-Datei lesen
//   node scripts/build-tokens.mjs --into pfad/index.html  zusaetzlich diese Komposition aktualisieren (z. B. ein Projekt-Schnitt)
//   node scripts/build-tokens.mjs --print                 CSS nur ausgeben

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const studioRoot = resolve(here, "..");

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}
const hasFlag = (name) => process.argv.includes(name);
const rel = (p) => relative(studioRoot, p).replace(/\\/g, "/");

const SKIP_KEYS = new Set(["_hinweis", "brand", "video"]);

export function tokensToCss(tokens, sourceLabel = "brand/tokens.json") {
  const lines = [];
  const brandName = tokens.brand?.name ?? "unbenannt";
  const isDemo = tokens.brand?.is_demo ? " (Demo-Marke)" : "";
  lines.push(`/* Erzeugt von scripts/build-tokens.mjs aus ${sourceLabel}. Nicht von Hand aendern. */`);
  lines.push(`/* Marke: ${brandName}${isDemo} */`);
  lines.push(":root {");
  for (const [group, values] of Object.entries(tokens)) {
    if (SKIP_KEYS.has(group) || typeof values !== "object" || values === null) continue;
    for (const [key, raw] of Object.entries(values)) {
      if (key.startsWith("_")) continue;
      let value = raw;
      if (group === "font") value = `"${raw}", system-ui, sans-serif`;
      else if (group === "radius" || group === "space" || group === "type") {
        value = typeof raw === "number" ? `${raw}px` : raw;
        if (key.startsWith("weight")) value = String(raw);
      } else if (group === "motion") {
        if (key.startsWith("duration")) value = `${raw}s`;
        else if (key.startsWith("ease")) value = `"${raw}"`;
        else value = String(raw);
      }
      lines.push(`  --${group}-${key}: ${value};`);
    }
  }
  if (tokens.video) {
    lines.push(`  --video-width: ${tokens.video.width}px;`);
    lines.push(`  --video-height: ${tokens.video.height}px;`);
  }
  lines.push("}");
  return lines.join("\n") + "\n";
}

export function readTokens(path) {
  const tokens = JSON.parse(readFileSync(path, "utf8"));
  for (const required of ["color", "font", "radius"]) {
    if (!tokens[required]) throw new Error(`tokens.json: Gruppe "${required}" fehlt (${path})`);
  }
  for (const key of ["bg", "surface", "text", "accent"]) {
    if (!tokens.color[key]) throw new Error(`tokens.json: color.${key} fehlt (${path})`);
  }
  return tokens;
}

const START = "<!-- brand-tokens:start (erzeugt von scripts/build-tokens.mjs, nicht von Hand aendern) -->";
const END = "<!-- brand-tokens:end -->";
const BLOCK_RE = /<!-- brand-tokens:start[^>]*-->[\s\S]*?<!-- brand-tokens:end -->/;

export function tokenBlock(css, indent = "    ") {
  const body = css.trimEnd().split("\n").map((l) => indent + "  " + l).join("\n");
  return `${START}\n${indent}<style id="brand-tokens">\n${body}\n${indent}</style>\n${indent}${END}`;
}

// Setzt den Token-Block in eine Komposition. Reihenfolge: vorhandenen Block ersetzen,
// sonst einen <link> auf tokens.css ersetzen, sonst direkt nach <template> (Sub-Komposition,
// dort muss der Block stehen, weil Hyperframes nur den Inhalt des Templates uebernimmt)
// oder vor </head> einfuegen.
export function injectTokens(html, css) {
  if (BLOCK_RE.test(html)) {
    const indent = (html.match(/^([ \t]*)<!-- brand-tokens:start/m) ?? [, "    "])[1];
    return html.replace(BLOCK_RE, tokenBlock(css, indent).trimStart());
  }
  const link = /^([ \t]*)<link[^>]*href="[^"]*tokens\.css"[^>]*>\s*$/m;
  if (link.test(html)) {
    const indent = html.match(link)[1];
    return html.replace(link, indent + tokenBlock(css, indent).trimStart());
  }
  // Nur echte Tags auf eigener Zeile, damit Erwaehnungen in Kommentaren nicht treffen.
  const template = /^([ \t]*)<template>[ \t]*$/m;
  if (template.test(html)) {
    const indent = html.match(template)[1] + "  ";
    return html.replace(template, (line) => `${line}\n${indent}${tokenBlock(css, indent).trimStart()}`);
  }
  const head = /^([ \t]*)<\/head>[ \t]*$/m;
  if (head.test(html)) {
    const outer = html.match(head)[1];
    const indent = outer + "  ";
    return html.replace(head, `${indent}${tokenBlock(css, indent).trimStart()}\n${outer}</head>`);
  }
  throw new Error("Weder </head> noch <template> auf eigener Zeile gefunden, Token-Block nicht eingefuegt.");
}

// Alle Kompositionen der Bibliothek (index.html in library/<id>/ und library/<id>/<unterordner>/).
export function libraryCompositions() {
  const lib = join(studioRoot, "library");
  if (!existsSync(lib)) return [];
  const found = [];
  const walk = (dir, depth) => {
    if (existsSync(join(dir, "index.html"))) found.push(join(dir, "index.html"));
    if (depth === 0) return;
    for (const name of readdirSync(dir)) {
      if (name.startsWith(".") || ["assets", "previews", "renders"].includes(name)) continue;
      const sub = join(dir, name);
      if (statSync(sub).isDirectory()) walk(sub, depth - 1);
    }
  };
  for (const name of readdirSync(lib)) {
    const dir = join(lib, name);
    if (statSync(dir).isDirectory()) walk(dir, 1);
  }
  return found;
}

export function writeTokensInto(files, css) {
  const changed = [];
  for (const file of files) {
    const before = readFileSync(file, "utf8");
    const after = injectTokens(before, css);
    if (after !== before) {
      writeFileSync(file, after, "utf8");
      changed.push(file);
    }
  }
  return changed;
}

function main() {
  const tokensPath = resolve(studioRoot, arg("--tokens", "brand/tokens.json"));
  const tokens = readTokens(tokensPath);
  const css = tokensToCss(tokens, rel(tokensPath));

  if (hasFlag("--print")) {
    process.stdout.write(css);
    return;
  }
  writeFileSync(join(studioRoot, "brand", "tokens.css"), css, "utf8");
  console.log(`brand/tokens.css geschrieben (Marke: ${tokens.brand?.name ?? "unbenannt"})`);

  const files = libraryCompositions();
  const into = arg("--into");
  if (into) files.push(resolve(process.cwd(), into));
  const changed = writeTokensInto(files, css);
  for (const f of files) console.log(`  ${changed.includes(f) ? "aktualisiert" : "unveraendert"}: ${rel(f)}`);
  if (files.length === 0) console.log("  (keine Kompositionen gefunden)");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
