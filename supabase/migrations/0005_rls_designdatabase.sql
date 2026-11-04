-- RLS-audit (zie het overzicht dat met de gebruiker is gedeeld): van de 7 tabellen in dit project
-- had `designdatabase` als enige nog geen Row Level Security aanstaan. Supabase geeft de rollen
-- `anon`/`authenticated` standaard lees- én schrijfrechten op elke nieuwe tabel in het `public`-
-- schema; zonder RLS kon dus iedereen met alleen de publieke anon-key deze tabel direct via de
-- REST API lezen, aanvullen of leegmaken. De tabel wordt nog nergens vanuit de klant-kant gebruikt
-- (alleen genoemd in een toekomst-comment in lib/ai/generateDesign.ts) en hoeft dat ook nooit
-- rechtstreeks te doen -- alle toegang blijft dus via de service-role key lopen (die RLS omzeilt),
-- vandaar RLS aan zonder policies: dat is een impliciete "nee" voor anon/authenticated.
alter table designdatabase enable row level security;
