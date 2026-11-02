# Ernährung: persönliche Standardgerichte

## Vorbereitet

- Quark mit Crunchy Butterkeks Müsli und Flohsamenschalen
- Hähnchen-Reis-Curry
- Hackfleisch-Nudeln
- Brokkoli-Kohlrabi-Auflauf
- Drillinge mit Ajvar-Sahne-Soße
- Skyr-Pesto-Nudeln mit Hähnchengeschnetzeltem

Bekannte Mengen sind vorbelegt (z.B. 500 g Quark und 400 g Hähnchen für 3 Curryportionen). Fehlende Mengen, Portionszahlen und Produktnährwerte werden nicht geschätzt. Alle sechs Vorlagen sind deshalb zunächst unvollständig; es wurde keine gegessene Mahlzeit ohne Mengenangaben automatisch gebucht.

## Nutzung

Einmal „Einrichten“ öffnen. Entweder bekannte Nährwerte der gesamten Zubereitung eintragen oder Zutatenmengen und Produktwerte je 100 g hinterlegen. Bei Mealprep die Anzahl der Portionen angeben. Nicht verwendete Zutaten entfernen oder auf 0 g setzen. Unvollständige Vorlagen können gespeichert, aber noch nicht geloggt werden.

Danach ½, 1, 1½ oder 2 Portionen wählen und direkt eintragen. Unter „Mengen ändern“ können einzelne gegessene Zutatenmengen angepasst werden, ohne die Vorlage zu ändern. Zum Eintragen nach Gramm muss das gewogene Gesamtgewicht des fertigen Gerichts gespeichert sein. Roh- und Kochgewichte werden nicht gleichgesetzt.

Bereits gebuchte Mahlzeiten behalten ihre damaligen Nährwerte, auch wenn die Vorlage später geändert wird. „Wie am Vortag“ übernimmt einzelne Mahlzeiten unverändert. Einmalige Mahlzeiten können weiterhin manuell eingetragen werden.

## Einmalige Einrichtung

`supabase/migrations/0014_meal_templates.sql` im Supabase SQL Editor des vorhandenen Projekts ausführen und dann den PR mergen. Die Migration ergänzt eine private Rezepttabelle mit RLS und einen Wiederholungsschutz für Einträge. Keine vorhandenen Daten werden gelöscht oder überschrieben. Die Migration wurde hier nicht gegen die persönliche Datenbank ausgeführt.

Ohne die neue Tabelle bleibt der Ernährungstab mit vorbereiteten Gerichten und Hinweis erreichbar; Speichern und Schnellbuchung sind bis zur Migration gesperrt. Die bisherige manuelle Erfassung bleibt nutzbar.

## Validierung

`node --test tests/mealTemplates.test.mjs`: neun Tests für vorbereitete Gerichte, Portionsrechnung, gewogenes Fertiggewicht, individuelle Zutatenmengen, unvollständige Angaben, Grenzen und Datumsvalidierung. Produktionsbuild, TypeScript und gezieltes ESLint erfolgreich. Keine angemeldeten Ende-zu-Ende-Tests gegen Supabase oder visuellen Browsertests in dieser Umgebung.
