-- Personal OS · Prioritätslevel für Todos
alter table todos add column priority text not null default 'medium'
  check (priority in ('high', 'medium', 'low'));
