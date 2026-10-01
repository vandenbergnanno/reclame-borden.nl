-- Fundament-schema voor de conceptdesign-tool van De Mediagraaf.
-- Bewust eenvoudig gehouden: dit is een eerste opzet die in latere fases wordt uitgebreid
-- (RLS-policies, extra kolommen, koppeltabellen) zodra er een echt Supabase-project aan hangt.
--
-- Uitvoeren met de Supabase CLI (`supabase db push` / `supabase migration up`) of handmatig
-- via de SQL-editor van een Supabase-project.

create extension if not exists "pgcrypto";

-- Houdt de huidige `updated_at` van een rij up-to-date bij elke wijziging.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- klanten
-- ---------------------------------------------------------------------------
create table if not exists klanten (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  bedrijf text,
  email text not null,
  telefoon text,
  provincie text not null check (
    provincie in (
      'Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg',
      'Noord-Brabant', 'Noord-Holland', 'Overijssel', 'Utrecht', 'Zeeland', 'Zuid-Holland'
    )
  ),
  created_at timestamptz not null default now()
);

comment on table klanten is 'Bedrijven/personen die een aanvraag voor een reclamebord-ontwerp indienen.';
comment on column klanten.provincie is 'Door de klant opgegeven provincie, gebruikt om gemaakte borden logistiek te sorteren/groeperen.';

-- ---------------------------------------------------------------------------
-- aanvragen
-- ---------------------------------------------------------------------------
create table if not exists aanvragen (
  id uuid primary key default gen_random_uuid(),
  klant_id uuid not null references klanten (id) on delete cascade,
  veldtype text not null check (veldtype in ('voetbal-zijlijn', 'hockeyveld', 'scorebord', 'plattegrond')),
  afmeting text not null,
  bord_aanschaf text not null check (bord_aanschaf in ('hergebruiken', 'nieuw')),
  wens text not null,
  status text not null default 'nieuw' check (
    status in (
      'nieuw', 'in_behandeling', 'voorstel_verstuurd', 'goedgekeurd', 'afgewezen', 'geescaleerd',
      'gemaakt'
    )
  ),
  bijlage_pad text,
  voorstel_gepland_op timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table aanvragen is 'Eén ontwerpaanvraag van een klant voor een specifiek veldtype reclamebord.';
comment on column aanvragen.afmeting is 'Gewenste afmeting van het bord: gekozen uit de standaardmaten of vrije tekst via "Anders, namelijk...".';
comment on column aanvragen.bord_aanschaf is 'Hergebruikt de klant een bestaand bord, of moet er een nieuw bord komen (nieuw bord = extra kosten).';
comment on column aanvragen.bijlage_pad is 'Pad in Supabase Storage naar een eventueel meegestuurd voorbeeld/document van de klant.';
comment on column aanvragen.voorstel_gepland_op is 'Vroegste moment waarop het voorstel naar de klant mag gaan (bewuste vertraging van 45-60 min na indienen, zie lib/planning/voorstelPlanning.ts) — voorkomt dat een reactie binnen een minuut meteen verraadt dat het een AI-proces is.';

create index if not exists aanvragen_klant_id_idx on aanvragen (klant_id);
create index if not exists aanvragen_status_idx on aanvragen (status);
create index if not exists aanvragen_voorstel_gepland_op_idx on aanvragen (voorstel_gepland_op);

drop trigger if exists aanvragen_set_updated_at on aanvragen;
create trigger aanvragen_set_updated_at
  before update on aanvragen
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- content_checks
-- ---------------------------------------------------------------------------
create table if not exists content_checks (
  id uuid primary key default gen_random_uuid(),
  aanvraag_id uuid not null references aanvragen (id) on delete cascade,
  probleem text not null,
  geblokkeerd boolean not null default false,
  toelichting text,
  created_at timestamptz not null default now()
);

comment on table content_checks is 'Resultaten van de contentregel-check op een aanvraag (bijv. gedetecteerd telefoonnummer/e-mailadres).';

create index if not exists content_checks_aanvraag_id_idx on content_checks (aanvraag_id);

-- ---------------------------------------------------------------------------
-- designs
-- ---------------------------------------------------------------------------
create table if not exists designs (
  id uuid primary key default gen_random_uuid(),
  aanvraag_id uuid not null references aanvragen (id) on delete cascade,
  versienummer integer not null default 1,
  status text not null default 'concept' check (status in ('concept', 'definitief', 'vervangen')),
  opslaglocatie text not null,
  created_at timestamptz not null default now()
);

comment on table designs is 'Gegenereerde ontwerp-versies (nu nog placeholders) die bij een aanvraag horen.';
comment on column designs.opslaglocatie is 'Pad/URL in Supabase Storage (of later een externe beeldgeneratie-dienst) naar het designbestand.';

create index if not exists designs_aanvraag_id_idx on designs (aanvraag_id);
create unique index if not exists designs_aanvraag_versie_idx on designs (aanvraag_id, versienummer);

-- ---------------------------------------------------------------------------
-- designdatabase
-- ---------------------------------------------------------------------------
create table if not exists designdatabase (
  id uuid primary key default gen_random_uuid(),
  titel text not null,
  veldtype text check (veldtype in ('voetbal-zijlijn', 'hockeyveld', 'scorebord', 'plattegrond')),
  opslaglocatie text not null,
  tags text[],
  toegevoegd_op timestamptz not null default now()
);

comment on table designdatabase is 'Bestaande, niet-AI-gemaakte ontwerpen van De Mediagraaf zelf. Later handmatig gevuld en gebruikt als trainings-/referentiedata voor de stijl van gegenereerde achtergronden.';

-- ---------------------------------------------------------------------------
-- feedback
-- ---------------------------------------------------------------------------
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  aanvraag_id uuid not null references aanvragen (id) on delete cascade,
  goedgekeurd boolean not null,
  feedbacktekst text,
  created_at timestamptz not null default now()
);

comment on table feedback is 'Reactie van de klant op een voorgesteld ontwerp: akkoord of afwijzing met toelichting.';

create index if not exists feedback_aanvraag_id_idx on feedback (aanvraag_id);
