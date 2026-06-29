-- Personal OS · Goals, Nutrition, Finance-Pulse, Kanban-Todos
-- Inspiriert vom "Personal OS Build Cheat Sheet" (Miles Deutscher) — ohne KI-Anbindung,
-- nur Datenmodell + UI übernommen.

-- ============ GOALS (Erik) ============
create table goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  scope       text not null check (scope in ('week', 'month')),
  title       text not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index idx_goals_user_scope on goals(user_id, scope, done);

-- ============ MEALS (Erik · Ernährung) ============
create table meals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  eaten_on    date not null default current_date,
  name        text not null,
  kcal        integer not null default 0 check (kcal >= 0),
  protein_g   integer not null default 0 check (protein_g >= 0),
  carbs_g     integer not null default 0 check (carbs_g >= 0),
  fat_g       integer not null default 0 check (fat_g >= 0),
  created_at  timestamptz not null default now()
);
create index idx_meals_user_date on meals(user_id, eaten_on desc);

-- ============ NET_WORTH_SNAPSHOTS (Finanzielles · Finance Pulse) ============
create table net_worth_snapshots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null default current_date,
  amount        integer not null, -- in Cent, kann negativ sein
  note          text,
  created_at    timestamptz not null default now(),
  unique (user_id, snapshot_date)
);
create index idx_net_worth_user_date on net_worth_snapshots(user_id, snapshot_date desc);

-- ============ TODOS: Kanban-Felder ============
alter table todos add column urgency text not null default 'this_week'
  check (urgency in ('today', 'this_week', 'this_month', 'someday'));
alter table todos add column key boolean not null default false;
create index idx_todos_user_area_urgency on todos(user_id, area, urgency);

-- ============ RLS ============
do $$
declare
  t text;
begin
  foreach t in array array['goals', 'meals', 'net_worth_snapshots']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy "owner_all" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid());',
      t
    );
  end loop;
end $$;
