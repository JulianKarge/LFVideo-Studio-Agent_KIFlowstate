# Projekt: <Name>

Angelegt: JJJJ-MM-TT. Stand: <ein Satz, zum Beispiel "Intake abgeschlossen, Schnittplan offen">.

## Brief

- Ziel des Videos: <ein bis zwei Sätze>
- Format: <zum Beispiel YouTube 16:9, 1920x1080, 30 fps>
- Länge (geplant): <Sekunden oder Minuten>
- Zielgruppe und Ton: siehe `brand/identity.md`, Abweichungen hier notieren.

## Umfang (vereinbart)

- [ ] Kompletter Schnitt (Kamera und Bildschirm zusammensetzen, kürzen, Grafiken, Ton)
- [ ] Nur Grafik-Overlays auf einem fertigen Schnitt
- Ausdrücklich NICHT beauftragt: <zum Beispiel Füllwort-Entfernung, Grading, Untertitel, Shorts>

## Material (`inputs/`, Originale bleiben unverändert)

| Datei | Rolle | Auflösung / fps | Dauer | Ton |
| --- | --- | --- | --- | --- |
| `inputs/camera.mp4` | Kamera | | | |
| `inputs/screen.mp4` | Bildschirm | | | |
| `inputs/mic.wav` | Mikrofon (Master-Sprachspur) | | | |

Versatz (gemessen mit `node scripts/sync-offset.mjs`, Referenz = Kamera):

- Bildschirm: <+/- s>, Vertrauen <0 bis 1>
- Mikrofon: <+/- s>, Vertrauen <0 bis 1>
- Sichtprüfung am Klatscher oder einer Lippenbewegung: <Ergebnis>

## Schnittplan

| Nr | Von (Kamera-Zeit) | Bis | Lage | Grafik | Notiz |
| --- | --- | --- | --- | --- | --- |
| 1 | 0.0 | | Kamera voll | | Hook |
| 2 | | | Kamera klein oben rechts, Bildschirm voll | | |
| 3 | | | | point-graphic | |
| 4 | | | Kamera voll | | Abschluss |

## Grafiken (`graphics/`)

| Grafik | Quelle in der Bibliothek | Variablen | Status |
| --- | --- | --- | --- |

## Renders

| Datei | Dauer | Auflösung / fps | Ton | Geprüft (erster/letzter Frame, Stichproben) |
| --- | --- | --- | --- | --- |

## Projektbezogene Korrekturen

(Hier landen Änderungswünsche, die nur für dieses Video gelten. Allgemeine Regeln kommen nach
`brand/preferences.md`, aber nur auf ausdrücklichen Wunsch.)

## Offen / nächster Schritt

- <der eine nächste Schritt>
