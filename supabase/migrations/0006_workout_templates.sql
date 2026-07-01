-- Personal OS · Trainings-Vorlagen (Templates), um schnell neue Sessions zu starten

create table workout_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

create table workout_template_exercises (
  id                 uuid primary key default gen_random_uuid(),
  template_id        uuid not null references workout_templates(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  name               text not null,
  default_sets       integer not null default 3 check (default_sets > 0),
  default_reps       integer not null default 8 check (default_reps > 0),
  default_weight_kg  numeric(6,2) not null default 0 check (default_weight_kg >= 0),
  order_index        integer not null default 0,
  created_at         timestamptz not null default now()
);
create index idx_workout_template_exercises_template on workout_template_exercises(template_id, order_index);

do $$
declare
  t text;
begin
  foreach t in array array['workout_templates', 'workout_template_exercises']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy "owner_all" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid());',
      t
    );
  end loop;
end $$;
