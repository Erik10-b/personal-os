-- Personal OS · Einzelne Sätze pro Übung (Gewicht + Wiederholungen je Satz)
-- Bisher hatte jede Übung nur ein Tripel (sets/reps/weight). Jetzt kann jede Übung
-- mehrere Sätze mit je eigenem Gewicht und Wdh. haben. Die alten Spalten auf
-- workout_exercises bleiben als Fallback für die importierte Historie erhalten.

create table workout_sets (
  id           uuid primary key default gen_random_uuid(),
  exercise_id  uuid not null references workout_exercises(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  position     integer not null default 1,
  reps         integer not null default 8 check (reps >= 0),
  weight_kg    numeric(6,2) not null default 0 check (weight_kg >= 0),
  created_at   timestamptz not null default now()
);
create index idx_workout_sets_exercise on workout_sets(exercise_id, position);

alter table workout_sets enable row level security;
create policy "owner_all" on workout_sets for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
