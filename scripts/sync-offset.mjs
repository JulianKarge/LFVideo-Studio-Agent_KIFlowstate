#!/usr/bin/env node
// sync-offset.mjs
// Misst den zeitlichen Versatz zwischen zwei Aufnahmen anhand ihrer Tonspuren
// (Kreuzkorrelation). Typischer Fall: Kamera-Datei, Bildschirm-Datei und separate
// Mikrofon-Datei, die alle denselben Raumton oder einen Klatscher enthalten.
//
//   node scripts/sync-offset.mjs <referenz> <andere> [--max 10] [--json]
//
// Ausgabe: um wie viele Sekunden dasselbe Ereignis in <andere> spaeter (positiv) oder
// frueher (negativ) liegt als in <referenz>, plus ein Vertrauenswert (0 bis 1).
//
// Umrechnung fuer Hyperframes: Zeigt ein Clip die Referenz ab Quellzeit R
// (data-media-start="R"), dann braucht der gleichzeitige Clip der anderen Datei
//   data-media-start = R + Versatz
// Beispiel: Versatz Mikrofon +0.75, Kamera-Segment ab 3.0 -> Mikrofon ab 3.75.
//
// Das Skript dekodiert beide Dateien mit ffmpeg nach Mono 8 kHz PCM und
// korreliert sie per FFT. Die Analyse nutzt die ersten --window Sekunden
// (Standard 60), der gesuchte Versatz darf hoechstens --max Sekunden betragen (Standard 10).

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const RATE = 8000;

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1] ?? fallback;
}
const files = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && !(i > 0 && ["--max", "--window"].includes(all[i - 1])));
const maxLag = Number(arg("--max", 10));
const windowSeconds = Number(arg("--window", 60));
const asJson = process.argv.includes("--json");

if (files.length !== 2) {
  console.error("Aufruf: node scripts/sync-offset.mjs <referenz> <andere> [--max 10] [--window 60] [--json]");
  process.exit(2);
}
for (const f of files) {
  if (!existsSync(f)) {
    console.error(`Datei nicht gefunden: ${f}`);
    process.exit(2);
  }
}

function decode(file) {
  const r = spawnSync(
    "ffmpeg",
    ["-v", "error", "-t", String(windowSeconds), "-i", file, "-vn", "-ac", "1", "-ar", String(RATE), "-f", "f32le", "-"],
    { maxBuffer: 1024 * 1024 * 512 },
  );
  if (r.status !== 0) {
    console.error(`ffmpeg konnte ${file} nicht dekodieren:\n${r.stderr?.toString() ?? ""}`);
    process.exit(1);
  }
  const buf = r.stdout;
  const samples = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4));
  return Float32Array.from(samples);
}

function normalize(x) {
  let mean = 0;
  for (const v of x) mean += v;
  mean /= x.length || 1;
  let energy = 0;
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) {
    out[i] = x[i] - mean;
    energy += out[i] * out[i];
  }
  const norm = Math.sqrt(energy) || 1;
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

// Radix-2 FFT (in place), re/im als Float64Array.
function fft(re, im, invert) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (2 * Math.PI) / len * (invert ? -1 : 1);
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j], ui = im[i + j];
        const vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci;
        const vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
        re[i + j] = ur + vr; im[i + j] = ui + vi;
        re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
  if (invert) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

function crossCorrelate(a, b) {
  const n = 1 << Math.ceil(Math.log2(a.length + b.length));
  const ar = new Float64Array(n), ai = new Float64Array(n);
  const br = new Float64Array(n), bi = new Float64Array(n);
  ar.set(a); br.set(b);
  fft(ar, ai, false); fft(br, bi, false);
  // corr = IFFT( conj(A) * B )  -> Spitze bei lag k heisst: b ist um k Samples spaeter als a.
  for (let i = 0; i < n; i++) {
    const r = ar[i] * br[i] + ai[i] * bi[i];
    const im = ar[i] * bi[i] - ai[i] * br[i];
    ar[i] = r; ai[i] = im;
  }
  fft(ar, ai, true);
  return { corr: ar, n };
}

const a = normalize(decode(files[0]));
const b = normalize(decode(files[1]));
const { corr, n } = crossCorrelate(a, b);
const maxLagSamples = Math.min(Math.floor(maxLag * RATE), n / 2 - 1);

let best = -Infinity, bestLag = 0, second = -Infinity;
for (let lag = -maxLagSamples; lag <= maxLagSamples; lag++) {
  const idx = lag >= 0 ? lag : n + lag;
  const v = corr[idx];
  if (v > best) { second = best; best = v; bestLag = lag; }
  else if (v > second) second = v;
}
// Vertrauen: wie deutlich ragt die Spitze ueber den Rest heraus (grob).
let sum = 0, count = 0;
for (let lag = -maxLagSamples; lag <= maxLagSamples; lag += 7) {
  const idx = lag >= 0 ? lag : n + lag;
  sum += Math.abs(corr[idx]); count++;
}
const meanAbs = sum / (count || 1);
const confidence = Math.max(0, Math.min(1, 1 - meanAbs / (Math.abs(best) || 1)));
const offsetSeconds = bestLag / RATE;

const result = {
  reference: files[0],
  other: files[1],
  offset_seconds: Number(offsetSeconds.toFixed(4)),
  offset_frames_30fps: Number((offsetSeconds * 30).toFixed(2)),
  confidence: Number(confidence.toFixed(3)),
  analysed_seconds: Math.min(windowSeconds, a.length / RATE, b.length / RATE),
  meaning: offsetSeconds >= 0
    ? `Ton in "${files[1]}" liegt ${Math.abs(offsetSeconds).toFixed(3)} s SPAETER als in "${files[0]}".`
    : `Ton in "${files[1]}" liegt ${Math.abs(offsetSeconds).toFixed(3)} s FRUEHER als in "${files[0]}".`,
};
if (asJson) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`Versatz: ${result.offset_seconds >= 0 ? "+" : ""}${result.offset_seconds} s (${result.offset_frames_30fps} Frames bei 30 fps), Vertrauen ${result.confidence}`);
  console.log(result.meaning);
  console.log(`Fuer Hyperframes: data-media-start dieser Datei = data-media-start der Referenz ${result.offset_seconds >= 0 ? "+" : "-"} ${Math.abs(result.offset_seconds)}`);
  if (result.confidence < 0.6) console.log("Hinweis: niedriges Vertrauen. Pruefe das Ergebnis an einem sichtbaren Klatscher oder einer Lippenbewegung.");
}
