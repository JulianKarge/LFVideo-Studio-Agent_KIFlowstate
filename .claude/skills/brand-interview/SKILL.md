---
name: brand-interview
description: Kompaktes Marken-Interview, das die Demo-Marke durch die eigene ersetzt. Schreibt brand/tokens.json, identity.md und motion.md, erzeugt tokens.css und prüft das Ergebnis an einem gerenderten Beispiel. Nutze ihn beim Onboarding oder wenn sich die Marke ändert.
---

# brand-interview

Ziel: `brand/` beschreibt die Marke des Menschen, nicht mehr die Demo-Marke "Fjordlicht". Jede
Farbe, Schrift und jeder Radius steht genau einmal in `brand/tokens.json`; Texte in `identity.md` und
`motion.md` erklären das Warum.

## Vorher lesen

`brand/tokens.json`, `brand/identity.md`, `brand/motion.md`. Die Fragen in Klammern in `identity.md`
sind dein Interviewleitfaden.

## Interview (kompakt, in zwei Runden)

Runde 1, fünf Fragen in einer Nachricht:

1. Wie heißt deine Marke oder dein Kanal, und gibt es einen Satz, der sie beschreibt?
2. Wer schaut zu, und was soll die Person nach dem Video können?
3. Wie klingst du: ruhig oder energisch, knapp oder ausführlich, Du oder Sie?
4. Hast du schon Logo, Farben (Hex-Werte) oder Schriften? Wenn ja, nenn sie.
5. Nenn zwei oder drei Videos, Kanäle oder Websites, deren Look dir gefällt, und was genau daran.

Runde 2 nur, wenn nötig: Formate (16:9, 9:16), Do und Don't, Dinge, die nie passieren sollen.

Wenn noch keine Identität existiert, schlage **zwei bis drei Richtungen** vor, jede mit Name,
Grundfarbe, Akzent, Display- und Fließschrift und einem Satz zur Wirkung. Lass wählen. Erfinde keine
komplette Identität stillschweigend und übernimm nie eine fremde Marke als die des Menschen.

## Tokens schreiben

1. Trage die Antworten in `brand/tokens.json` ein. Pflicht: `color.bg`, `color.surface`, `color.text`,
   `color.accent`, `color.accent-2`, `color.on-accent`, `color.muted`, `color.line`, `color.surface-2`, `font.display`, `font.body`, `radius.*`.
   Setze `brand.is_demo` auf `false` und `brand.updated` auf das heutige Datum.
2. Kontrast prüfen: Text auf Grund und Text auf Fläche mindestens 4.5:1, `on-accent` auf `accent`
   mindestens 4.5:1. Rechne es nach oder lass `npx --yes hyperframes@0.8.199 check` die Kontrastprüfung
   an einem Beispiel machen.
3. Schriften: Outfit, Inter, Montserrat, Nunito, Oswald, Space Mono, IBM Plex Mono, JetBrains Mono,
   EB Garamond, Playfair Display, Source Code Pro, Roboto, Open Sans, Lato, Poppins (und einige mehr)
   bringt Hyperframes mit, sie brauchen keine Datei. Jede andere Schrift: Datei nach
   `library/<beispiel>/assets/fonts/` legen, `@font-face` in das Beispiel, Lizenz in `LICENSES.md`.
   Schriften ohne klare Lizenz kommen nicht ins Studio.
4. CSS erzeugen und in alle Beispiele kopieren:

   ```bash
   node scripts/build-tokens.mjs
   ```

5. `brand/identity.md` und `brand/motion.md` auf die Marke umschreiben (Demo-Hinweis oben entfernen,
   Platzhalterfragen auflösen). `brand/preferences.md` bleibt leer bis auf die Vorlage.

## Beweis am Beispiel

Rendere ein Beispiel mit den neuen Tokens und zeig das Bild:

```bash
node scripts/render.mjs lower-third --quality draft --png 3.5
```

Das PNG liegt neben dem MP4 in `library/lower-third/previews/`. Wenn der Mensch zwei Richtungen
vergleichen will, lege die zweite als `brand/examples/tokens-<name>.json` ab und rendere mit
`--tokens brand/examples/tokens-<name>.json --output library/lower-third/previews/<name>.mp4`. Der Quelltext
des Beispiels ändert sich dabei nicht.

## Festhalten

Melde, welche Werte gesetzt wurden, welche Fragen offen sind (zum Beispiel "Logo folgt"), und wo das
Vorschaubild liegt. Offene Punkte stehen unten in `identity.md`. Danach weiter mit `motion-library`.
