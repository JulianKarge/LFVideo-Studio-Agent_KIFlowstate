# Onboarding-Prompt

Kopiere den Text unten in eine neue Claude-Code- oder Codex-Sitzung, die du in diesem Ordner
(`my-video-studio/`) geöffnet hast. Der Prompt ist derselbe wie auf der Website und funktioniert
ohne das Video.

<!-- TODO(release): Link zur Website-Seite mit der Prompt-Karte eintragen. -->

```text
Hilf mir, in diesem Ordner mein eigenes, wiederverwendbares KI-Video-Studio einzurichten.
Ich nutze bereits Claude Code oder Codex. Lies zuerst AGENTS.md, dann arbeite die Skills
in dieser Reihenfolge ab und prüfe jeden Schritt, bevor du ihn als erledigt meldest:

1. Skill studio-setup: Prüfe Betriebssystem, Node, FFmpeg und die gepinnte Hyperframes-Version
   mit scripts/check-setup.mjs. Installiere nichts selbst, zeig mir stattdessen die fehlenden
   Befehle. Installiere die offiziellen Hyperframes-Skills nach dem aktuell dokumentierten Weg
   und rendere den 2-Sekunden-Funktionstest. Sag mir, was der erste Render herunterlädt.

2. Skill brand-interview: Frag mich kompakt nach Marke, Zielgruppe, Ton, Farben, Schriften und
   Beispielen, die mir gefallen. Die mitgelieferte Marke "Fjordlicht" ist nur eine Demo; meine
   Antworten ersetzen sie in brand/tokens.json, identity.md und motion.md. Wenn ich noch keine
   Identität habe, schlag mir zwei bis drei klare Richtungen vor. Erzeuge danach tokens.css.

3. Skill motion-library: Rendere die drei Beispiele (lower-third, point-graphic,
   floating-preview) mit meiner Marke, zeig mir je ein Vorschaubild, nimm mein Feedback auf
   und setze freigegebene Beispiele in library/index.json auf approved.

4. Optional: Biete ElevenLabs als Audio-Modul an. Erkläre Nutzen und Kostenart, bevor etwas
   kostet. Der Schlüssel kommt nur in .env, nie in den Chat. Meine eigene Stimme bleibt;
   Transkripte und Zeitmarken sind der Standardnutzen.

5. Skill edit-recording: Führe mich zu einer kurzen Testaufnahme (20 bis 40 Sekunden) mit
   getrennter Kamera- und Bildschirm-Datei und separatem Mikrofon. Miss den Versatz, lege
   projects/first-video an, plane den Schnitt (Kamera voll, Kamera klein oben rechts, eine
   Punkt-Grafik, Abschluss) und liefere ein geprüftes MP4 mit Ton.

6. Speichere nur ausdrücklich bestätigte Vorlieben in brand/preferences.md. Projektbezogene
   Korrekturen bleiben im Projekt. Schreib am Ende in PROJECT.md, was fertig ist und was als
   Nächstes kommt.

Frag nur nach Angaben, die das Ergebnis wesentlich verändern. Behaupte keine Installation,
Verbindung oder Prüfung, die du nicht tatsächlich durchgeführt hast. Beginne jetzt mit dem
Skill studio-setup.
```
