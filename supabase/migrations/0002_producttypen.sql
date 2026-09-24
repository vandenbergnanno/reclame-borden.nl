-- Breidt aanvragen uit met een producttype: niet elke aanvraag is een reclamebord langs een
-- veld. Klanten kunnen ook visitekaartjes of een bord in een andere maat aanvragen.
--
-- Bestaande rijen (allemaal reclameborden, want dat was tot nu toe de enige optie) krijgen
-- producttype 'reclamebord' via de default. `veldtype` is alleen relevant voor reclameborden en
-- wordt daarom nullable; `afmeting` is een vrije-tekst veld voor "bord-andere-maat"-aanvragen.

alter table aanvragen
  add column producttype text not null default 'reclamebord'
    check (producttype in ('reclamebord', 'visitekaartje', 'bord-andere-maat'));

alter table aanvragen
  alter column veldtype drop not null;

alter table aanvragen
  add column afmeting text;

-- Een reclamebord-aanvraag moet een veldtype hebben; bij de andere producttypen is dat juist
-- niet van toepassing.
alter table aanvragen
  add constraint aanvragen_veldtype_bij_reclamebord check (
    (producttype = 'reclamebord' and veldtype is not null)
    or (producttype <> 'reclamebord' and veldtype is null)
  );

comment on column aanvragen.producttype is 'Wat de klant aanvraagt: reclamebord, visitekaartje, of een bord in een afwijkende maat.';
comment on column aanvragen.afmeting is 'Vrije-tekst gewenste afmeting, vooral relevant bij producttype ''bord-andere-maat''.';
