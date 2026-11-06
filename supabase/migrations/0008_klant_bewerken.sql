-- Een klant mag zijn eigen aanvraag aanpassen zolang die nog op status "nieuw" staat (zie
-- app/api/aanvragen/[id]/klant-bewerken/route.ts). Dit houdt bij WANNEER dat is gebeurd, en
-- bewaart de vorige versie zodat een medewerker kan zien wat er is veranderd.

alter table aanvragen add column if not exists gewijzigd_door_klant_op timestamptz null;

comment on column aanvragen.gewijzigd_door_klant_op is 'Tijdstip van de laatste keer dat de klant zelf deze aanvraag heeft aangepast via /aanvraag?bewerk=<id>. Null = nog nooit aangepast.';

-- Simpele versiegeschiedenis: vóór elke klant-wijziging wordt de HUIDIGE rij als JSON-snapshot
-- hierin weggeschreven. Geen diff-logica, gewoon een lijst "zo zag hij er eerder uit" voor
-- /intern om te kunnen terugkijken.
create table if not exists aanvraag_versies (
  id uuid primary key default gen_random_uuid(),
  aanvraag_id uuid not null references aanvragen (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

comment on table aanvraag_versies is 'Snapshot van een aanvragen-rij vlak vóór een klant-wijziging (zie app/api/aanvragen/[id]/klant-bewerken/route.ts). Uitsluitend gebruikt via de service-role key, net als de aanvragen-tabel zelf.';

create index if not exists aanvraag_versies_aanvraag_id_idx on aanvraag_versies (aanvraag_id);

alter table aanvraag_versies enable row level security;

-- Expliciete klant-update-policy op aanvragen: een tweede, van de server-route onafhankelijke
-- slotje. Alle bestaande server-routes gebruiken de service-role key (omzeilt RLS toch al), maar
-- mocht een klant ooit rechtstreeks (anon-key + sessie) proberen te schrijven, dan staat dit beleid
-- dat alleen toe voor zijn EIGEN aanvraag én alleen zolang die nog "nieuw" is.
drop policy if exists klant_bewerkt_eigen_nieuwe_aanvraag on aanvragen;
create policy klant_bewerkt_eigen_nieuwe_aanvraag on aanvragen
  for update
  using (
    status = 'nieuw'
    and klant_id in (select id from klanten where auth_user_id = auth.uid())
  )
  with check (
    status = 'nieuw'
    and klant_id in (select id from klanten where auth_user_id = auth.uid())
  );
