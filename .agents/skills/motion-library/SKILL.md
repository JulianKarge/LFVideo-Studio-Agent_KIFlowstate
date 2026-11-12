---
name: motion-library
description: Arbeit an der Motion-Bibliothek in library/. Ein Beispiel rendern, Vorschau zeigen, Feedback einarbeiten, als approved in library/index.json eintragen, oder ein neues Beispiel nach dem Muster der drei mitgelieferten anlegen. Nutze ihn, wenn eine Grafik gebaut, angepasst oder freigegeben werden soll.
---

# motion-library

Ziel: Eine kleine Bibliothek editierbarer Hyperframes-Kompositionen, die alle dieselben Tokens nutzen
und deren Freigabestatus in `library/index.json` steht. Jede Komposition ist ein eigener
Hyperframes-Projektordner mit `index.html` (darin ein erzeugter Token-Block), `README.md`, `preview.png`.

Der Token-Block steht zwischen `<!-- brand-tokens:start ... -->` und `<!-- brand-tokens:end -->` und wird
von `node scripts/build-tokens.mjs` geschrieben. Er muss im Dokument stehen, nicht als verlinkte
CSS-Datei: Hyperframes erkennt Schriften nur aus `<style>`-Blöcken im Dokument und lädt sie dann.
Ein `<link>` auf eine CSS-Datei mit den Font-Variablen lässt die Farben funktionieren, die Schriften
fallen aber still auf eine Systemschrift zurück.

## Vorher lesen

`library/index.json`, das `README.md` des betroffenen Beispiels, `brand/motion.md`,
`brand/preferences.md`.

## Ein Beispiel rendern und zeigen

```bash
node scripts/render.mjs lower-third --quality looks --png 3.5
node scripts/render.mjs point-graphic --quality looks --png 5.5
node scripts/render.mjs floating-preview --quality looks --png 3.0
```

Der Wrapper rendert nach `library/<id>/previews/<id>.mp4` und legt mit `--png` ein Einzelbild daneben.
Zeig dem Menschen das PNG (und nenne den MP4-Pfad). Eigene Texte: `--vars '{"name":"..."}'`; die
Variablen jedes Beispiels stehen in `index.json` und im README des Beispiels. Für Overlays ohne
Hintergrund: `--format webm` plus die im README genannte Variable.

Erste und letzte Frames prüfst du immer mit:

```bash
ffmpeg -y -v error -ss 0.05 -i library/<id>/previews/<id>.mp4 -frames:v 1 library/<id>/previews/frame-first.png
ffmpeg -y -v error -sseof -0.1 -i library/<id>/previews/<id>.mp4 -frames:v 1 library/<id>/previews/frame-last.png
```

Beide müssen nur den Grund zeigen (nichts hängt halb im Bild).

## Feedback einarbeiten

- "Ändere das" am Beispiel: Quelltext anpassen, `npx --yes hyperframes@0.8.199 check` im Beispielordner
  ausführen (alle Fehler beheben, Warnungen abwägen), neu rendern, PNG zeigen. Timing-Änderungen auch
  in `README.md` des Beispiels nachziehen.
- Farben, Schriften, Radien änderst du **nie** im Beispiel, sondern in `brand/tokens.json`, dann
  `node scripts/build-tokens.mjs`. Ein Hex-Wert oder Schriftname außerhalb des Token-Blocks ist ein Fehler.
- "Merk dir das" (gilt für alle künftigen Grafiken): Eintrag in `brand/preferences.md` nach der Vorlage
  dort. Nur, wenn es ausdrücklich gesagt wurde.

## Freigeben

Wenn der Mensch ein Beispiel gut findet, setze in `library/index.json` beim Eintrag `status` auf
`"approved"` und `approved_on` auf das Datum. Aktualisiere `preview.png` (Frame aus dem freigegebenen
Render, 1920x1080). Nicht freigegebene Beispiele bleiben `"candidate"`. Ein Eintrag hat immer: `id`,
`purpose`, `source`, `preview`, `duration_seconds`, `variables`, `render`, `status`.

## Ein neues Beispiel anlegen

1. Ordner `library/<neue-id>/` mit `index.html` und `README.md`. Orientiere dich am ähnlichsten
   vorhandenen Beispiel; kopiere seine Struktur, nicht sein Aussehen. Danach
   `node scripts/build-tokens.mjs`: das Skript setzt den Token-Block vor `</head>` ein (oder ersetzt
   einen vorhandenen Block).
2. Hyperframes-Vertrag einhalten: Wurzel mit `data-composition-id`, `data-width="1920"`,
   `data-height="1080"`, `data-duration`; jedes zeitgesteuerte Element `class="clip"` mit `data-start`
   und `data-duration`; genau eine pausierte GSAP-Timeline `window.__timelines["<id>"] = tl`;
   `gsap.fromTo` statt CSS-Transforms auf animierten Elementen; keine Sichtbarkeits-Tweens auf `.clip`;
   keine `Date.now()`, `Math.random()`, Timer, `repeat: -1`. Variablen über
   `data-composition-variables` auf `<html>` und `data-var-text` / `data-var-src`.
3. Alles Sichtbare aus `var(--color-*)`, `var(--font-*)`, `var(--radius-*)`, `var(--space-*)`,
   `var(--type-*)`. Erlaubt daneben nur `rgba(0,0,0,x)` für Schatten.
4. Prüfen, rendern, Frames ansehen, README schreiben (Zweck, Variablen, Dauer ändern, Render-Befehl),
   `preview.png` erzeugen, Eintrag in `index.json` mit `status: "candidate"`.
5. Wenn eine Komposition mehrere Szenen hat oder in einen Schnitt eingebaut wird, gelten zusätzlich die
   Regeln für Sub-Kompositionen (`<template>`, gleiche `data-composition-id` an Host und Datei). Die
   offiziellen Hyperframes-Skills (`hyperframes-core`) beschreiben sie vollständig.

## Dauer ändern

Jedes Beispiel nennt im README die zwei Stellen: `data-duration` an der Wurzel und die Ausgangszeiten
in der Timeline. Variablen ändern die Dauer nicht; das ist eine Quelltextänderung und gehört, wenn sie
nur für ein Video gilt, in eine Kopie unter `projects/<name>/graphics/`.
