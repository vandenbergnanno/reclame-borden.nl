-- Uitbreiding voor de zelfbedieningsontwerptool (reclamebord-maker): de klant levert voortaan
-- vaak een kant-en-klaar drukbestand aan i.p.v. alleen een tekstuele wens, en kiest een
-- bezorgadres (of ophalen) i.p.v. een provincie. De oude testflow-kolommen (veldtype, wens,
-- klanten.provincie) blijven bestaan voor bestaande data, maar zijn niet langer verplicht.

alter table klanten
  alter column provincie drop not null;

comment on column klanten.provincie is 'Optioneel: alleen gevuld bij aanvragen uit de oude testflow (tekstuele wens + AI-concept). De ontwerptool vraagt in plaats daarvan een bezorgadres (zie aanvragen.straat/postcode/plaats).';

alter table aanvragen
  alter column veldtype drop not null,
  alter column wens drop not null,
  add column if not exists aantal integer not null default 1 check (aantal >= 1 and aantal <= 99),
  add column if not exists bedrukking text not null default 'Enkelzijdig' check (bedrukking in ('Enkelzijdig', 'Dubbelzijdig')),
  add column if not exists kromtrekken boolean not null default false,
  add column if not exists levering text not null default 'Bezorgen' check (levering in ('Bezorgen', 'Zelf ophalen in Oudewater')),
  add column if not exists straat text,
  add column if not exists postcode text,
  add column if not exists plaats text,
  add column if not exists opmerking text,
  add column if not exists ontwerp_door_ons boolean not null default false,
  add column if not exists qr_codes text,
  add column if not exists teksten text,
  add column if not exists waarschuwingen text,
  add column if not exists lege_logoplek boolean not null default false,
  add column if not exists compleet_ontwerp text,
  add column if not exists ontwerp_ontbreekt boolean not null default false,
  add column if not exists drukbestand_pad text,
  add column if not exists drukbestand_achter_pad text,
  add column if not exists voorbeeld_pad text,
  add column if not exists voorbeeld_achter_pad text,
  add column if not exists ontwerp_pad text,
  add column if not exists overige_bestanden jsonb;

comment on column aanvragen.veldtype is 'Optioneel sinds de ontwerptool: alleen gevuld bij aanvragen uit de oude testflow (tekstuele wens + AI-concept). De ontwerptool kent geen veldtype-indeling.';
comment on column aanvragen.wens is 'Optioneel sinds de ontwerptool: de vrije ontwerpwens uit de oude testflow. Nieuwe aanvragen gebruiken `opmerking` (en, bij ontwerp_door_ons, `teksten`).';
comment on column aanvragen.aantal is 'Aantal te produceren borden.';
comment on column aanvragen.bedrukking is 'Enkelzijdig, of dubbelzijdig (identieke achterkant, of een eigen ontwerp per kant — zie drukbestand_achter_pad).';
comment on column aanvragen.kromtrekken is 'Extra beschermingslaag tegen kromtrekken besteld (tegen meerprijs).';
comment on column aanvragen.levering is 'Laten bezorgen (zie straat/postcode/plaats), of zelf ophalen in Oudewater.';
comment on column aanvragen.opmerking is 'Vrije toelichting van de klant. Verplicht en leidend zodra ontwerp_door_ons = true (vervangt dan de oude `wens`).';
comment on column aanvragen.ontwerp_door_ons is 'True als de klant in de ontwerptool voor "Laat ons het ontwerp maken" heeft gekozen: er is dan nog geen kant-en-klaar drukbestand, alleen een logo en/of opmerking, en een medewerker maakt het ontwerp handmatig (zie ConceptBewerken/EmailBewerken op de detailpagina).';
comment on column aanvragen.qr_codes is 'Webadressen van QR-codes die de klant op het bord heeft gezet (één per regel), zodat een medewerker kan controleren of de code naar de juiste plek verwijst.';
comment on column aanvragen.teksten is 'Alle teksten die op het bord staan, zoals de klant ze heeft ingevoerd — alleen gevuld als het ontwerp zelf is gemaakt, puur zodat een medewerker ze kan naleeszen zonder het drukbestand te hoeven openen.';
comment on column aanvragen.waarschuwingen is 'Waarschuwingen die de klant in de ontwerptool kreeg en toch negeerde (bijv. tekst te dicht bij de rand), zodat een medewerker weet waar extra op gelet moet worden.';
comment on column aanvragen.lege_logoplek is 'True als de klant een aangegeven logoplek leeg heeft gelaten (geen logo aangeleverd) — een medewerker moet dan beslissen of die leeg blijft of wordt nagevraagd.';
comment on column aanvragen.compleet_ontwerp is 'Bestandsnaam van een door de klant aangeleverd compleet eigen ontwerp (i.p.v. iets in de tool samengesteld), met een notitie of het bestand is meegestuurd.';
comment on column aanvragen.ontwerp_ontbreekt is 'True als het .reclamebord-ontwerpbestand niet kon worden meegestuurd (te groot) — een medewerker moet het dan apart opvragen om te kunnen bewerken.';
comment on column aanvragen.drukbestand_pad is 'Pad in Supabase Storage naar het kant-en-klare drukbestand (PDF, voorkant) dat de ontwerptool heeft gegenereerd.';
comment on column aanvragen.drukbestand_achter_pad is 'Zelfde als drukbestand_pad, maar voor de achterkant — alleen gevuld bij dubbelzijdig met een eigen achterkant-ontwerp.';
comment on column aanvragen.voorbeeld_pad is 'Pad in Supabase Storage naar een voorbeeldafbeelding (PNG) van het ontwerp, voor snelle weergave in /intern zonder het drukbestand te hoeven openen.';
comment on column aanvragen.voorbeeld_achter_pad is 'Zelfde als voorbeeld_pad, maar voor de achterkant.';
comment on column aanvragen.ontwerp_pad is 'Pad in Supabase Storage naar het bewerkbare .reclamebord-ontwerpbestand, zodat een medewerker de layout later nog kan aanpassen.';
comment on column aanvragen.overige_bestanden is 'Jsonb-array van { naam, pad } voor extra meegestuurde bestanden: logo''s die de klant op het bord heeft gezet en losse bijlagen (bijv. "Nog een bestand meesturen").';
