# Lizenzen

Dieses Paket bündelt keine Schriftdateien, keine Musik, keine Icons von Dritten und kein fremdes
Footage. Alles Sichtbare in den Beispielen ist selbst erzeugt (HTML, CSS, Inline-SVG). Die folgenden
Abhängigkeiten werden zur Laufzeit geladen oder sind Teil von Hyperframes.

## Hyperframes

- Projekt: https://github.com/heygen-com/hyperframes
- Lizenz: Apache-2.0 (Feld `license` des npm-Pakets `hyperframes@0.8.199`, geprüft am 2026-10-25).
- Verwendung: wird über `npx --yes hyperframes@<version>` geladen, nicht im Paket enthalten.

## GSAP

- Projekt: https://gsap.com
- Lizenz: GSAP Standard License, seit 2025 kostenlos für kommerzielle und private Nutzung
  (https://gsap.com/licensing/).
- Verwendung: `<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js">` in jedem Beispiel,
  wie im Hyperframes-Scaffold.

## Schriften

Die Demo-Marke nutzt Outfit, Inter und JetBrains Mono, das zweite Demo-Treatment Playfair Display, Lato
und IBM Plex Mono. Alle sechs stehen unter der SIL Open Font License 1.1 und werden von Hyperframes
mitgebracht bzw. bei Bedarf von Google Fonts nachgeladen und lokal gecacht. Es liegen keine Font-Dateien
im Paket.

- Outfit: https://fonts.google.com/specimen/Outfit (OFL 1.1)
- Inter: https://fonts.google.com/specimen/Inter (OFL 1.1)
- JetBrains Mono: https://fonts.google.com/specimen/JetBrains+Mono (OFL 1.1)
- Playfair Display: https://fonts.google.com/specimen/Playfair+Display (OFL 1.1)
- Lato: https://fonts.google.com/specimen/Lato (OFL 1.1)
- IBM Plex Mono: https://fonts.google.com/specimen/IBM+Plex+Mono (OFL 1.1)

Wenn du eigene Schriften nach `library/<beispiel>/assets/fonts/` legst, trage hier Name, Quelle und Lizenz ein und lege
die Lizenzdatei daneben (`OFL.txt` oder die Lizenz deines Anbieters).

## Demo-Medien

`library/floating-preview/assets/demo-website.png` ist aus `library/floating-preview/demo-source/index.html`
gerendert (eigene Komposition, keine fremden Inhalte). Alle Texte, Namen und die Marke "Fjordlicht"
sind erfunden.

## Dieses Paket

Die Dateien dieses Pakets (Skripte, Skills, Beispiele, Texte) stehen unter der MIT-Lizenz, siehe
`LICENSE`. Du darfst sie für deine eigenen Videos frei verwenden, verändern und weitergeben.
