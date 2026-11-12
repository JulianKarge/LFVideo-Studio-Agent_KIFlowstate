#!/usr/bin/env node
// check-setup.mjs
// Bootstrap-Check fuer das Video-Studio. Installiert NICHTS. Gibt eine Pass/Fail-Liste aus.
//
//   node scripts/check-setup.mjs            nur pruefen
//   node scripts/check-setup.mjs --render   zusaetzlich 2-Sekunden-Mini-Render als Funktionstest
//   node scripts/check-setup.mjs --json     Ergebnis als JSON (fuer Agenten)
//
// Geprueft werden: Betriebssystem, Node.js (>= 22), npm, FFmpeg, FFprobe, Git (optional),
// Hyperframes-CLI (gepinnte Version aus package.json), Chrome fuer Hyperframes (doctor),
// Schreibrechte in projects/ und library/, .env (optional), ELEVENLABS_API_KEY (optional).

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const isWin = process.platform === "win32";
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const HF_VERSION = pkg.hyperframes?.version ?? "latest";
const wantRender = process.argv.includes("--render");
const asJson = process.argv.includes("--json");

const results = [];
function add(name, status, detail, fix) {
  results.push({ name, status, detail, fix });
  if (!asJson) {
    const icon = status === "pass" ? "✓" : status === "warn" ? "!" : status === "info" ? "·" : "✗";
    console.log(`${icon} ${name}: ${detail}`);
    if (fix && status !== "pass") console.log(`    -> ${fix}`);
  }
}

// Unter Windows laufen npx/npm ueber die Shell (.cmd); Argumente mit Leerzeichen brauchen Anfuehrungszeichen.
function quoteArg(a) {
  return /[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a;
}

function capture(cmd, args, opts = {}) {
  const base = { encoding: "utf8", timeout: opts.timeout ?? 20000, ...opts };
  // Unter Windows ein einziger Befehlsstring (vermeidet Nodes DEP0190-Warnung bei shell: true).
  const r = isWin
    ? spawnSync([cmd, ...args.map(quoteArg)].join(" "), { shell: true, ...base })
    : spawnSync(cmd, args, base);
  return {
    ok: r.status === 0,
    status: r.status,
    stdout: (r.stdout ?? "").trim(),
    out: ((r.stdout ?? "") + (r.stderr ?? "")).trim(),
    error: r.error,
  };
}

function installHint(tool) {
  const hints = {
    node: {
      win: "winget install OpenJS.NodeJS.LTS",
      mac: "brew install node",
      linux: "https://nodejs.org/ (LTS) oder dein Paketmanager",
    },
    ffmpeg: {
      win: "winget install Gyan.FFmpeg   (danach neues Terminal oeffnen)",
      mac: "brew install ffmpeg",
      linux: "sudo apt install ffmpeg   (oder dein Paketmanager)",
    },
    git: {
      win: "winget install Git.Git",
      mac: "brew install git   (oder xcode-select --install)",
      linux: "sudo apt install git",
    },
  };
  const h = hints[tool];
  if (!h) return "";
  if (isWin) return `Windows: ${h.win}  |  macOS: ${h.mac}  |  Linux: ${h.linux}`;
  if (process.platform === "darwin") return `macOS: ${h.mac}  |  Windows: ${h.win}  |  Linux: ${h.linux}`;
  return `Linux: ${h.linux}  |  macOS: ${h.mac}  |  Windows: ${h.win}`;
}

// 1. Betriebssystem
{
  const tested = isWin ? "getestet" : "sollte funktionieren, ungetestet";
  add("Betriebssystem", "pass", `${os.type()} ${os.release()} (${os.arch()}), ${tested}`);
}

// 2. Node.js
{
  const major = Number(process.versions.node.split(".")[0]);
  if (major >= 22) add("Node.js", "pass", `v${process.versions.node}`);
  else add("Node.js", "fail", `v${process.versions.node}, Hyperframes braucht Node 22 oder neuer`, installHint("node"));
}

// 3. npm / npx
{
  const r = capture("npm", ["--version"]);
  if (r.ok) add("npm", "pass", `v${r.out.split("\n")[0]}`);
  else add("npm", "fail", "npm nicht gefunden (kommt normalerweise mit Node.js)", installHint("node"));
}

// 4. FFmpeg / FFprobe
for (const tool of ["ffmpeg", "ffprobe"]) {
  const r = capture(tool, ["-version"]);
  if (r.ok) {
    const first = r.out.split("\n")[0].replace(/ Copyright.*$/, "");
    add(tool, "pass", first);
  } else {
    add(tool, "fail", `${tool} nicht im PATH`, installHint("ffmpeg"));
  }
}

// 5. Git (optional)
{
  const r = capture("git", ["--version"]);
  if (r.ok) add("Git", "pass", `${r.out.split("\n")[0]} (optional, fuer Versionierung)`);
  else add("Git", "warn", "Git nicht gefunden. Optional, aber praktisch fuer dein Studio.", installHint("git"));
}

// 6. Hyperframes-CLI (gepinnt)
let hfOk = false;
{
  if (!asJson) console.log(`· Hyperframes-CLI ${HF_VERSION} wird geprueft (beim ersten Mal laedt npx das Paket herunter, das kann eine Minute dauern) ...`);
  const r = capture("npx", ["--yes", `hyperframes@${HF_VERSION}`, "--version"], {
    timeout: 300000,
    env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1", HYPERFRAMES_NO_UPDATE_CHECK: "1" },
  });
  const version = r.out.split("\n").filter(Boolean).pop();
  if (r.ok && version && version.includes(HF_VERSION.replace(/^\^|~/, ""))) {
    hfOk = true;
    add("Hyperframes-CLI", "pass", `hyperframes@${version} ueber npx`);
  } else if (r.ok) {
    hfOk = true;
    add("Hyperframes-CLI", "warn", `npx meldet "${version}", package.json pinnt ${HF_VERSION}`, "Version in package.json pruefen oder Skripte erneut ausfuehren.");
  } else {
    add("Hyperframes-CLI", "fail", `npx hyperframes@${HF_VERSION} konnte nicht gestartet werden: ${r.out.split("\n").slice(-2).join(" ")}`, "Internetverbindung pruefen, dann erneut: npx --yes hyperframes@" + HF_VERSION + " --version");
  }
}

// 7. Hyperframes doctor (Chrome, FFmpeg aus Sicht von Hyperframes)
if (hfOk) {
  const r = capture("npx", ["--yes", `hyperframes@${HF_VERSION}`, "doctor", "--json"], {
    timeout: 300000,
    cwd: root,
    env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1", HYPERFRAMES_NO_UPDATE_CHECK: "1" },
  });
  let doc = null;
  try {
    const start = r.stdout.indexOf("{");
    const end = r.stdout.lastIndexOf("}");
    doc = JSON.parse(r.stdout.slice(start, end + 1));
  } catch {
    doc = null;
  }
  if (doc) {
    // doctor.ok ist auch false, wenn nur Optionales fehlt (Docker, whisper-cpp).
    // Fuer lokale Renders zaehlen Node.js, FFmpeg, FFprobe und Chrome.
    const checks = doc.checks ?? [];
    const required = ["Node.js", "FFmpeg", "FFprobe", "Chrome"];
    const missing = required.filter((name) => !checks.find((c) => c.name === name && c.ok));
    const chrome = checks.find((c) => c.name === "Chrome");
    const chromeText = chrome ? (chrome.ok ? `vorhanden (${chrome.detail})` : `fehlt (${chrome.detail})`) : "nicht gemeldet";
    const versionCheck = checks.find((c) => c.name === "Version");
    const optionalMissing = checks.filter((c) => !c.ok && !required.includes(c.name) && c.name !== "Version").map((c) => c.name);
    if (missing.length === 0) {
      add("Hyperframes doctor", "pass", `Node, FFmpeg, FFprobe und Chrome ok. Chrome ${chromeText}` + (optionalMissing.length ? `. Optional fehlt: ${optionalMissing.join(", ")} (fuer lokale Renders nicht noetig)` : ""));
    } else if (missing.length === 1 && missing[0] === "Chrome") {
      add("Hyperframes doctor", "warn", `Chrome fuer Hyperframes ${chromeText}. Wird beim ersten Render automatisch geladen (rund 500 MB).`, "Vorab laden: npx --yes hyperframes@" + HF_VERSION + " browser ensure");
    } else {
      add("Hyperframes doctor", "fail", `fehlt: ${missing.join(", ")}. Chrome ${chromeText}`, "npx --yes hyperframes@" + HF_VERSION + " doctor");
    }
    if (versionCheck && !versionCheck.ok) {
      add("Hyperframes-Version", "info", `Paket pinnt ${HF_VERSION}, npm meldet: ${versionCheck.detail}. Das Studio bleibt bewusst auf der gepinnten Version.`,
        "Upgrade nur gezielt: Version in package.json aendern (auch in den Skills), dann node scripts/check-setup.mjs --render und alle Beispiele neu rendern.");
    }
  } else {
    add("Hyperframes doctor", "warn", "Ausgabe konnte nicht gelesen werden", "Manuell: npx --yes hyperframes@" + HF_VERSION + " doctor");
  }
}

// 8. Schreibrechte
for (const dir of ["projects", "library", "brand"]) {
  const target = join(root, dir);
  try {
    mkdirSync(target, { recursive: true });
    const probe = join(target, `.write-test-${process.pid}`);
    writeFileSync(probe, "ok");
    rmSync(probe);
    add(`Schreibrecht ${dir}/`, "pass", "schreibbar");
  } catch (e) {
    add(`Schreibrecht ${dir}/`, "fail", `nicht schreibbar: ${e.message}`, "Ordner an einen Ort mit Schreibrechten verschieben (z. B. in deinen Benutzerordner).");
  }
}

// 9. .env und ElevenLabs (optional)
{
  const envPath = join(root, ".env");
  if (existsSync(envPath)) {
    const text = readFileSync(envPath, "utf8");
    const hasKey = /^\s*ELEVENLABS_API_KEY\s*=\s*\S+/m.test(text);
    add(".env", "pass", `vorhanden. ELEVENLABS_API_KEY ${hasKey ? "gesetzt (Wert wird nicht angezeigt)" : "leer, ElevenLabs bleibt aus"}`);
  } else if (process.env.ELEVENLABS_API_KEY) {
    add(".env", "info", "keine .env, aber ELEVENLABS_API_KEY ist in der Umgebung gesetzt (Wert wird nicht angezeigt)");
  } else {
    add(".env", "info", "keine .env. Optional: .env.example nach .env kopieren, wenn du ElevenLabs nutzen willst.");
  }
}

// 10. Mini-Render (optional)
if (wantRender) {
  if (!hfOk) {
    add("Mini-Render", "fail", "uebersprungen, Hyperframes-CLI fehlt");
  } else {
    const miniDir = join(here, "mini-render");
    const outDir = join(root, ".studio", "check");
    mkdirSync(outDir, { recursive: true });
    const out = join(outDir, "mini-render.mp4");
    if (!asJson) console.log("· Mini-Render (2 s) laeuft. Fehlt Chrome noch, laedt Hyperframes jetzt einmalig einen eigenen (rund 500 MB, je nach Verbindung ein paar Minuten) ...");
    const t0 = Date.now();
    const r = capture("npx", ["--yes", `hyperframes@${HF_VERSION}`, "render", miniDir, "--output", out, "--quality", "draft", "--quiet"], {
      timeout: 900000,
      cwd: miniDir,
      env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1", HYPERFRAMES_NO_UPDATE_CHECK: "1" },
    });
    const seconds = ((Date.now() - t0) / 1000).toFixed(1);
    if (r.ok && existsSync(out) && statSync(out).size > 0) {
      const probe = capture("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration", "-of", "json", out]);
      let detail = `${out.replace(root, "").replace(/\\/g, "/").replace(/^\//, "")} in ${seconds} s`;
      let valid = false;
      try {
        const info = JSON.parse(probe.stdout);
        const v = (info.streams ?? [])[0] ?? {};
        const dur = Number(info.format?.duration);
        detail += `, ${v.width}x${v.height} @ ${v.r_frame_rate} fps, ${dur.toFixed(2)} s`;
        // Erwartung laut scripts/mini-render/index.html: 1920x1080, 30 fps, 2 s.
        valid = v.width === 1920 && v.height === 1080 && v.r_frame_rate === "30/1" && Math.abs(dur - 2) < 0.05;
      } catch {
        detail += " (ffprobe-Details nicht lesbar)";
      }
      if (valid) add("Mini-Render", "pass", detail);
      else add("Mini-Render", "fail", `${detail}. Erwartet: 1920x1080 @ 30/1 fps, 2.00 s`, "Ausgabe von npx --yes hyperframes@" + HF_VERSION + " doctor pruefen und den Render erneut starten.");
    } else {
      add("Mini-Render", "fail", `Render fehlgeschlagen nach ${seconds} s: ${r.out.split("\n").filter(Boolean).slice(-3).join(" | ")}`, "npx --yes hyperframes@" + HF_VERSION + " doctor   und   npx --yes hyperframes@" + HF_VERSION + " browser ensure");
    }
  }
} else if (!asJson) {
  console.log("· Mini-Render uebersprungen. Mit --render pruefst du, ob ein echtes MP4 entsteht.");
}

// Zusammenfassung
const fails = results.filter((r) => r.status === "fail").length;
const warns = results.filter((r) => r.status === "warn").length;
if (asJson) {
  console.log(JSON.stringify({ ok: fails === 0, fails, warns, hyperframes: HF_VERSION, results }, null, 2));
} else {
  console.log("");
  if (fails === 0) console.log(`Ergebnis: bereit. ${warns ? warns + " Hinweis(e)." : "Keine offenen Punkte."}`);
  else console.log(`Ergebnis: ${fails} Punkt(e) fehlen. Behebe sie und starte den Check erneut.`);
}
process.exit(fails === 0 ? 0 : 1);
