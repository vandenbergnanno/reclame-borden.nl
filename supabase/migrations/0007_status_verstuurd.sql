-- Extra status na "gemaakt" (klaar voor levering): "verstuurd", zodat een medewerker een bord ook
-- echt als verzonden/afgeleverd kan markeren in plaats van dat het voor altijd op "Klaar voor
-- levering" blijft staan.
--
-- De naam van de bestaande check-constraint op `aanvragen.status` niet aannemen (kan afwijken van
-- de standaard Postgres-naamgeving) -- in plaats daarvan dynamisch opzoeken en vervangen, zodat
-- deze migratie niet per ongeluk een tweede, botsende constraint toevoegt naast de oude.
do $$
declare
  oude_naam text;
begin
  select conname into oude_naam
  from pg_constraint
  where conrelid = 'aanvragen'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%in%';

  if oude_naam is not null then
    execute format('alter table aanvragen drop constraint %I', oude_naam);
  end if;
end $$;

alter table aanvragen add constraint aanvragen_status_check
  check (status in ('nieuw', 'in_behandeling', 'voorstel_verstuurd', 'gemaakt', 'verstuurd'));
