-- Personal OS · Initiales Schema
-- Gemeinsamer Trigger für updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============ TRANSACTIONS (Finanzielles) ============
create table transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('income', 'expense')),
  amount      integer not null check (amount >= 0), -- in Cent
  currency    char(3) not null default 'EUR',
  category    text not null,
  occurred_on date not null default current_date,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_transactions_user_date on transactions(user_id, occurred_on desc);
create trigger trg_transactions_updated_at before update on transactions
  for each row execute function set_updated_at();

-- ============ HABITS + HABIT_LOGS (Erik) ============
create table habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#3B82F6',
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index idx_habits_user on habits(user_id) where archived = false;

create table habit_logs (
  id          uuid primary key default gen_random_uuid(),
  habit_id    uuid not null references habits(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  log_date    date not null,
  created_at  timestamptz not null default now(),
  unique (habit_id, log_date)
);
create index idx_habit_logs_habit_date on habit_logs(habit_id, log_date desc);

-- ============ WEIGHT_LOGS (Erik) ============
create table weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  weight_kg   numeric(5,2) not null check (weight_kg > 0),
  logged_on   date not null default current_date,
  note        text,
  created_at  timestamptz not null default now(),
  unique (user_id, logged_on)
);
create index idx_weight_logs_user_date on weight_logs(user_id, logged_on desc);

-- ============ TODOS (Erik + Arbeit, area-tag) ============
create table todos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  area        text not null check (area in ('erik', 'arbeit')),
  title       text not null,
  done        boolean not null default false,
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_todos_user_area on todos(user_id, area, done);
create trigger trg_todos_updated_at before update on todos
  for each row execute function set_updated_at();

-- ============ EVENTS (Termine + Fußball, area-tag) ============
create table events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  area        text not null check (area in ('allgemein', 'fussball')) default 'allgemein',
  title       text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  note        text,
  category    text,
  color       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_events_user_starts on events(user_id, starts_at);
create index idx_events_user_area_starts on events(user_id, area, starts_at);
create trigger trg_events_updated_at before update on events
  for each row execute function set_updated_at();

-- ============ NOTES (Arbeit/Master) ============
create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  content     text not null default '',
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_notes_user on notes(user_id, pinned desc, updated_at desc);
create trigger trg_notes_updated_at before update on notes
  for each row execute function set_updated_at();

-- ============ MATCHES (Fußball-Statistik) ============
create table matches (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  played_on     date not null,
  opponent      text not null,
  goals_for     integer not null default 0,
  goals_against integer not null default 0,
  own_goals     integer not null default 0,
  note          text,
  event_id      uuid references events(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index idx_matches_user_date on matches(user_id, played_on desc);
