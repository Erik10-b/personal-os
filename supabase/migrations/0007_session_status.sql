-- Personal OS · Session-Status (offen vs. abgeschlossen)
-- Eine Session ist "offen", solange completed_at NULL ist. Beim Abschließen wird
-- completed_at gesetzt.

alter table workout_sessions add column completed_at timestamptz;

-- Alle bereits vorhandenen Sessions (inkl. importierter Historie) gelten als abgeschlossen,
-- damit nur neu gestartete Sessions als "offen" erscheinen.
update workout_sessions set completed_at = created_at where completed_at is null;
