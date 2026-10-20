-- Klant-accounts (gebruikersnaam/wachtwoord via Supabase Auth), zodat een klant kan inloggen en
-- zijn eigen eerder gemaakte borden kan terugzien. Bewust gebouwd bovenop Supabase Auth (auth.users)
-- in plaats van zelf wachtwoorden te hashen/beheren -- zie de uitleg die hierover met de gebruiker
-- is gedeeld.
--
-- Het personeelsgedeelte (/intern) blijft het gedeelde-wachtwoord-systeem gebruiken (zie
-- lib/auth/internSessie.ts) -- dit is uitsluitend voor klanten.

alter table klanten
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null,
  add constraint klanten_auth_user_id_key unique (auth_user_id);

comment on column klanten.auth_user_id is 'Gekoppeld Supabase Auth-account, zodra de klant (eventueel achteraf, bij een al bestaande klantrij op e-mailadres) een account aanmaakt. Null voor klanten die nooit hebben ingelogd (gastaanvraag).';

-- ---------------------------------------------------------------------------
-- Row Level Security: een ingelogde klant mag alleen zijn eigen gegevens zien.
--
-- Alle bestaande server-routes in deze app gebruiken de service-role key (zie
-- lib/supabase/server.ts), die RLS altijd omzeilt -- dat blijft zo voor het personeelsgedeelte en
-- de aanvraagformulieren. Dit beleid is specifiek voor de NIEUWE "mijn borden"-pagina, die
-- rechtstreeks (met de publieke anon-key + de sessie-cookie van de klant) bij Supabase leest --
-- zie lib/supabase/serverAuth.ts.
-- ---------------------------------------------------------------------------

alter table klanten enable row level security;
alter table aanvragen enable row level security;
alter table content_checks enable row level security;
alter table designs enable row level security;
alter table feedback enable row level security;
alter table emails enable row level security;

drop policy if exists klant_ziet_eigen_klantrij on klanten;
create policy klant_ziet_eigen_klantrij on klanten
  for select
  using (auth_user_id = auth.uid());

drop policy if exists klant_ziet_eigen_aanvragen on aanvragen;
create policy klant_ziet_eigen_aanvragen on aanvragen
  for select
  using (klant_id in (select id from klanten where auth_user_id = auth.uid()));

drop policy if exists klant_ziet_eigen_checks on content_checks;
create policy klant_ziet_eigen_checks on content_checks
  for select
  using (aanvraag_id in (
    select a.id from aanvragen a
    join klanten k on k.id = a.klant_id
    where k.auth_user_id = auth.uid()
  ));

drop policy if exists klant_ziet_eigen_designs on designs;
create policy klant_ziet_eigen_designs on designs
  for select
  using (aanvraag_id in (
    select a.id from aanvragen a
    join klanten k on k.id = a.klant_id
    where k.auth_user_id = auth.uid()
  ));

drop policy if exists klant_ziet_eigen_feedback on feedback;
create policy klant_ziet_eigen_feedback on feedback
  for select
  using (aanvraag_id in (
    select a.id from aanvragen a
    join klanten k on k.id = a.klant_id
    where k.auth_user_id = auth.uid()
  ));

drop policy if exists klant_ziet_eigen_emails on emails;
create policy klant_ziet_eigen_emails on emails
  for select
  using (aanvraag_id in (
    select a.id from aanvragen a
    join klanten k on k.id = a.klant_id
    where k.auth_user_id = auth.uid()
  ));

-- Geen insert/update/delete-policies voor klanten: wijzigingen (nieuwe aanvraag, statuswijziging,
-- concept bewerken, enz.) blijven uitsluitend via de server-routes lopen (service-role key, die
-- RLS omzeilt) -- een klant mag via zijn eigen sessie dus alleen lezen, nooit direct schrijven.
