-- Minimale seeddata om de interne overzichtspagina en het formulier lokaal te kunnen testen.
-- Uitvoeren na de migratie, bijv. met `supabase db reset` (voert migraties + seed.sql uit).

insert into klanten (id, naam, bedrijf, email, telefoon)
values
  ('11111111-1111-1111-1111-111111111111', 'Jan de Boer', 'VV Oudewater', 'jan@vvoudewater.nl', '0348123456'),
  ('22222222-2222-2222-2222-222222222222', 'Marieke Visser', 'HC De Meern', 'marieke@hcdemeern.nl', null),
  ('33333333-3333-3333-3333-333333333333', 'Tom Bakker', 'Bakker Makelaardij', 'tom@bakkermakelaardij.nl', '0611223344')
on conflict (id) do nothing;

insert into aanvragen (id, klant_id, producttype, veldtype, afmeting, wens, status)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'reclamebord',
    'voetbal-zijlijn',
    null,
    'Reclamebord met onze clublogo in groen/wit, tekst "Trots hoofdsponsor van VV Oudewater".',
    'nieuw'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'reclamebord',
    'scorebord',
    null,
    'Strak scorebord-ontwerp passend bij onze clubkleuren blauw en geel.',
    'voorstel_verstuurd'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',
    'visitekaartje',
    null,
    null,
    'Visitekaartje in onze huisstijl (donkerblauw/wit), met logo, naam, telefoonnummer en QR-code naar de website.',
    'nieuw'
  )
on conflict (id) do nothing;

insert into content_checks (aanvraag_id, probleem, geblokkeerd, toelichting)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'geen probleem gevonden',
    false,
    'Placeholder-check (trefwoorden) heeft niets verdachts gevonden in de ingevoerde wens.'
  )
on conflict do nothing;

insert into designs (aanvraag_id, versienummer, status, opslaglocatie)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    1,
    'concept',
    'placeholder/testafbeelding.png'
  )
on conflict do nothing;
