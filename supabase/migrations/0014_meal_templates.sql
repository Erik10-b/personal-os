-- Recipe settings live in a private table, not in auth/JWT metadata.
create table public.meal_templates (
  user_id uuid not null references auth.users(id) on delete cascade,
  template_key text not null check (template_key ~ '^[a-zA-Z0-9-]{1,80}$'),
  recipe jsonb not null check (jsonb_typeof(recipe) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, template_key)
);
alter table public.meal_templates enable row level security;
create policy owner_all on public.meal_templates for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.meal_templates to authenticated;

-- A request can be retried safely without creating the same meal twice.
alter table public.meals add column entry_key uuid;
create unique index meals_user_entry_key on public.meals(user_id, entry_key);
