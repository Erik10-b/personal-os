-- Apple Health via a write-only, revocable Shortcut token. No service-role key needed.
begin;
create table if not exists public.health_sync_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create table if not exists public.health_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  steps integer check (steps between 0 and 200000),
  active_kcal numeric(8,2) check (active_kcal between 0 and 15000),
  weight_kg numeric(5,2) check (weight_kg between 20 and 400),
  source text not null check (length(source) between 1 and 120),
  observed_at timestamptz not null,
  received_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.health_sync_tokens enable row level security;
alter table public.health_daily enable row level security;
revoke all on public.health_sync_tokens, public.health_daily from anon, authenticated;
grant select, insert, update, delete on public.health_sync_tokens to authenticated;
grant select on public.health_daily to authenticated;
drop policy if exists health_token_owner on public.health_sync_tokens;
create policy health_token_owner on public.health_sync_tokens for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists health_daily_owner on public.health_daily;
create policy health_daily_owner on public.health_daily for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.receive_health_snapshot(
  p_token text, p_day date, p_observed_at timestamptz,
  p_steps integer default null, p_active_kcal numeric default null,
  p_weight_kg numeric default null, p_source text default 'Apple Health'
) returns text language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid;
  affected integer;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid token' using errcode = '28000';
  end if;
  -- Lock serializes ingestion with rotation/revocation. Never accept a caller-supplied user_id.
  select t.user_id into owner_id from public.health_sync_tokens t
    where t.token_hash = pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p_token, 'UTF8')), 'hex')
    for update;
  if owner_id is null then raise exception 'Invalid token' using errcode = '28000'; end if;
  if p_day is null or p_day < (now() at time zone 'UTC')::date - 30
    or p_day > (now() at time zone 'UTC')::date + 1
    or p_observed_at is null or not pg_catalog.isfinite(p_observed_at)
    or p_observed_at > now() + interval '5 minutes' or p_observed_at < now() - interval '31 days'
    or (p_steps is null and p_active_kcal is null and p_weight_kg is null)
    or (p_steps is not null and (p_steps < 0 or p_steps > 200000))
    or (p_active_kcal is not null and not (p_active_kcal >= 0 and p_active_kcal <= 15000))
    or (p_weight_kg is not null and not (p_weight_kg >= 20 and p_weight_kg <= 400))
    or p_source is null or length(trim(p_source)) < 1 or length(p_source) > 120 then
    raise exception 'Invalid snapshot' using errcode = '22023';
  end if;
  insert into public.health_daily as d (user_id, day, steps, active_kcal, weight_kg, source, observed_at)
    values (owner_id, p_day, p_steps, p_active_kcal, p_weight_kg, trim(p_source), p_observed_at)
  on conflict (user_id, day) do update set
    steps = coalesce(excluded.steps, d.steps),
    active_kcal = coalesce(excluded.active_kcal, d.active_kcal),
    weight_kg = coalesce(excluded.weight_kg, d.weight_kg),
    source = excluded.source, observed_at = excluded.observed_at, received_at = now()
  where excluded.observed_at > d.observed_at;
  get diagnostics affected = row_count;
  update public.health_sync_tokens set last_used_at = now() where user_id = owner_id;
  return case when affected > 0 then 'updated' else 'unchanged' end;
end;
$$;
revoke all on function public.receive_health_snapshot(text,date,timestamptz,integer,numeric,numeric,text) from public;
grant execute on function public.receive_health_snapshot(text,date,timestamptz,integer,numeric,numeric,text) to anon, authenticated;
commit;
