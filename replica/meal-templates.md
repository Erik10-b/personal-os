# Ernährung: persönliche Standardgerichte

## Gerichte und Mengen

Sechs vollständige, anpassbare Rezeptvorschläge stehen bereit: Quark mit Butterkeks-Müsli, Hähnchen-Reis-Curry, Hackfleisch-Nudeln, Brokkoli-Kohlrabi-Auflauf, Drillinge mit Ajvar-Sahne-Soße und Skyr-Pesto-Nudeln mit Hähnchengeschnetzeltem. Zutatenmengen, Portionszahlen und kurze Kochanleitungen sind hinterlegt.

Fehlende persönliche Mengen wurden als Vorschlag ergänzt. Nährwerte sind ausdrücklich Schätzwerte (Anzeige „ca.“ und Kennzeichnung im Tagebuch). Tatsächlich gegessene Mahlzeiten werden nicht automatisch gebucht. Die bekannten 500 g Quark bzw. 400 g Hähnchen für drei Curryportionen bleiben enthalten. Reis und Nudeln beziehen sich auf die Trockenmenge; Flüssigkeiten sind in ml mit Nährwerten je 100 ml geführt.

Alte gespeicherte Starter werden an leeren, namentlich passenden Zutatenfeldern ergänzt. Persönliche Mengen, ausgeschlossene Zutaten (0), Portionszahlen und Kochanleitungen bleiben erhalten. Eine vollständig leere „Proteinquelle“ im alten Drillinge-Vorschlag wird als Hähnchen vorgeschlagen. Bereits gebuchte Mahlzeiten behalten ihre damaligen Werte.

Cremefine ist als 7-%-Variante angenommen. Quellen für zwei Produktwerte (abgerufen 02.11.2026):
- https://www.rama.com/de-de/produkte/rama-cremefine/rama-cremefine-zum-kochen-7
- https://www.alpro.com/de-de/products/drinks/coconut-unsweetened-1l

Alle übrigen Nährwerte sind gerundete generische Schätzwerte. Eigene Packungsangaben können unter „Vorlage bearbeiten“ hinterlegt werden.

## Nutzung

Der runde Plus-Button öffnet die Gerichteauswahl. Gericht wählen, standardmäßig eine Portion oder ½, 1½, 2 bzw. eine eigene Menge bestätigen und eintragen. Alternativ kann die Auswahl über eine Gerichtkarte geöffnet werden. Die Vorschau berechnet Kalorien und Eiweiß unmittelbar neu. Zutatenmengen können nur für diesen Eintrag angepasst werden, ohne die Vorlage zu verändern. Nach einer Portionsänderung übernehmen die Zutatenfelder diese Portionierung.

„Zutaten & Zubereitung“ zeigt die Mengen für die ganze Zubereitung und die Kochanleitung. Die Vorlage lässt sich dauerhaft bearbeiten, einschließlich Anleitung und Einheiten. Zum Eintragen nach Gramm muss das gewogene Gesamtgewicht des fertigen Gerichts gespeichert sein. Roh- und Kochgewichte werden nicht gleichgesetzt.

„Wie am Vortag“ übernimmt einzelne Mahlzeiten unverändert. Einmalige Mahlzeiten können weiterhin manuell eingetragen werden. Der Server berechnet die Nährwerte aus der privaten Vorlage erneut; wiederholte Anfragen nach einem Netzwerkfehler verwenden denselben Eintragsschlüssel gegen doppelte Buchungen.

## Datenbank

Die bestehende Migration `supabase/migrations/0014_meal_templates.sql` wird benötigt: private Rezepttabelle mit RLS und Wiederholungsschutz. Für diese Optimierung ist keine weitere Migration erforderlich. Ohne 0014 bleiben Vorschau, Auswahl und Mengenänderung zugänglich; Speichern ist mit einem Hinweis gesperrt. Die manuelle Erfassung bleibt nutzbar. Die Migration wurde hier nicht gegen die persönliche Datenbank ausgeführt.

## Validierung

- `node --test tests/mealTemplates.test.mjs`: zwölf Tests, unter anderem Portionsrechnung, gewogenes Fertiggewicht, individuelle Zutatenmengen, Datums- und Eingabegrenzen sowie Ergänzung alter Vorlagen ohne Überschreiben persönlicher Angaben.
- React-DOM-Prüfung mit jsdom und simulierten Serveraktionen: Plus → sechs Gerichte → Portionen → Eintrag am ausgewählten Datum → Bestätigung; Fehler und Wiederholungsschutz; Vorschau und Schreibsperre bei fehlender Migration.
- Produktionsbuild, TypeScript und gezieltes ESLint.

Keine angemeldeten Ende-zu-Ende-Tests gegen die persönliche Supabase-Datenbank. Chromium konnte in dieser Umgebung nicht installiert werden; die DOM-Prüfung ersetzt keine visuelle Browserprüfung.
