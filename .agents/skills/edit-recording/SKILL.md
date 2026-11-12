---
name: edit-recording
description: Von der Aufnahme zum geprüften MP4. Intake getrennter Kamera-, Bildschirm- und Mikrofon-Dateien, Versatz messen, Umfang klären (kompletter Schnitt oder nur Overlays), Schnittplan, Hyperframes-Komposition, Render, Prüfung mit ffprobe und Frames. Nutze ihn für die Testaufnahme beim Onboarding und für jede Produktion danach.
---

# edit-recording

Ziel: Ein Projektordner unter `projects/<name>/`, in dem Originale, Versatz, Schnittplan, Komposition
und ein geprüftes MP4 zusammenliegen, und eine `PROJECT.md`, mit der ein neuer Chat weiterarbeiten kann.

## 0. Aufnahme anleiten (nur beim ersten Mal oder auf Wunsch)

Für eine Testaufnahme von 20 bis 40 Sekunden:

- Zwei getrennte Videodateien: Kamera und Bildschirm, beide 1920x1080 mit 30 fps (in OBS zum Beispiel
  über Source Record oder zwei Aufnahmen; Hauptsache, zwei Dateien).
- Ein separates Mikrofon als Master-Sprachspur (WAV oder eine dritte Datei), Pegel gesund, nicht leise.
- Zu Beginn ein sichtbarer Klatscher oder ein deutlich gesprochener Satz vor der Kamera. Er dient der
  Sync-Messung.
- Inhalt: ein Satz in die Kamera (Hook), 10 bis 15 Sekunden etwas auf dem Bildschirm zeigen und drei
  Punkte nennen, ein Abschlusssatz in die Kamera.

Prüfe die Dateien, bevor ein langer Take entsteht.

## 1. Projekt anlegen und Intake

```bash
cp -r projects/_template projects/<name>
```

Originale nach `projects/<name>/inputs/` legen (kopieren oder verschieben, nie umbenennen, nie
umkodieren). Dann jede Datei prüfen:

```bash
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels:format=duration -of json projects/<name>/inputs/camera.mp4
```

Trage Rolle, Auflösung, fps, Dauer und Tonspur in die Tabelle "Material" in `PROJECT.md` und die
Pfade in `project.json` ein. Weicht etwas ab (andere fps, variable Framerate, kein Ton), nenne es jetzt.

## 2. Umfang klären

Frag genau eine Sache, falls sie nicht im Brief steht: **kompletter Schnitt** oder **nur Overlays**
auf einem fertigen Schnitt? Trage die Antwort und alles, was ausdrücklich nicht beauftragt ist
(Füllwörter, Grading, Untertitel, Shorts), in `PROJECT.md` und `project.json` (`scope`) ein.

## 3. Versatz messen

Referenz ist die Kamera. Miss die anderen Dateien gegen sie:

```bash
node scripts/sync-offset.mjs projects/<name>/inputs/camera.mp4 projects/<name>/inputs/screen.mp4
node scripts/sync-offset.mjs projects/<name>/inputs/camera.mp4 projects/<name>/inputs/mic.wav
```

Das Skript korreliert die Tonspuren (Mono, 8 kHz, FFT) und gibt den Versatz in Sekunden und Frames
plus ein Vertrauen aus. Positiv heißt: dasselbe Ereignis liegt in der zweiten Datei später. Für die
Komposition gilt eine einzige Regel: Zeigt ein Kamera-Clip die Quellzeit R (`data-media-start="R"`),
dann bekommt der gleichzeitige Clip der anderen Datei `data-media-start = R + Versatz`.
Bei Vertrauen unter 0.6 oder
wenn eine Datei keinen Ton hat: Sichtprüfung am Klatscher. Dafür den Frame des Klatschers in beiden
Videos suchen:

```bash
ffmpeg -y -v error -ss 2.0 -i projects/<name>/inputs/camera.mp4 -frames:v 1 projects/<name>/previews/sync-camera-2-0s.png
```

Ergebnis in `PROJECT.md` (Abschnitt Versatz) und `project.json` (`sync`) eintragen, inklusive ob die
Sichtprüfung gemacht wurde.

## 4. Transkript (optional, wenn Schnitt nach Text geplant wird)

Wenn ElevenLabs eingerichtet ist (`.env`), kann ein Transkript mit Zeitmarken den Schnittplan
beschleunigen. Nenne vorher, dass der Aufruf Kontingent verbraucht, und frag. Ohne ElevenLabs
planst du nach Anhören der Mikrofonspur und den Zeitstempeln, die der Mensch nennt. Cache nach
`projects/<name>/transcripts/` mit Quelle und Zeitbasis (Kamera-Zeit) im Dateinamen.

## 5. Schnittplan

Fülle die Tabelle "Schnittplan" in `PROJECT.md`: Nummer, Von und Bis in **Kamera-Zeit**, Lage
(Kamera voll / Kamera klein oben rechts mit Bildschirm voll), Grafik, Notiz. Für die Testaufnahme:

1. Kamera voll (Hook)
2. Kamera klein oben rechts, Bildschirm voll (Erklärung)
3. Punkt-Grafik mit den drei genannten Punkten über oder statt des Bildschirms
4. Kamera voll (Abschluss)

Lagewechsel an Sinnbrüchen, Übergänge 1.1 bis 1.5 s (`brand/motion.md`). Die kleine Kamera deckt
nicht ab, worüber gesprochen wird. Kürzungen nur an Wortgrenzen, der Mensch sieht Von/Bis vorher.

## 6. Komposition bauen

Der Projektordner selbst ist das Hyperframes-Projekt: Der Schnitt steht in
`projects/<name>/index.html`, Medien werden relativ zum Projektordner referenziert (`inputs/camera.mp4`),
Grafiken liegen als Sub-Kompositionen in `projects/<name>/graphics/<id>.html`. Hyperframes erwartet
Pfade relativ zum Projekt, daher keine `../`-Pfade und keine Kopien der Originale.

Grundregeln (im Dry-Run so gebaut und geprüft):

- Wurzel: `data-composition-id="edit"`, `data-width="1920"`, `data-height="1080"`, `data-duration`
  = Ziel-Länge, `data-fps="30"`. Registrierung: `window.__timelines["edit"] = tl`.
- Jedes Segment des Schnittplans ist ein eigener `<video>`-Clip mit eigener `id`:
  `<video id="cam-a" class="clip" src="inputs/camera.mp4" muted playsinline data-start="0" data-duration="5" data-media-start="2.5">`.
  `data-start` ist Ausgabezeit, `data-media-start` ist Quellzeit. Ein Schnitt ist einfach der nächste
  Clip mit späterem `data-media-start`.
- Bildschirm genauso, mit `data-media-start = Kamera-Quellzeit + Versatz Bildschirm`.
- Genau eine Sprachspur, ebenfalls pro Segment ein Clip:
  `<audio id="voice-a" src="inputs/mic.wav" data-start="0" data-duration="5" data-media-start="<Kamera-Quellzeit + Versatz Mikrofon>">`.
  Jedes `<audio>` braucht eine `id`, sonst bleibt der Render stumm. Kamera- und Bildschirm-Videos bleiben `muted`.
- Kurze Fades an Schnittkanten über die Lautstärke-Spur des Clips, `t` ist clip-lokal:
  `data-automation='{"version":1,"lanes":[{"target":"volume","points":[{"t":0,"v":0},{"t":0.03,"v":1},{"t":4.97,"v":1},{"t":5,"v":0}]}]}'`.
- Kamera-Lagen: Alle Kamera-Clips liegen in einem nicht zeitgesteuerten Wrapper `#cam-media`
  (1920x1080, `transform-origin: 0 0`) in einer Hülle `#cam-shell` (bildfüllend). GSAP animiert zwei
  Dinge gleichzeitig mit derselben Dauer und `power2.inOut`: `clipPath` der Hülle (der sichtbare
  Ausschnitt) und `x`, `y`, `scale` des Wrappers (gleichmäßige Skalierung, keine Verzerrung).
  Getestete Werte für "klein oben rechts, Hochkant 304 x 410, 96 px Rand":
  Hülle `inset(80px 96px 590px 1520px round 24px)`, Wrapper `x: 1192, y: 25, scale: 0.5`
  (zeigt den Quellausschnitt x 656 bis 1264, y 110 bis 930; passe ihn an die Lage des Gesichts an).
  Voll: `inset(0px 0px 0px 0px round 0px)`, `x: 0, y: 0, scale: 1`. Für den Rückweg
  `immediateRender: false` am zweiten `fromTo`. Timing nie zusätzlich an Hülle oder Wrapper
  (Lint-Regel `video_nested_in_timed_element`).
- Punkt-Grafik als Sub-Komposition: `library/point-graphic/index.html` nach
  `projects/<name>/graphics/point-graphic.html` kopieren und umbauen: Styles, Markup und Script in ein
  `<template>` im `<body>`, Wurzel `<div id="root" data-composition-id="point-graphic" ...>` mit
  `#root { position: absolute; inset: 0 }` statt fester Größe, die Regel für `html, body` entfernen,
  Clip-ids eindeutig machen (zum Beispiel `pg-point-1`). Dauer anpassen (README des Beispiels). Einhängen:
  `<div id="point-graphic" data-composition-id="point-graphic" data-composition-src="graphics/point-graphic.html" data-start="9.6" data-duration="8" data-width="1920" data-height="1080" data-variable-values='{"title":"..."}'></div>`.
- Tokens in beide Dateien als Block im Dokument schreiben (bei der Sub-Komposition landet er direkt
  hinter `<template>`, weil Hyperframes nur den Template-Inhalt übernimmt):

  ```bash
  node scripts/build-tokens.mjs --into projects/<name>/index.html
  node scripts/build-tokens.mjs --into projects/<name>/graphics/point-graphic.html
  ```

- Alle Farben aus den Tokens. Keine Tonspur außer der Sprachspur (und bewusst gesetzter Musik mit `id`).

Dann im Projektordner:

```bash
npx --yes hyperframes@0.8.199 check
npx --yes hyperframes@0.8.199 timeline
```

`check` muss ohne Fehler laufen; `timeline` zeigt jeden Clip mit Ausgabezeit, so prüfst du den
Schnittplan, bevor du renderst.

## 7. Rendern und prüfen

```bash
node scripts/render.mjs projects/<name> --quality looks --output projects/<name>/exports/<name>_v1.mp4
```

Prüfung, bevor du "fertig" sagst:

1. `ffprobe`: 1920x1080, 30 fps, Dauer wie geplant, eine Tonspur vorhanden.
2. Erster und letzter Frame als PNG ansehen, plus ein Frame kurz vor und nach jedem Schnitt, mitten in
   jedem Lagewechsel und pro Grafik:

   ```bash
   ffmpeg -y -v error -ss 5.1 -i projects/<name>/exports/<name>_v1.mp4 -frames:v 1 projects/<name>/previews/v1_5-1s.png
   ffmpeg -y -v error -sseof -0.04 -i projects/<name>/exports/<name>_v1.mp4 -frames:v 1 -update 1 projects/<name>/previews/v1_last.png
   ```

3. Ton-Sync des fertigen Videos: einen Abschnitt des Exports gegen denselben Abschnitt der Kamera
   messen. Ergebnis muss 0 s sein (höchstens ein Frame Abweichung):

   ```bash
   ffmpeg -y -v error -ss 5 -t 10 -i projects/<name>/exports/<name>_v1.mp4 -vn -c:a pcm_s16le projects/<name>/previews/out.wav
   ffmpeg -y -v error -ss 8.5 -t 10 -i projects/<name>/inputs/camera.mp4 -vn -c:a pcm_s16le projects/<name>/previews/cam.wav
   node scripts/sync-offset.mjs projects/<name>/previews/cam.wav projects/<name>/previews/out.wav --max 2
   ```

   (Ausgabezeit 5 entspricht hier Kamera-Quellzeit 8.5.) Zusätzlich an einer Stelle mit Sprache die
   Lippen gegen den Ton ansehen.
4. Lautheit grob prüfen (`ffmpeg -i <export> -af volumedetect -vn -f null -`), kein Knacken an Schnittkanten.
5. Alles in `PROJECT.md` (Tabelle Renders) und `project.json` (`exports`, `verification`) eintragen.

Rendern ohne diese Prüfung ist kein Ergebnis.

## 8. Korrekturen und Merken

Korrekturwünsche am Video gehen in `PROJECT.md` (projektbezogen) und in eine neue Version
(`<name>_v2.mp4`, die v1 bleibt). Nur wenn der Mensch sagt, dass etwas ab jetzt immer gelten soll,
schreibst du es nach `brand/preferences.md`. Am Ende steht in `PROJECT.md`, was fertig ist, welche Datei
die aktuelle ist, und der eine nächste Schritt.
