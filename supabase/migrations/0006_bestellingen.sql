-- Eén order kan meerdere (verschillende) borden bevatten -- bijv. een vereniging die in één keer
-- 6 sponsorborden bestelt. Elk bord blijft een eigen rij in `aanvragen` (eigen ontwerp, eigen
-- status, eigen checks), maar rijen met dezelfde `bestelling_id` horen bij elkaar. Een losse
-- aanvraag (verreweg de meeste) krijgt gewoon een eigen, unieke bestelling_id -- zo hoeft de rest
-- van de code (die ervan uitgaat dat elke aanvraag een bestelling_id heeft) geen apart geval "geen
-- bestelling" te behandelen.
alter table aanvragen add column if not exists bestelling_id uuid not null default gen_random_uuid();

create index if not exists aanvragen_bestelling_id_idx on aanvragen (bestelling_id);

comment on column aanvragen.bestelling_id is 'Groepeert bord-rijen die in één keer besteld zijn (zie lib/ontwerptool/reclamebord-maker.html, "bestelling opslaan en volgend bord"). Elke aanvraag heeft er een, ook een losse bestelling van één bord.';
