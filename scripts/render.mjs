#!/usr/bin/env node
// render.mjs
// Duenner Wrapper um die Hyperframes-CLI mit fester Ausgabepfad-Konvention.
//
// Aufruf:
//   node scripts/render.mjs lower-third                       rendert library/lower-third -> library/lower-third/previews/lower-third.mp4
//   node scripts/render.mjs library/point-graphic             dasselbe mit Pfad
//   node scripts/render.mjs projects/first-video/edit         rendert einen Projekt-Schnitt -> projects/first-video/exports/edit.mp4
//   node scripts/render.mjs lower-third --vars '{"name":"Lena Berg"}'
//   node scripts/render.mjs lower-third --vars-file meine-werte.json
//   node scripts/render.mjs lower-third --tokens brand/examples/tokens-alt-demo.json --output library/lower-third/previews/alt.mp4
//   node scripts/render.mjs lower-third --quality draft|looks|delivery   (Standard: looks)
//   node scripts/render.mjs lower-third --png 4.0              zusaetzlich Einzelbild bei Sekunde 4 als PNG neben dem MP4
//   node scripts/render.mjs lower-third --format webm          transparentes WebM (fuer Overlays)
//
// Marken-Tokens: Der Wrapper rendert immer mit den aktuellen Tokens aus brand/tokens.json
// (oder der Datei hinter --tokens). Dafuer schreibt er eine temporaere Render-Kopie
// (.render-index.html) neben die Komposition, setzt dort den Token-Block ein, rendert sie mit
// --composition und loescht sie danach. index.html selbst wird dabei nie veraendert.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve, relative } from "node:path";
import { readTokens, tokensToCss, injectTokens, studioRoot } from "./build-tokens.mjs";

const pkg = JSON.parse(readFileSync(join(studioRoot, "package.json"), "utf8"));
const HF_VERSION = pkg.hyperframes?.version ?? "latest";
const isWin = process.platform === "win32";
const STAGE = ".render-index.html";

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}
const hasFlag = (name) => process.argv.includes(name);
const rel = (p) => relative(studioRoot, p).replace(/\\/g, "/");
const sha = (text) => createHash("sha256").update(text).digest("hex").slice(0, 12);

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

function quoteArg(a) {
  return /[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a;
}

function spawn(cmd, args, opts) {
  if (isWin) {
    // Ein einziger Befehlsstring vermeidet Nodes DEP0190-Warnung bei shell: true.
    return spawnSync([cmd, ...args.map(quoteArg)].join(" "), { shell: true, ...opts });
  }
  return spawnSync(cmd, args, opts);
}

function run(cmd, args, opts = {}) {
  const result = spawn(cmd, args, { stdio: "inherit", ...opts });
  return result.status ?? 1;
}

function runCapture(cmd, args, opts = {}) {
  const result = spawn(cmd, args, { encoding: "utf8", ...opts });
  return { status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function resolveTarget(input) {
  if (!input) fail("Welches Beispiel oder welcher Ordner? Beispiel: node scripts/render.mjs lower-third");
  const candidates = [resolve(process.cwd(), input), resolve(studioRoot, input), resolve(studioRoot, "library", input)];
  for (const dir of candidates) {
    if (existsSync(join(dir, "index.html"))) return dir;
  }
  fail(`Kein index.html gefunden fuer "${input}". Gesucht in: ${candidates.join(" , ")}`);
}

function defaultOutput(dir) {
  const r = rel(dir);
  const name = basename(dir);
  if (r.startsWith("library/")) return join(dir, "previews", `${name}.mp4`);
  if (r.startsWith("projects/")) {
    const parts = r.split("/");
    return join(studioRoot, parts[0], parts[1], "exports", `${name}.mp4`);
  }
  return join(dir, "renders", `${name}.mp4`);
}

function main() {
  const VALUE_FLAGS = new Set(["--quality", "--format", "--output", "--vars", "--vars-file", "--tokens", "--png"]);
  const args = process.argv.slice(2);
  const target = args.find((a, i) => !a.startsWith("--") && (i === 0 || !VALUE_FLAGS.has(args[i - 1])));
  const dir = resolveTarget(target);

  const quality = arg("--quality", "looks");
  const format = arg("--format", "mp4");
  let output = arg("--output");
  output = output ? resolve(process.cwd(), output) : defaultOutput(dir);
  if (format !== "mp4" && output.endsWith(".mp4")) output = output.replace(/\.mp4$/, `.${format}`);
  mkdirSync(dirname(output), { recursive: true });

  const vars = arg("--vars");
  const varsFile = arg("--vars-file");
  const png = arg("--png");

  // Tokens fuer dieses Render waehlen und in eine temporaere Render-Kopie einsetzen.
  const tokensPath = resolve(studioRoot, arg("--tokens", "brand/tokens.json"));
  if (!existsSync(tokensPath)) fail(`Token-Datei nicht gefunden: ${rel(tokensPath)}`);
  const tokens = readTokens(tokensPath);
  const css = tokensToCss(tokens, rel(tokensPath));
  const sourcePath = join(dir, "index.html");
  const source = readFileSync(sourcePath, "utf8");
  const sourceHash = sha(source);
  const stagePath = join(dir, STAGE);
  writeFileSync(stagePath, injectTokens(source, css), "utf8");
  console.log(`Tokens: ${rel(tokensPath)} (Marke: ${tokens.brand?.name ?? "unbenannt"})`);

  const hfArgs = ["--yes", `hyperframes@${HF_VERSION}`, "render", dir, "--composition", STAGE, "--output", output, "--quality", quality];
  if (format !== "mp4") hfArgs.push("--format", format);
  if (vars) hfArgs.push("--variables", vars);
  if (varsFile) hfArgs.push("--variables-file", resolve(process.cwd(), varsFile));
  if (hasFlag("--strict-variables")) hfArgs.push("--strict-variables");

  console.log(`\nRender: ${rel(dir)}  ->  ${rel(output)}`);
  console.log(`Befehl: npx ${hfArgs.map(quoteArg).join(" ")}\n`);

  let status;
  try {
    status = run("npx", hfArgs, { cwd: dir, env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: process.env.HYPERFRAMES_SKIP_SKILLS ?? "1" } });
  } finally {
    rmSync(stagePath, { force: true });
  }
  if (sha(readFileSync(sourcePath, "utf8")) !== sourceHash) console.log("Hinweis: index.html wurde waehrend des Renders von aussen veraendert.");
  if (status !== 0) fail(`Hyperframes-Render ist mit Status ${status} fehlgeschlagen.`);
  if (!existsSync(output)) fail(`Render meldete Erfolg, aber die Datei fehlt: ${output}`);

  // Pruefung mit ffprobe
  const probe = runCapture("ffprobe", [
    "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration,size",
    "-of", "json", output,
  ]);
  if (probe.status === 0) {
    try {
      const info = JSON.parse(probe.stdout);
      const video = (info.streams ?? []).find((s) => s.codec_type === "video");
      const audio = (info.streams ?? []).find((s) => s.codec_type === "audio");
      const dur = Number(info.format?.duration ?? 0).toFixed(2);
      const size = (Number(info.format?.size ?? 0) / 1024).toFixed(0);
      console.log(`\n✓ ${rel(output)}`);
      console.log(`  ${video ? `${video.width}x${video.height} @ ${video.r_frame_rate} fps` : "kein Videostream!"} · ${dur} s · ${size} KB · Ton: ${audio ? "ja" : "nein"}`);
      console.log(`  index.html unveraendert (sha256 ${sourceHash})`);
    } catch {
      console.log("ffprobe-Ausgabe konnte nicht gelesen werden.");
    }
  } else {
    console.log("Hinweis: ffprobe nicht gefunden, Datei wurde nicht geprueft.");
  }

  if (png !== undefined) {
    const at = Number(png);
    const pngPath = output.replace(/\.[a-z0-9]+$/i, `_${String(at).replace(".", "-")}s.png`);
    const r = run("ffmpeg", ["-y", "-v", "error", "-ss", String(at), "-i", output, "-frames:v", "1", pngPath]);
    if (r === 0) console.log(`  Einzelbild: ${rel(pngPath)}`);
  }
}

main();
