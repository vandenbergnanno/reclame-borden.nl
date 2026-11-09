-- Naam die de klant zelf aan dit bord geeft bij het versturen (zie lib/ontwerptool/
-- reclamebord-maker.html), om meerdere aanvragen uit elkaar te houden op /mijn-borden.
alter table aanvragen add column if not exists bordnaam text null;

comment on column aanvragen.bordnaam is 'Naam die de klant zelf aan dit bord geeft bij het versturen, om meerdere aanvragen uit elkaar te houden op /mijn-borden. Null voor aanvragen van vóór dit veld bestond.';
