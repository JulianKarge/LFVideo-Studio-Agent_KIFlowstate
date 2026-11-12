# AGENTS.md: Arbeitsvertrag deines Video-Studio-Agenten

Du bist der Studio-Agent in diesem Ordner. Der Ordner ist ein wiederverwendbares Video-Studio:
eine Marke (`brand/`), eine Bibliothek fertiger Motion-Beispiele (`library/`), ein Ordner pro
Produktion (`projects/`) und vier Skills, die die wiederkehrenden Arbeiten beschreiben.
Render-Engine ist Hyperframes (HTML wird Frame für Frame zu Video gerendert). Diese Datei ist die
Quelle der Wahrheit; `CLAUDE.md` importiert sie nur.

## Zuerst lesen, dann handeln

1. Lies `brand/identity.md`, `brand/motion.md` und `brand/preferences.md`, bevor du etwas gestaltest.
   Farben, Schriften, Radien kommen ausschließlich aus `brand/tokens.json` (als CSS aus
   `brand/tokens.css`). Erfinde keine zweite Palette und schreibe keine Farbwerte in Quelltexte.
2. Jede Produktion ist ein Ordner unter `projects/<name>/` mit `PROJECT.md` (Brief, Umfang, Stand,
   nächster Schritt) und `project.json` (Dateipfade, Versatz, Auflösung, fps). Lies beide, bevor du an
   einem bestehenden Projekt weiterarbeitest. Neue Projekte entstehen aus `projects/_template/`.
3. `library/index.json` sagt, welche Beispiele es gibt, wofür sie gedacht sind, welche Variablen sie
   haben, wie sie gerendert werden und ob sie freigegeben sind (`status`). Nutze freigegebene
   Beispiele, bevor du etwas Neues baust.

## Umfang klären, bevor du Material anfasst

- Frage oder lies im Projekt, ob ein **kompletter Schnitt** (Kamera und Bildschirm zusammensetzen,
  Kürzen, Grafiken, Ton) oder nur **Grafik-Overlays** auf einem fertigen Schnitt gewünscht sind.
  Mache nur, was beauftragt ist. Keine Füllwort-Entfernung, kein Grading, keine Untertitel, keine
  Shorts, nur weil eine Datei im Ordner liegt.
- Originale bleiben unverändert in `projects/<name>/inputs/`. Alles Neue entsteht daneben
  (`graphics/`, `previews/`, `exports/`, `transcripts/`).
- Kamera- und Bildschirmaufnahmen sind getrennte Dateien. Es gibt genau eine Sprachspur als Master
  (meist das separate Mikrofon). Der gemessene Versatz steht in `project.json`, bevor geschnitten wird.

## "Ändere das" ist nicht "Merk dir das"

- Eine Korrektur am aktuellen Projekt ("mach die Karte kleiner") gilt nur dort. Notiere sie in
  `PROJECT.md` des Projekts.
- Nur wenn ausdrücklich gesagt wird, dass etwas **ab jetzt immer** gelten soll ("merk dir das",
  "ab jetzt immer so"), schreibst du einen Eintrag in `brand/preferences.md` (Datum, Regel, Anlass).
- Verallgemeinere nie stillschweigend. Ein einmaliges Feedback ist keine Markenregel. Im Zweifel fragen.

## Fertig heißt geprüft

Ein Render, der ohne Fehler durchläuft, ist noch kein Ergebnis. Fertig heißt:

- Es gibt ein echtes MP4 (`ffprobe` zeigt die richtige Auflösung, die richtigen fps, die erwartete
  Dauer, und eine Tonspur, wenn Ton dazugehört).
- Du hast den ersten und den letzten Frame und mindestens einen Frame pro Grafik als Bild angesehen.
- Text ist lesbar, nichts ist abgeschnitten, Grafiken liegen nicht über Gesichtern oder wichtigen
  Bildschirminhalten.
- Bei Schnitten: Ton und Lippenbewegung passen, nichts knackt an Schnittkanten, Wörter sind ganz.
- Du hast in `PROJECT.md` festgehalten, was gerendert wurde, wo es liegt, was offen ist.

## Schlüssel, Kosten, Ehrlichkeit

- API-Schlüssel (zum Beispiel `ELEVENLABS_API_KEY`) stehen nur in `.env`. Nie im Chat zeigen,
  nie in Dateien schreiben, die in Git landen. `.env` ist in `.gitignore`.
- Alles, was Geld oder Kontingent kostet (ElevenLabs-Aufrufe, Cloud-Renders), nennst du vorher
  mit dem Grund. Lokale Hyperframes-Renders kosten nichts.
- Behaupte nichts, was du nicht geprüft hast: keine "installiert", "verbunden", "gerendert", ohne den
  Befehl tatsächlich ausgeführt und das Ergebnis gesehen zu haben. Wenn etwas nicht geht, sag es
  und nenne den nächsten konkreten Schritt.
- Lege keine Konten an, besorge keine Schlüssel und versprich keine Renderzeiten. Das macht der
  Mensch am Rechner.

## Hyperframes in Kürze

Der vollständige Vertrag steht in den offiziellen Hyperframes-Skills (installiert der Skill
`studio-setup`). Die Mindestregeln, auch ohne diese Skills:

- Ein Projekt ist ein Ordner mit `index.html`. Die Wurzel hat `data-composition-id`, `data-width`,
  `data-height`, `data-duration`. Jedes zeitlich gesteuerte Element hat `class="clip"`, `data-start`
  und `data-duration` in Sekunden.
- Es gibt genau eine pausierte GSAP-Timeline pro Komposition: `window.__timelines["<id>"] = tl`.
  Keine `Date.now()`, kein `Math.random()`, keine Timer, kein `repeat: -1`, kein `play()` auf Medien.
- Prüfen: `npx --yes hyperframes@<version> check` im Projektordner. Rendern: `node scripts/render.mjs <ziel>`
  (Wrapper um `npx --yes hyperframes@0.8.199 render` mit Ausgabepfad-Konvention). Einzelbilder: `--png <sekunde>` oder
  `npx --yes hyperframes@0.8.199 snapshot --at <sekunden>`. Die Version steht in `package.json` (`hyperframes.version`).
- Variablen (`data-composition-variables`, `data-var-text`, `data-var-src`) für Text und Medienpfade;
  Marken-Werte nur über `var(--color-...)`, `var(--font-...)`, `var(--radius-...)` aus dem Token-Block,
  den `node scripts/build-tokens.mjs` in jede Komposition schreibt. Der Block muss im Dokument stehen
  (kein `<link>`), sonst lädt Hyperframes die Schriften der Marke nicht.

## Skills

| Skill | Wann |
| --- | --- |
| `studio-setup` | Erster Start, Werkzeug-Check, Mini-Render, offizielle Hyperframes-Skills installieren |
| `brand-interview` | Eigene Marke erfassen, `brand/tokens.json` schreiben, `tokens.css` erzeugen |
| `motion-library` | Beispiel bauen oder anpassen, Vorschau, Feedback, Freigabe in `library/index.json` |
| `edit-recording` | Aufnahme-Intake, Sync-Messung, Schnittplan, Render, Prüfung |

Die Skills liegen doppelt vor: `.claude/skills/` (Claude Code) und `.agents/skills/` (Codex), gleicher
Inhalt. Beginne beim Onboarding mit `studio-setup`.

## Sprache

Alles, was der Mensch liest (Chat, Notizen, Texte im Video), ist Deutsch in der Du-Form, es sei denn,
die Marke legt etwas anderes fest (`brand/identity.md`). Code, Dateinamen und Variablen sind Englisch.
Keine Gedankenstriche in Texten; Kommas und Punkte reichen.
