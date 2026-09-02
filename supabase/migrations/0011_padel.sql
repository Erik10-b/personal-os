-- Padel BCN · Mini-Urlaub-Turnier für 8 Spieler
-- Bewusst KEIN Single-User-Schema: alle Freunde ohne eigenen Account sollen
-- Teams auslosen und Ergebnisse eintragen können. Tabellen sind daher
-- öffentlich lesbar/schreibbar (kein user_id-Bezug, RLS erlaubt "true").
-- Route /padel ist entsprechend von der Login-Pflicht ausgenommen
-- (siehe PUBLIC_PATHS in lib/supabase/proxy.ts).

create table padel_players (
  id          uuid primary key default gen_random_uuid(),
  slot        int not null unique check (slot between 1 and 8),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table padel_tournament (
  id          boolean primary key default true check (id),
  finished    boolean not null default false,
  updated_at  timestamptz not null default now()
);
insert into padel_tournament (id, finished) values (true, false);

create table padel_rounds (
  id            uuid primary key default gen_random_uuid(),
  round_number  int not null unique check (round_number > 0),
  created_at    timestamptz not null default now()
);

create table padel_matches (
  id             uuid primary key default gen_random_uuid(),
  round_id       uuid not null references padel_rounds(id) on delete cascade,
  match_number   int not null check (match_number in (1, 2)),
  team1_player1  uuid not null references padel_players(id),
  team1_player2  uuid not null references padel_players(id),
  team2_player1  uuid not null references padel_players(id),
  team2_player2  uuid not null references padel_players(id),
  score1         int not null check (score1 >= 0),
  score2         int not null check (score2 >= 0 and score2 <> score1),
  created_at     timestamptz not null default now(),
  unique (round_id, match_number)
);
create index idx_padel_matches_round on padel_matches(round_id);

insert into padel_players (slot, name) values
  (1, 'Erik'), (2, 'Tim'), (3, 'Dennish'), (4, 'Luis'),
  (5, 'Giason'), (6, 'Jones'), (7, 'Bent'), (8, 'Jannik');

-- ============ RLS: bewusst öffentlich (siehe Kommentar oben) ============
alter table padel_players enable row level security;
alter table padel_tournament enable row level security;
alter table padel_rounds enable row level security;
alter table padel_matches enable row level security;

create policy "public_all" on padel_players for all using (true) with check (true);
create policy "public_all" on padel_tournament for all using (true) with check (true);
create policy "public_all" on padel_rounds for all using (true) with check (true);
create policy "public_all" on padel_matches for all using (true) with check (true);

-- ============ Realtime: Live-Sync für alle Geräte ohne Login ============
alter publication supabase_realtime add table padel_players;
alter publication supabase_realtime add table padel_tournament;
alter publication supabase_realtime add table padel_rounds;
alter publication supabase_realtime add table padel_matches;
