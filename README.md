# Personal OS

Privater Organizer für eine Person — fünf Bereiche, eine zentrale Datenbank, synchron auf Handy und Laptop nutzbar.

## Module

- **Finanzielles** — Einnahmen/Ausgaben mit Kategorien und Auswertungen
- **Erik** — Habit-Tracker, Gewichtstracker, persönliche To-Do's
- **Termine** — Kalendereinträge
- **Arbeit/Master** — Notizen und Aufgaben
- **Fußball** — Trainingsplan (geteilte Termine-Struktur) + Spielstatistik

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, TypeScript)
- [Supabase](https://supabase.com) (Postgres + Auth, RLS pro Tabelle)
- [recharts](https://recharts.org) für Diagramme

## Setup

1. Supabase-Projekt anlegen (EU-Region empfohlen), Email/Passwort-Auth aktivieren, einen User manuell anlegen (kein öffentliches Sign-up).
2. SQL-Migrationen ausführen: `supabase/migrations/0001_init.sql`, dann `0002_rls.sql` (z.B. über den Supabase SQL-Editor).
3. `.env.local` aus `.env.local.example` erstellen und mit den Supabase-Projekt-Keys befüllen.
4. `npm install && npm run dev`, dann [http://localhost:3000](http://localhost:3000) öffnen.

## Deployment

Repo zu GitHub pushen, in Vercel importieren, dieselben `NEXT_PUBLIC_SUPABASE_*`-Env-Vars im Vercel-Projekt setzen. In Supabase unter Authentication → URL Configuration die Vercel-Domain als erlaubte Redirect-URL eintragen.
