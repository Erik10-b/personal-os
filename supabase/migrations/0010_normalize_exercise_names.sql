-- Personal OS · Übungsnamen vereinheitlichen
-- Führt Schreib-/Tippvarianten aus dem historischen Import auf einen
-- kanonischen Namen zusammen, damit "letzte Leistung" korrekt matched.
-- Betrifft workout_exercises (Historie) und workout_template_exercises (Vorlagen).

do $$
declare
  mapping text[][] := array[
    -- Bizeps
    array['Bizi Flach', 'Bizi flach'],
    array['Bizi hinter', 'Bizi hinter Bank'],
    array['Bizi Bank hinten', 'Bizi hinter Bank'],
    array['Knie Bizi hinter', 'Bizi hinter Bank'],
    array['Bizi Maschine EA', 'Bizi Maschine'],
    array['Bizi Maschine flach EA', 'Bizi Maschine'],
    array['Bizi Maschine schräg erhöht beide', 'Bizi Maschine'],
    array['18 Bizi neu', 'Bizi neu'],
    -- Trizeps (Quelldaten hatten einen führenden Zahlen-Artefakt "8 " aus dem Parser)
    array['8 Trizi über Kopf', 'Trizi Überkopf'],
    array['8 Trizi überkopf', 'Trizi Überkopf'],
    array['8 Trizi Überkopf', 'Trizi Überkopf'],
    array['Trizi Seil maschine an der Smith', 'Trizi Seil'],
    -- Beine
    array['Bein Beiger', 'Bein Beuger'],
    array['Bein Bueger', 'Bein Beuger'],
    array['Beuger', 'Bein Beuger'],
    array['Beuger liegend', 'Bein Beuger'],
    array['Bein Stecker', 'Bein Strecker'],
    array['Bein strecker', 'Bein Strecker'],
    array['Beinstrecker', 'Bein Strecker'],
    array['Strecker', 'Bein Strecker'],
    array['Strecker halten', 'Bein Strecker'],
    array['Aufwärmen Beinstrecker', 'Bein Strecker'],
    -- Bauch
    array['Bauch seil', 'Bauch Seil'],
    array['Bauch Zirkel', 'Bauch Circle'],
    array['Core circles', 'Bauch Circle'],
    array['Core Zirkel Russian, toe, crunch', 'Bauch Circle'],
    -- Brust
    array['Brustmaschine', 'Brust Maschine'],
    array['Brust Maschine Hammer', 'Brust Maschine'],
    array['Chest machine', 'Brust Maschine'],
    array['Chest Maschine', 'Brust Maschine'],
    array['Chest supported Maschine', 'Chest supported'],
    array['Chest supported sitzend', 'Chest supported'],
    array['Buchest supported', 'Chest supported'],
    array['Chest Kabel', 'Brust Kabel'],
    array['flys Maschine', 'Flys Maschine'],
    array['Flys machine', 'Flys Maschine'],
    -- Rücken/Rudern
    array['Rudern matte', 'Rudern Matte'],
    array['Rudern mit matte', 'Rudern Matte'],
    array['Rudern mit Matte', 'Rudern Matte'],
    array['Rudern mittel', 'Rudern Mittel'],
    array['High row ea', 'High row EA'],
    array['High Row EA', 'High row EA'],
    array['High row Kabel', 'High row'],
    array['Latziehen Stange', 'Latziehen'],
    array['Hintere', 'Hintere Schulter'],
    -- Beinbeuger/Hamstring
    array['Hammis', 'Hamstring'],
    array['Hammstring Maschine', 'Hamstring'],
    -- Sonstiges
    array['Trap Bar', 'Trap bar'],
    array['Seitheben at 11.4 x4', 'Seitheben']
  ];
  pair text[];
begin
  foreach pair slice 1 in array mapping
  loop
    update workout_exercises set name = pair[2] where name = pair[1];
    update workout_template_exercises set name = pair[2] where name = pair[1];
  end loop;
end $$;
