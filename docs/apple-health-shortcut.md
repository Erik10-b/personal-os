# Apple Health → Personal OS

## Bereitstellen

1. Diesen Branch nach `master` übernehmen und das Vercel-Deployment abwarten.
2. Den gesamten Inhalt von `supabase/migrations/0015_health_shortcut.sql` einmal im Supabase SQL Editor ausführen. Die Migration lässt sich erneut ausführen und verändert keine bestehenden Trainings-, Ernährungs- oder Gewichtstabellen.
3. Im angemeldeten OS `/erik/health` öffnen (auch über Erik oder Ernährung erreichbar).
4. Verbindungsschlüssel erstellen. Den angezeigten Authorization-Header einmal in den iPhone-Kurzbefehl kopieren. Der rohe Schlüssel ist danach nicht erneut abrufbar; bei Verlust einen neuen erstellen.
5. Der Anleitung auf dieser Seite folgen und den ersten Import am entsperrten iPhone testen.

Die vollständige, mobil lesbare Einrichtung einschließlich Automationen und optionaler Felder steht direkt im Health-Bereich. Es wird **kein bereits signierter oder installierter Apple-Kurzbefehl** mitgeliefert: Er muss einmal in der App „Kurzbefehle“ angelegt werden. Der echte Health-Zugriff und die Aktionsbezeichnungen müssen auf dem jeweiligen iPhone geprüft werden.

## Einfachster Kurzbefehl: Schritte

- Aktuelles Datum einmal erfassen und zweimal formatieren: `yyyy-MM-dd` als `Tag`, ISO 8601 einschließlich Uhrzeit und Zeitzone als `Zeitpunkt`.
- Health-Daten suchen: Typ Schritte, Startdatum heute, genau eine Gerätequelle, ohne Begrenzung.
- Bei leerem Ergebnis Hinweis anzeigen und abbrechen. Fehlende Berechtigung ist kein gemessener Nullwert.
- Aus allen gefundenen Samples den Wert lesen, Summe berechnen, ganzzahlig runden → `Schritte`.
- Inhalte von URL abrufen: `https://personal-os-eight-chi.vercel.app/api/health/sync`, Methode POST, Header `Authorization` mit dem kopierten `Bearer …`, Anfragetext JSON.

| Feld | Typ in Kurzbefehle | Inhalt |
| --- | --- | --- |
| date | Text | Variable Tag |
| observed_at | Text | Variable Zeitpunkt |
| source | Text | Gewählte Quelle, z. B. Apple Health – iPhone |
| steps | Zahl | Variable Schritte |

Danach aus der Antwort den Wörterbuchwert `message` lesen und anzeigen. Nicht bei jeder HTTP-Antwort pauschal Erfolg melden.

Optional `active_kcal` (Summe heutiger Aktivitätsenergie, kcal) und `weight_kg` (neueste heutige Messung, kg) als Zahlen senden. Fehlende Werte ganz weglassen. Keine Ruheenergie in `active_kcal` aufnehmen. Wenn die optionalen Felder dynamisch hinzugefügt werden, ein Wörterbuch aufbauen, in Text/JSON umwandeln und als Datei-Anfragetext mit `Content-Type: application/json` senden. Die Aktionsverkettung auf dem iPhone zunächst manuell testen.

Mehrere Geräte können überlappende Health-Samples liefern. Die einfache Summe eines Kurzbefehls ersetzt **nicht** Apples quellenübergreifende Bereinigung. Pro Messwert genau eine Quelle verwenden und das erste Ergebnis in Health gegenprüfen. Gerätewechsel erfordern eine Anpassung des Filters. Ein späterer Garmin-Import ist nur enthalten, soweit Garmin diese Werte tatsächlich in Health bereitstellt.

## Datenverhalten

- Tagesstände werden ersetzt, nicht addiert. Ältere oder identische `observed_at`-Zeitpunkte ändern keinen gespeicherten Stand.
- Nicht mitgesendete Messwerte bleiben unverändert. Der angezeigte Zeitpunkt ist der letzte Tagesimport, nicht zwingend die Erfassungszeit jedes einzelnen Messwertes.
- Ein heutiger Import ist ein Zwischenstand. Für vollständige vergangene Tage zusätzlich „gestern“ mit passendem `date` übertragen. Daten können für die letzten 30 Tage nachgetragen werden; der Übertragungszeitpunkt darf höchstens 31 Tage alt sein. Ein Tag Zukunft ist für lokale Zeitzonen erlaubt, der tatsächliche Zeitstempel höchstens fünf Minuten.
- Die Übersichtsseite verwendet Europe/Berlin. Der Shortcut muss die Tagesgrenzen und `date` konsistent aus seiner lokalen Zeitzone ableiten; bei Reisen können Ansichten abweichen.
- Keine automatischen Änderungen des Kalorienziels, keine zusätzlichen Trainingskalorien und keine doppelten Trainingseinheiten. Health-Gewichte bleiben separat von manuell eingetragenem Gewicht.
- Hintergrundautomationen sind durch iOS/Health gesperrte Geräte und Berechtigungen eingeschränkt. „Letzter Kontakt“ zeigt nur einen tatsächlich erfolgreichen Request, keine Garantie für zukünftige Läufe.

## Zugriff

Der 256-Bit-Schlüssel ist nur zum Schreiben der drei Messwerte berechtigt. In der Datenbank liegt dessen SHA-256-Hash. Rotation/Widerruf erfolgt im angemeldeten Benutzerkonto. Der Schlüssel kann weder Daten lesen noch ein Zielkonto angeben. Eine eng begrenzte SQL-Funktion ordnet ihn seinem Besitzer zu; RLS isoliert die Tabellen. Es wird kein Supabase-Service-Role-Key benötigt. Requests dürfen nur JSON mit höchstens 4096 Bytes senden. Der Endpoint protokolliert weder Schlüssel noch Payloads. Health-Werte werden nicht an eine KI geschickt.

Den eingerichteten Kurzbefehl nicht mitsamt Schlüssel teilen. Das Trennen der Verbindung widerruft den Schlüssel, löscht aber nicht die importierte Historie.

## Prüfung

```sh
node --test tests/healthSync.test.mjs
npx tsc --noEmit
npm run build
```

Die PostgreSQL-Integration läuft optional mit PGlite, ohne zusätzliche Produktionsabhängigkeit:

```sh
npm install --prefix /tmp/health-pg --no-package-lock @electric-sql/pglite
PGLITE_MODULE=/tmp/health-pg/node_modules/@electric-sql/pglite/dist/index.js node --test tests/healthDatabase.test.mjs
```

Die Tests prüfen wiederholte Migration, anonyme Leseverbote, Benutzertrennung, fehlende/ungültige Schlüssel, Rotation/Widerruf, doppelte und verspätete Übertragungen sowie Teilupdates. Echte HealthKit-Daten und iOS-Automationen benötigen den abschließenden Test auf dem iPhone.
