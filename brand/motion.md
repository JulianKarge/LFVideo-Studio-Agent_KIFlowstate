# Motion-Regeln

> Demo-Werte der Marke "Fjordlicht". Die Zahlen stehen auch in `brand/tokens.json` unter `motion` und
> landen als `--motion-*` in `tokens.css`. Ändere sie dort; diese Datei erklärt das Warum.

## Grundhaltung

Bewegung erklärt, sie unterhält nicht. Jede Animation hat einen Grund: etwas erscheint, weil es
gerade gesagt wird; etwas verschwindet, weil der Gedanke abgeschlossen ist. Keine Bewegung "damit sich
etwas tut".

## Easing

- Eingänge: `power3.out` (schnell los, weich ankommen).
- Ausgänge: `power3.in` (weich los, zügig weg).
- Bewegungen von A nach B (Kamera-Karten, Verschiebungen): `power2.inOut`.
- Kein `bounce`, kein `elastic`, kein `back` mit Überschwingen.

## Dauern

| Token | Wert | Wofür |
| --- | --- | --- |
| `--motion-duration-fast` | 0.25 s | Kleine Elemente: Chips, Badges, Linien |
| `--motion-duration-base` | 0.6 s | Textzeilen, Karten, Standard-Eingang |
| `--motion-duration-slow` | 1.1 s | Große Karten, Kamera-Bewegungen, Szenenwechsel |

Lesezeit: Ein Satz braucht mindestens 2.5 s Stand, eine Karte mit drei Punkten mindestens 4 s, nachdem
der letzte Punkt erschienen ist.

## Eingänge und Ausgänge

- Elemente kommen gestaffelt: 0.12 bis 0.2 s Abstand zwischen Zeilen oder Punkten.
- Ausgänge sind kürzer als Eingänge und in umgekehrter Reihenfolge.
- Eine Grafik ist vollständig verschwunden, bevor die Komposition endet (letzter Frame zeigt nur Grund).
- Keine Opazitäts- oder Sichtbarkeits-Tweens auf `.clip`-Elementen; immer das Kind animieren.

## Kamera (Facecam und Bildschirm)

- Zwei Lagen: Kamera voll (Hook, persönliche Passagen) und Kamera klein oben rechts (etwa 25 Prozent
  der Breite, enger Hochkant-Ausschnitt), während der Bildschirm erklärt wird.
- Wechsel nur an Sinnbrüchen, nicht nach festen Sekunden. Übergang 1.1 bis 1.5 s mit `power2.inOut`,
  gleichmäßige Skalierung des Bildes (keine Verzerrung), gleichbleibender Eckradius.
- Die kleine Kamera deckt nie den Bildschirminhalt ab, über den gerade gesprochen wird. Im Zweifel
  Position wechseln (oben links) statt verkleinern.
- Grafiken erscheinen erst, wenn die Kamera-Karte ihre Position erreicht hat.

## Räumliche Vorschauen

Website- oder App-Vorschauen stehen als leicht gedrehte Karte (rotationY 6 bis 14 Grad,
perspective um 2200 px), driften langsam weiter und kommen nie zum Stillstand, solange sie sichtbar sind.
Der Inhalt der Karte scrollt langsam, damit die Vorschau lebendig wirkt.

## fps und Format

30 fps, 1920 mal 1080. Beispiele sind 8 bis 10 s lang und können im Projekt gekürzt oder verlängert
werden (`data-duration` an der Wurzel plus Ausgangszeiten in der Timeline).
