---
name: studio-setup
description: Erster Start des Video-Studios. Prüft Betriebssystem, Node, FFmpeg und die gepinnte Hyperframes-Version, installiert die offiziellen Hyperframes-Skills nach dem dokumentierten Weg und rendert einen 2-Sekunden-Funktionstest. Installiert keine Systemwerkzeuge selbst. Nutze ihn beim Onboarding, nach einem Rechnerwechsel oder wenn ein Render unerklärlich scheitert.
---

# studio-setup

Ziel: Am Ende weißt du und weiß der Mensch am Rechner, dass dieses Studio hier rendern kann. Beweis
ist ein echtes MP4, nicht eine Liste installierter Dinge.

## Schritte

1. **Werkzeug-Check ausführen** (im Studio-Ordner):

   ```bash
   node scripts/check-setup.mjs
   ```

   Du bekommst eine Pass/Fail-Liste: Betriebssystem, Node (mindestens 22), npm, FFmpeg, FFprobe, Git
   (optional), Hyperframes-CLI in der gepinnten Version aus `package.json`, Hyperframes `doctor`
   (Chrome), Schreibrechte, `.env`. Für Agenten gibt es `--json`.

2. **Fehlendes benennen, nicht installieren.** Bei jedem Fail zeigt das Skript den passenden Befehl
   (`winget` unter Windows, Hinweise für macOS und Linux). Gib diese Befehle dem Menschen zum Ausführen
   und starte den Check danach erneut. Du installierst keine Systemwerkzeuge, änderst keinen PATH und
   keine Systemeinstellungen.

3. **Offizielle Hyperframes-Skills.** Sie sind empfohlen, aber nicht Pflicht: Die vier Paket-Skills
   nennen alle Befehle, die du hier brauchst. Prüfe den Stand nur lesend:

   ```bash
   npx --yes hyperframes@0.8.199 skills check
   ```

   Der Befehl zeigt, wo die Skills liegen (zum Beispiel `~/.claude/skills/` für Claude Code,
   `~/.agents/skills/` für Codex) und welche aktuell oder veraltet sind. Exit-Code 1 heißt nur "etwas
   ist veraltet oder fehlt", kein Absturz. Ein Hyperframes-Plugin bringt seine Skills selbst mit und
   aktualisiert sie selbst; dann tust du hier nichts.

   - **Fehlen sie:** Installation ist `npx --yes hyperframes@0.8.199 skills`. Das installiert die
     Skills **nutzerweit für alle unterstützten Agenten** in deinen Benutzerordner, nicht nur für dieses
     Studio. Sag das dem Menschen, bevor du es ausführst, und führe es nur mit seiner Zustimmung aus.
     Offizielle Anleitung: https://github.com/heygen-com/hyperframes/blob/main/docs/quickstart.mdx
     (prüfe sie, wenn du Netz hast; Alternative laut Doku: `npx skills add heygen-com/hyperframes --all`).
   - **Sind sie veraltet:** Nicht von dir aus aktualisieren. `skills update` holt die neueste Fassung,
     die neuer sein kann als die gepinnte CLI, und wirkt auf alle Projekte des Menschen. Nenne den Stand
     und den Befehl `npx --yes hyperframes@0.8.199 skills update`; der Mensch entscheidet.
   - **Sind sie aktuell:** Melde es und mach weiter.

4. **Mini-Render** (2 Sekunden, Funktionstest):

   ```bash
   node scripts/check-setup.mjs --render
   ```

   Das ist derselbe Check wie in Schritt 1 plus Render. Wenn Schritt 1 sauber war, reicht dieser Aufruf
   auch allein. Meldet doctor in Schritt 1 Chrome als fehlend, lädt Hyperframes beim ersten Render einen
   eigenen Chrome (chrome-headless-shell, rund 500 MB, einmalig nach `~/.cache/hyperframes/chrome/`).
   Sag das vorher. Ist Chrome schon vorhanden, wird nichts Großes geladen. Jeder Render braucht trotzdem
   Internet, weil die Kompositionen GSAP von cdn.jsdelivr.net laden und Schriften bei Bedarf von Google
   Fonts geholt werden (danach gecacht).

   Das MP4 landet unter `.studio/check/mini-render.mp4`. Das Skript prüft mit ffprobe, ob es
   1920x1080, 30 fps und 2.00 s hat, und meldet Fail, wenn nicht. Hyperframes legt dabei zusätzlich
   `scripts/mini-render/.hyperframes/` an (Render-Historie, per `.gitignore` ausgeschlossen, nicht löschen).
   Sieh dir zusätzlich einen Frame an:

   ```bash
   ffmpeg -y -v error -ss 1 -i .studio/check/mini-render.mp4 -frames:v 1 .studio/check/mini-render-1s.png
   ```

   Du solltest einen Ring und den Text "Dein Studio rendert." sehen.

5. **Festhalten.** Melde die Pass/Fail-Liste, die Hyperframes-Version, ob die offiziellen Skills
   installiert sind, und den Pfad des Test-MP4. Wenn etwas fehlt, nenne den konkreten nächsten Befehl.
   Danach geht es weiter mit dem Skill `brand-interview`.

## Die Befehle, die du im Studio immer brauchst

| Zweck | Befehl (im jeweiligen Kompositionsordner, Version aus `package.json`) |
| --- | --- |
| Komposition prüfen | `npx --yes hyperframes@0.8.199 check` (mit `--json` für Agenten) |
| Nur Lint | `npx --yes hyperframes@0.8.199 lint` |
| Einzelbilder ansehen | `npx --yes hyperframes@0.8.199 snapshot --at 1,3,5` (PNGs unter `.hyperframes/artifacts/snapshots/`) |
| Rendern (Wrapper) | `node scripts/render.mjs <beispiel-oder-pfad> [--quality draft\|looks\|delivery] [--vars '{...}'] [--png <s>]` |
| Rendern (direkt) | `npx --yes hyperframes@0.8.199 render --output out.mp4 --quality looks` |
| Vorschau im Browser | `npx --yes hyperframes@0.8.199 preview` (dann URL öffnen; Studio-Oberfläche von Hyperframes) |
| Umgebung | `npx --yes hyperframes@0.8.199 doctor`, Chrome nachladen: `npx --yes hyperframes@0.8.199 browser ensure` |

Setze `HYPERFRAMES_SKIP_SKILLS=1` in Skripten, damit die CLI nicht bei jedem Aufruf Skills prüft.

## Was du nicht tust

- Keine Konten anlegen, keine Schlüssel besorgen.
- Nichts als "installiert" oder "gerendert" melden, was du nicht ausgeführt und gesehen hast.
- Keine Hyperframes-Version hochziehen, ohne es zu sagen. Die Version steht in `package.json`
  (`hyperframes.version`, gelesen von allen Skripten) und ausgeschrieben in den Befehlen der Skills,
  in AGENTS.md und in den READMEs. Ein Upgrade ersetzt `0.8.199` überall per Suchen und Ersetzen und
  endet mit `node scripts/check-setup.mjs --render` plus Neu-Render der Beispiele.
- CLI-Ausgaben nicht wörtlich an den Menschen weitergeben, wenn sie Gedankenstriche enthalten;
  sinngemäß zusammenfassen.
