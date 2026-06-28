-- Personal OS · Row Level Security
-- Single-User-App: jede Zeile gehört genau einem Owner (user_id = auth.uid()).
-- Eine einzige FOR ALL-Policy pro Tabelle reicht, kein Rollenkonzept nötig.

do $$
declare
  t text;
begin
  foreach t in array array[
    'transactions', 'habits', 'habit_logs', 'weight_logs',
    'todos', 'events', 'notes', 'matches'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy "owner_all" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid());',
      t
    );
  end loop;
end $$;
