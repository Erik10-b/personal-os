-- Personal OS · RLS-Policies für die Training-Tabellen reparieren
-- Hintergrund: Bei früheren Läufen von 0005/0006 wurde RLS aktiviert, aber die
-- owner_all-Policy fehlte teils (der Lauf brach vorher mit "already exists" ab).
-- Ohne Policy sind SELECTs leer und INSERTs schlagen mit 42501 fehl.
-- Dieses Skript ist idempotent und kann gefahrlos (auch mehrfach) ausgeführt werden.

do $$
declare
  t text;
begin
  foreach t in array array[
    'workout_sessions', 'workout_exercises',
    'workout_templates', 'workout_template_exercises'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "owner_all" on %I;', t);
    execute format(
      'create policy "owner_all" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid());',
      t
    );
  end loop;
end $$;
