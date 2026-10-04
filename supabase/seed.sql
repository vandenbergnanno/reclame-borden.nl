-- Minimale seeddata om de interne overzichtspagina en het formulier lokaal te kunnen testen.
-- Uitvoeren na de migratie, bijv. met `supabase db reset` (voert migraties + seed.sql uit).

insert into klanten (id, naam, bedrijf, email, telefoon, provincie)
values
  ('11111111-1111-1111-1111-111111111111', 'Jan de Boer', 'VV Oudewater', 'jan@vvoudewater.nl', '0348123456', 'Utrecht'),
  ('22222222-2222-2222-2222-222222222222', 'Marieke Visser', 'HC De Meern', 'marieke@hcdemeern.nl', null, 'Utrecht'),
  ('33333333-3333-3333-3333-333333333333', 'Tom Bakker', 'Bakker Makelaardij', 'tom@bakkermakelaardij.nl', '0611223344', 'Noord-Holland'),
  ('44444444-4444-4444-4444-444444444444', 'Sanne de Groot', 'VV Groningen', 'sanne@vvgroningen.nl', null, 'Groningen'),
  ('55555555-5555-5555-5555-555555555555', 'Lotte Hendriks', 'Sportcafé De Kantine', 'lotte@dekantine.nl', null, 'Zeeland'),
  ('66666666-6666-6666-6666-666666666666', 'Erik Mulder', 'Tennisclub Smash', 'erik@tcsmash.nl', null, 'Flevoland'),
  ('77777777-7777-7777-7777-777777777777', 'Dennis Kuipers', 'Kuipers Garagebedrijf', 'dennis@kuipersgarage.nl', '0591234567', 'Drenthe')
on conflict (id) do nothing;

insert into aanvragen (id, klant_id, veldtype, afmeting, bord_aanschaf, wens, status, voorstel_gepland_op)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'voetbal-zijlijn',
    '300 x 100 cm',
    'hergebruiken',
    'Reclamebord met onze clublogo in groen/wit, tekst "Trots hoofdsponsor van VV Oudewater".',
    'nieuw',
    now() - interval '5 minutes' -- al verstreken, zodat de testknop meteen iets te verwerken heeft
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'scorebord',
    '200 x 100 cm',
    'nieuw',
    'Strak scorebord-ontwerp passend bij onze clubkleuren blauw en geel.',
    'voorstel_verstuurd',
    now() - interval '2 hours' -- voorstel is al verstuurd
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',
    'voetbal-zijlijn',
    '450 x 90 cm',
    'nieuw',
    'Groot bord voor aan onze gevel bij het veld, met logo en pand-adres.',
    'nieuw',
    now() + interval '50 minutes' -- nog niet verstreken, blijft op 'nieuw' staan
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '44444444-4444-4444-4444-444444444444',
    'hockeyveld',
    '300 x 100 cm',
    'hergebruiken',
    'Bord met logo van onze hoofdsponsor in rood/wit.',
    'gemaakt',
    now() - interval '3 days'
  ),
  (
    -- Goedgekeurd door de klant — gaat daarom direct terug naar 'nieuw' (de productieflow).
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '55555555-5555-5555-5555-555555555555',
    'scorebord',
    '200 x 100 cm',
    'nieuw',
    'Scorebord in onze huisstijl, geel/zwart, met ons logo bovenaan.',
    'nieuw',
    now() - interval '1 day'
  ),
  (
    -- Afgewezen door de klant — de AI heeft automatisch een herzien concept gemaild, dus de
    -- aanvraag blijft gewoon 'voorstel_verstuurd' in afwachting van een nieuwe reactie.
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '66666666-6666-6666-6666-666666666666',
    'voetbal-zijlijn',
    '300 x 100 cm',
    'hergebruiken',
    'Bord met ons logo en de tekst "Tennisclub Smash - nieuwe leden welkom".',
    'voorstel_verstuurd',
    now() - interval '2 days'
  ),
  (
    -- Content-check vond een telefoonnummer, maar dat escaleert niet meer naar een aparte status —
    -- gewoon 'nieuw', met de check zichtbaar als "Te controleren"-signaal.
    '99999999-9999-9999-9999-999999999999',
    '77777777-7777-7777-7777-777777777777',
    'voetbal-zijlijn',
    '300 x 100 cm',
    'nieuw',
    'Bord met ons logo en telefoonnummer 0591234567 zodat mensen ons direct kunnen bellen.',
    'nieuw',
    now() - interval '6 hours'
  )
on conflict (id) do nothing;

insert into content_checks (aanvraag_id, probleem, geblokkeerd, toelichting)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'geen probleem gevonden',
    false,
    'Placeholder-check (trefwoorden) heeft niets verdachts gevonden in de ingevoerde wens.'
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    'telefoonnummer gedetecteerd',
    true,
    'Overleg met de klant of dit telefoonnummer echt op het bord moet komen.'
  )
on conflict do nothing;

insert into designs (aanvraag_id, versienummer, status, opslaglocatie)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    1,
    'concept',
    '/placeholder-ontwerp.svg'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    1,
    'definitief',
    '/placeholder-ontwerp.svg'
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    1,
    'vervangen',
    '/placeholder-ontwerp.svg'
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    2,
    'vervangen',
    '/placeholder-ontwerp.svg'
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    3,
    'concept',
    '/placeholder-ontwerp.svg'
  )
on conflict do nothing;

insert into feedback (aanvraag_id, goedgekeurd, feedbacktekst)
values
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    true,
    null
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    false,
    'Logo mag groter en graag iets minder tekst.'
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    false,
    'Helaas nog steeds niet goed — de kleuren kloppen niet met ons clublogo.'
  )
on conflict do nothing;

-- Eén e-mail per designversie hierboven, zodat /intern/[id] laat zien wat er daadwerkelijk naar de
-- klant verstuurd is. Elke designversie koppelen we via een subquery op (aanvraag_id, versienummer)
-- i.p.v. een vast id, omdat de designs hierboven zonder eigen id worden ingevoegd.
insert into emails (aanvraag_id, design_id, onderwerp, html_inhoud, platte_tekst, verzonden)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    (select id from designs where aanvraag_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and versienummer = 1),
    'Je concept-ontwerp van De Mediagraaf is klaar!',
    '<p>Hoi Marieke Visser,</p><p>Goed nieuws! We hebben een concept-ontwerp gemaakt voor jouw Scorebord (200 x 100 cm).</p>',
    'Hoi Marieke Visser, goed nieuws! We hebben een concept-ontwerp gemaakt voor jouw Scorebord (200 x 100 cm). Bekijk je voorstel via /voorstel/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.',
    false
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    (select id from designs where aanvraag_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' and versienummer = 1),
    'Je concept-ontwerp van De Mediagraaf is klaar!',
    '<p>Hoi Lotte Hendriks,</p><p>Goed nieuws! We hebben een concept-ontwerp gemaakt voor jouw Scorebord (200 x 100 cm).</p>',
    'Hoi Lotte Hendriks, goed nieuws! We hebben een concept-ontwerp gemaakt voor jouw Scorebord (200 x 100 cm). Bekijk je voorstel via /voorstel/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee.',
    false
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    (select id from designs where aanvraag_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff' and versienummer = 1),
    'Je concept-ontwerp van De Mediagraaf is klaar!',
    '<p>Hoi Erik Mulder,</p><p>Goed nieuws! We hebben een concept-ontwerp gemaakt voor jouw Voetbalveld (zijlijn) (300 x 100 cm).</p>',
    'Hoi Erik Mulder, goed nieuws! We hebben een concept-ontwerp gemaakt voor jouw Voetbalveld (zijlijn) (300 x 100 cm). Bekijk je voorstel via /voorstel/ffffffff-ffff-ffff-ffff-ffffffffffff.',
    false
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    (select id from designs where aanvraag_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff' and versienummer = 2),
    'Je herziene concept-ontwerp van De Mediagraaf is klaar!',
    '<p>Hoi Erik Mulder,</p><p>We hebben je feedback verwerkt en een nieuw concept-ontwerp gemaakt voor jouw Voetbalveld (zijlijn) (300 x 100 cm).</p>',
    'Hoi Erik Mulder, we hebben je feedback verwerkt en een nieuw concept-ontwerp gemaakt voor jouw Voetbalveld (zijlijn) (300 x 100 cm). Bekijk je voorstel via /voorstel/ffffffff-ffff-ffff-ffff-ffffffffffff.',
    false
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    (select id from designs where aanvraag_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff' and versienummer = 3),
    'Je herziene concept-ontwerp van De Mediagraaf is klaar!',
    '<p>Hoi Erik Mulder,</p><p>We hebben je feedback verwerkt en een nieuw concept-ontwerp gemaakt voor jouw Voetbalveld (zijlijn) (300 x 100 cm).</p>',
    'Hoi Erik Mulder, we hebben je feedback verwerkt en een nieuw concept-ontwerp gemaakt voor jouw Voetbalveld (zijlijn) (300 x 100 cm). Bekijk je voorstel via /voorstel/ffffffff-ffff-ffff-ffff-ffffffffffff.',
    false
  )
on conflict do nothing;
