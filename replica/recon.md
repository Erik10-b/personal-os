# Recon map: fin fitnesstracker (iOS)

Scope: einzelne Ideen für den Bereich Training im Personal OS, kein vollständiger Klon
For: Erik, privat
Date: 2026-11-02

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | App-Store-Eintrag (DE) | https://apps.apple.com/de/app/fin-fitnesstracker/id6797734161 | Beschreibung, Versionshistorie 1.0–2.6.9, Preise, Datenschutz, 4 sichtbare Rezensionen (4,9 ★ aus 416) |

Entwickler: Tim Bodon (gymmittim). Krafttraining kostenlos, „fin Deluxe“ per Abo.

## Core loop

Sätze mit Gewicht und Wiederholungen loggen, dabei den letzten Wert sehen und den Fortschritt verfolgen.

## Features laut Listing → Übertrag ins Personal OS

| fin | Personal OS | Status |
| --- | --- | --- |
| „Letzter Satz“ zum Vergleich während des Trainings | Wert des letzten Mals pro Satz unter der Satznummer | gebaut |
| Satz abhaken + Pausentimer (Sperrbildschirm, Watch) | Haken pro Satz startet Pausentimer; ±15 s, merkt sich die Länge, Vibration + Ton am Ende | gebaut (im Browser, ohne Sperrbildschirm) |
| Vorschläge für den nächsten Satz, Wdh.-Bereiche pro Übung | Vorschlag pro Übung per doppelter Progression (6–10 Wdh., dann +2,5 kg) | gebaut, Bereich fest |
| Fortschritts-Dashboard mit geschätzter Maximalkraft | 1RM (Epley) bei Bestleistungen und als Diagramm-Umschalter | gebaut |
| Streaks, Ruhe-/Krankheitstage brechen sie nicht | Wochen-Streak: Wochen in Folge mit ≥ 1 Training | gebaut |
| Gesamtvolumen, persönliche Rekorde | Insights pro Session (Volumen, Δ, PRs) | gebaut |
| Workouts mit Freunden teilen | Teilen-Karte als Bild | gebaut |
| Aufwärm- (A) und Drop-Sätze, RIR/RPE | bräuchte eine Spalte in `workout_sets` | Idee, braucht Migration |
| Übung austauschen im Training und im Plan | | Idee |
| Readiness aus Schlaf/Puls, Apple Health, Watch, Garmin | keine Gesundheitsdaten im Web | skip |
| Ernährung (Rezeptbuch, Barcode, Makros) | Ernährung-Modul existiert schon | später vergleichen |

## Clean room

Nur Funktionen aus der öffentlichen Beschreibung. Keine Screenshots, Texte, Icons oder Farben von fin übernommen; Optik folgt dem Personal-OS-Design.
