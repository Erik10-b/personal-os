-- Personal OS · Training-Log (Kraft-/Fitnesstraining)

create table workout_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  title        text,
  note         text,
  created_at   timestamptz not null default now()
);
create index idx_workout_sessions_user_date on workout_sessions(user_id, session_date desc);

create table workout_exercises (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references workout_sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  sets        integer not null default 1 check (sets > 0),
  reps        integer not null default 1 check (reps > 0),
  weight_kg   numeric(6,2) not null default 0 check (weight_kg >= 0),
  created_at  timestamptz not null default now()
);
create index idx_workout_exercises_session on workout_exercises(session_id, created_at);
create index idx_workout_exercises_user_name on workout_exercises(user_id, name);

do $$
declare
  t text;
begin
  foreach t in array array['workout_sessions', 'workout_exercises']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy "owner_all" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid());',
      t
    );
  end loop;
end $$;
