-- Existing rows remain performed; newly created sets start as planned.
alter table workout_sets add column is_done boolean not null default true;
alter table workout_sets alter column is_done set default false;
alter table workout_sessions add column effort_score smallint
  check (effort_score between 1 and 10);
alter table workout_exercises add column note text;
alter table workout_exercises add column order_index integer not null default 0;

-- Reorder only the caller's open session; update positions in one statement.
create or replace function reorder_workout_exercises(target_session uuid, ordered_ids uuid[])
returns void language plpgsql security invoker set search_path = public as $$
begin
  if not exists (select 1 from workout_sessions where id = target_session and user_id = auth.uid() and completed_at is null) then
    raise exception 'Open workout not found';
  end if;
  if cardinality(ordered_ids) <> (select count(*) from workout_exercises where session_id = target_session and user_id = auth.uid())
    or cardinality(ordered_ids) <> (select count(distinct id) from unnest(ordered_ids) as item(id))
    or exists (select 1 from unnest(ordered_ids) as item(id) where not exists (
      select 1 from workout_exercises e where e.id = item.id and e.session_id = target_session and e.user_id = auth.uid()
    )) then raise exception 'Exercise list changed'; end if;
  update workout_exercises e set order_index = item.position - 1
    from unnest(ordered_ids) with ordinality as item(id, position)
    where e.id = item.id and e.session_id = target_session and e.user_id = auth.uid();
end;
$$;
revoke all on function reorder_workout_exercises(uuid, uuid[]) from public;
grant execute on function reorder_workout_exercises(uuid, uuid[]) to authenticated;
