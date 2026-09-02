-- Padel BCN · Satz-basierte Ergebnisse (statt einem einzelnen Score) +
-- Teams werden sofort beim Auslosen persistiert (leere "sets"), damit alle
-- Geräte dieselbe Auslosung sehen und ein Re-Roll danach nicht mehr möglich ist.

alter table padel_matches drop column score1;
alter table padel_matches drop column score2;
alter table padel_matches add column sets jsonb not null default '[]'::jsonb;
