# Training: Live-Session und Abschluss

Ergänzung anhand von Eriks Screenshots vom 02.11.2026. Gestaltung und Texte folgen dem Personal OS; keine FIN-Assets erforderlich.

## Enthalten

- Live-Session mit aktuellem Satz, Referenzwerten, Gewicht, Wiederholungen, großen Speichertasten und Übungswechsel per Wischen oder Schaltfläche.
- Übungsliste mit aufklappbaren Karten, bestätigten Sätzen, Übungsnotizen, zusätzlichen Sätzen und Reihenfolge per Ziehen oder Pfeiltasten.
- Fortschrittsbalken und Timer: Anhalten/Fortsetzen, ±15 Sekunden, Überspringen. Der Timer ist an die Session gebunden und wird auf diesem Gerät über ein Neuladen hinweg gespeichert.
- Bestätigen speichert Gewicht, Wiederholungen und Satzstatus gemeinsam. Bei Fehlern bleiben Entwurf und Ansicht erhalten; kein falscher Erfolgshaken.
- Abschlussvorschau pro Übung, Volumen und optionale Anstrengung 1–10 mit Schieberegler. Erst „Training abschließen“ beendet die Session und speichert die Bewertung.
- Offene Sätze bleiben erhalten, zählen aber bei abgeschlossenen Sessions nicht in Auswertung, Rekorden und Charts. Reaktivieren zum Bearbeiten zeigt sie wieder.

## Vor dem Einsatz

Migration `supabase/migrations/0013_live_workout.sql` in der bestehenden Supabase-Datenbank ausführen, dann die Änderung bereitstellen. Sie ergänzt `is_done`, `effort_score`, Übungsnotizen, Reihenfolge und die RPC-Funktion zur atomaren Sortierung. Bestehende Satzzeilen bleiben als absolviert erhalten; neue Sätze starten offen. Keine Daten werden gelöscht.

Ohne Migration sperrt die neue Ansicht das Bestätigen vorhandener Sätze mit einem Hinweis. Die Migration ist im Repository vorbereitet, wurde in dieser Umgebung aber nicht gegen Eriks Supabase ausgeführt.

## Prüfung

`node --test tests/workoutFlow.test.mjs` prüft Wertebereiche, Eigengewicht, Dezimalgewichte, Satzreihenfolge, Legacy-Sätze und Vergleiche.

Zusätzlich TypeScript, gezieltes ESLint und Produktionsbuild. Ein angemeldeter Ende-zu-Ende-Test mit Supabase sowie ein visueller mobiler Browsercheck stehen aus; im Executor ist kein Playwright-Browser installiert.

## Web-Grenzen

Timer und Vibration unterliegen Browser- und Betriebssystembeschränkungen im Hintergrund. Es gibt keine native iPhone-Live-Activity, Apple-Watch-Steuerung oder garantierte Meldung bei gesperrtem Bildschirm.
