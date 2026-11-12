# my-video-studio

Dein eigenes, wiederverwendbares KI-Video-Studio in einem Ordner. Du öffnest ihn in Claude Code
oder Codex, fügst den Onboarding-Prompt ein, und dein Agent führt dich durch: Werkzeug-Check,
Marken-Interview, drei Motion-Beispiele in deiner Marke, optional ElevenLabs, eine Testaufnahme und
der komplette Schnitt bis zum geprüften MP4. Danach findet jede neue Sitzung deine Marke, deine
freigegebenen Beispiele und dein aktuelles Projekt wieder, ohne dass du etwas erklären musst.

Render-Engine ist [Hyperframes](https://github.com/heygen-com/hyperframes): HTML, CSS und GSAP werden
Frame für Frame zu Video gerendert. Jedes Beispiel bleibt als editierbarer Quelltext erhalten.

Dieses Paket ist das Begleitmaterial zu Teil 1 einer Video-Serie. Erweiterungen (Shortform, weitere
Werkzeuge) folgen in den nächsten Teilen.

<!-- TODO(release): Name der Serie und Titel von Teil 1 eintragen, sobald das Video fertig ist. -->
<!-- TODO(release): Link zum Video eintragen, zum Beispiel: "Das Video zum Paket: <URL>". -->

## Was du brauchst

| Pflicht | Wozu |
| --- | --- |
| Claude Code oder Codex | Dein Agent. Dieses Paket wurde mit Claude Code getestet; die Codex-Variante (`.agents/skills/`) ist identisch gespiegelt, aber ungetestet. |
| Node.js 22 oder neuer | Hyperframes und die Skripte in `scripts/` laufen mit Node. |
| FFmpeg und FFprobe | Rendern, Prüfen, Frames ziehen, Sync-Messung. |
| Etwa 500 MB freier Speicher und eine Internetverbindung | Hyperframes lädt beim ersten Render einmalig einen eigenen Chrome (chrome-headless-shell, rund 500 MB, ein paar Minuten). Auch danach braucht jeder Render Internet: GSAP kommt von cdn.jsdelivr.net, Schriften bei Bedarf von Google Fonts. |

| Optional | Wozu |
| --- | --- |
| Git | Versionierung deines Studios. |
| OBS oder ein anderes Aufnahmeprogramm | Getrennte Kamera- und Bildschirm-Dateien plus separates Mikrofon. |
| ElevenLabs-Konto | Transkripte mit Zeitmarken, optional Sprachaufbereitung oder SFX. Kostet Kontingent, der Agent sagt vorher Bescheid. |

Fehlt etwas, sagt dir `node scripts/check-setup.mjs` den passenden Installationsbefehl
(`winget` unter Windows, Hinweise für macOS und Linux). Das Skript installiert nichts selbst.

Getestet unter Windows 11. macOS und Linux sollten funktionieren, sind aber ungetestet.

## In 5 Minuten starten

1. Ordner holen: auf GitHub über "Code", "Download ZIP" herunterladen und entpacken, oder klonen:

   ```bash
   git clone https://github.com/JulianKarge/LFVideo-Studio-Agent_KIFlowstate.git my-video-studio
   ```

   Lege den Ordner an einen eigenen Ort, zum Beispiel `~/video-studio/my-video-studio`.

2. Terminal im Ordner öffnen und prüfen:

   ```bash
   node scripts/check-setup.mjs --render
   ```

   Du bekommst eine Pass/Fail-Liste und ein 2-Sekunden-Test-MP4 unter `.studio/check/`.
3. Claude Code (oder Codex) im Ordner starten und den Text aus `ONBOARDING-PROMPT.md` einfügen.
4. Dem Agenten folgen. Er beginnt mit dem Skill `studio-setup` und fragt dich danach im
   Marken-Interview nach deiner Marke. Die mitgelieferte Marke "Fjordlicht" ist eine Demo und wird
   durch deine Antworten ersetzt.

Ohne Agent kannst du die Beispiele auch direkt rendern:

```bash
node scripts/render.mjs lower-third --png 3.5
```

## Was im Paket ist

```text
my-video-studio/
  README.md                 diese Datei
  AGENTS.md                 Arbeitsvertrag deines Studio-Agenten (Quelle der Wahrheit)
  CLAUDE.md                 importiert AGENTS.md fuer Claude Code
  ONBOARDING-PROMPT.md      der Prompt fuer die erste Sitzung
  brand/
    tokens.json             Farben, Schriften, Radien, Abstaende, Motion-Werte (Demo-Marke)
    tokens.css              daraus erzeugt (node scripts/build-tokens.mjs)
    identity.md             Zielgruppe, Ton, Do und Don't
    motion.md               Motion-Regeln: Easing, Dauern, Ein- und Ausgaenge, Kamera
    preferences.md          Likes/Dislikes-Log (nur ausdruecklich bestaetigte Regeln)
    examples/tokens-alt-demo.json   zweites Demo-Treatment fuer den Beweis "gleiches Beispiel, andere Marke"
  library/
    index.json              alle Beispiele: Zweck, Variablen, Render-Befehl, Freigabestatus
    lower-third/            Sprecherkarte (8 s)
    point-graphic/          Punkt-Grafik mit drei Punkten (10 s)
    floating-preview/       raeumlich bewegte Website-Vorschau (10 s), mit selbst erzeugtem Demo-Medium
  projects/
    _template/              Vorlage fuer jede Produktion (PROJECT.md, project.json, Ordner)
  .claude/skills/           vier Skills fuer Claude Code
  .agents/skills/           dieselben vier Skills fuer Codex
  scripts/
    check-setup.mjs         Werkzeug-Check mit Pass/Fail, optional Mini-Render (--render)
    render.mjs              Render-Wrapper mit Ausgabepfad-Konvention, Variablen, Token-Override
    build-tokens.mjs        tokens.json -> tokens.css und Token-Block in jedem Beispiel
    sync-offset.mjs         Versatz zwischen zwei Aufnahmen per Tonspur messen
    mini-render/            die 2-Sekunden-Testkomposition
  .env.example              Vorlage fuer .env (ELEVENLABS_API_KEY)
  .gitignore
  LICENSES.md               Lizenzen aller gebuendelten Bibliotheken und Schriften
```

## So funktioniert die Marke

`brand/tokens.json` ist die einzige Quelle für Farben, Schriften, Radien und Abstände.
`node scripts/build-tokens.mjs` erzeugt daraus `brand/tokens.css` und schreibt denselben Inhalt als
markierten Block (`brand-tokens:start` bis `brand-tokens:end`) in jedes Beispiel. Der Block steht im
Dokument und nicht als verlinkte Datei, weil Hyperframes die Schriften nur so erkennt und lädt. Die
Beispiele selbst kennen nur `var(--color-accent)`, `var(--font-display)` und so weiter. Deshalb trägt
dasselbe Beispiel ohne eine Zeile Quelltextänderung eine andere Marke. `render.mjs` setzt die
gewählten Tokens dafür in eine temporäre Render-Kopie ein; `index.html` bleibt byte-gleich:

```bash
node scripts/render.mjs lower-third --tokens brand/examples/tokens-alt-demo.json --output library/lower-third/previews/alt-brand.mp4 --png 3.5
```

Die Schriften der Demo-Marke (Outfit, Inter, JetBrains Mono) und des zweiten Treatments (Playfair
Display, Lato, IBM Plex Mono) bringt Hyperframes mit. Andere Google Fonts legst du als Datei nach
`library/<beispiel>/assets/fonts/`, ergänzt `@font-face` und trägst die Lizenz in `LICENSES.md` ein.

## Kosten, ehrlich sortiert

| Kategorie | Was |
| --- | --- |
| Kostenlos | Hyperframes lokal rendern, FFmpeg, Node, dieses Paket, die mitgelieferten Beispiele. |
| Dein bestehendes Abo | Claude Code oder Codex (Tokens deines Anbieters). |
| Optional, nach Nutzung | ElevenLabs (Transkription, Sprachbearbeitung, SFX). Der Agent nennt den Aufruf, bevor er ihn startet. Hyperframes-Cloud-Rendering, falls du es jemals nutzen willst; lokal brauchst du es nicht. |

Es gibt keine versteckten Dienste. Alles, was einen Schlüssel braucht, steht in `.env.example`.

## Deine erste Produktion

Jede Produktion ist ein Ordner unter `projects/`. Der Agent legt `projects/first-video/` aus
`projects/_template/` an, legt deine Originale in `inputs/`, misst den Versatz zwischen Kamera,
Bildschirm und Mikrofon (`scripts/sync-offset.mjs`), plant den Schnitt in `PROJECT.md`, baut den Schnitt
als Hyperframes-Komposition und rendert nach `exports/`. Fertig ist er erst, wenn `ffprobe`
Auflösung, fps, Dauer und Tonspur bestätigt und die ersten und letzten Frames angesehen wurden.

## Häufige Fragen

**Muss ich die offiziellen Hyperframes-Skills installieren?** Empfohlen, nicht zwingend. Der Skill
`studio-setup` prüft sie und installiert sie nur mit deiner Zustimmung (`npx --yes hyperframes@0.8.199 skills`, nutzerweit). Die vier
Paket-Skills nennen alle Befehle, die du für die Beispiele brauchst, auch ohne sie.

**Welche Hyperframes-Version?** Die gepinnte Version steht in `package.json` unter `hyperframes.version`
(aktuell 0.8.199). Alle Skripte nutzen `npx --yes hyperframes@<version>`. Ein Upgrade ersetzt diese Versionsnummer überall per Suchen und Ersetzen, danach
`node scripts/check-setup.mjs --render`.

**Kann ich das mit Codex nutzen?** Die Skills liegen unter `.agents/skills/` gespiegelt und `AGENTS.md`
ist das Format, das Codex liest. Getestet wurde nur Claude Code.

**Wo landen Schlüssel?** Nur in `.env` (aus `.env.example`), nie im Chat, nie in Git.
