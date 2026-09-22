# Voortgang

Bijgehouden per fase, zoals afgesproken in de opdracht. Wordt aangevuld na elke fase.

## Fase 1 — Projectstructuur ✅

- Next.js-project (TypeScript, App Router) opgezet: `package.json`, `tsconfig.json`,
  `next.config.mjs`, Tailwind-config met de merkkleuren van De Mediagraaf.
- `/docs/reference` aangemaakt met `.gitkeep` en een `README.md` die uitlegt wat hier later in
  komt (organisatieanalyse, stagewerkplan, overige Word-documenten).
- `/assets/brand` aangemaakt met de merkkleuren vastgelegd en een `README.md` die aangeeft wat er
  later nog bijkomt (logo, typografie).
- `/assets/mockups/{voetbal-zijlijn,hockeyveld,scorebord,plattegrond}` aangemaakt, nu leeg op een
  `.gitkeep` na.
- `README.md` met projectdoel en architectuurkeuzes, en dit `PROGRESS.md`.
- Minimale `app/layout.tsx` en `app/page.tsx` zodat het project een geldige, draaibare
  Next.js-app is (navigatie naar formulier en intern overzicht, die in latere fases gebouwd zijn).

**Let op:** deze code is geschreven in een sandbox-omgeving zonder Node.js/npm. De structuur en
code zijn met de hand geschreven volgens de gebruikelijke Next.js-conventies, maar zijn nog niet
lokaal gedraaid met `npm install` / `npm run dev`. Doe dat als eerste check op een normale
ontwikkelmachine.

## Fase 2 — Datamodel (Supabase/Postgres) ✅

- Geen Supabase-project beschikbaar in deze sessie, dus uitgewerkt als migratie-structuur:
  `supabase/migrations/0001_init.sql` met de tabellen `klanten`, `aanvragen`, `content_checks`,
  `designs`, `designdatabase` en `feedback`, plus indexen en een `updated_at`-trigger op
  `aanvragen`.
- `supabase/seed.sql` met minimale testdata (2 klanten, 2 aanvragen in verschillende statussen).
- TypeScript-types: `lib/types/domain.ts` (veldtypen, aanvraagstatussen, designstatussen — de
  bron van waarheid, ook voor de frontend) en `lib/types/database.ts` (handgeschreven
  Supabase-achtige Row/Insert/Update-types per tabel).
- `lib/supabase/server.ts` (service-role client, voor API-routes) en `lib/supabase/client.ts`
  (anon-key client, nu nog ongebruikt maar klaar voor later client-side gebruik).
- De drie gevraagde placeholder-functies staan er alvast, los van een concrete pagina:
  `lib/ai/analyzeRequest.ts` (trefwoorden-check op `@` en cijferreeksen), `lib/ai/generateDesign.ts`
  (geeft een vaste testafbeelding terug) en `lib/email/sendProposalEmail.ts` (logt alleen).
  Elk met een `TODO`-comment over de latere echte koppeling.

**Bewust nog niet af / placeholder:**
- Er is geen echt Supabase-project gekoppeld — dat moet nog aangemaakt worden (zie README,
  sectie "Supabase opzetten"). Tot die tijd is dit alleen een migratie-structuur.
- Nog geen Row Level Security-policies: alle toegang loopt nu via de service-role key in
  API-routes, omdat er nog geen login/rechtenbeheer is. Zodra dat er komt, hoort hier RLS bij.
- `designdatabase` heeft nog geen invoerscherm — wordt voorlopig handmatig gevuld door
  De Mediagraaf zodra er referentiedesigns zijn.

## Fase 3, 4 — nog open

Zie hieronder / volgende commits.

## Nog volledig open (bewuste placeholders voor latere sessies)

- Klantformulier en intern overzicht (fases 3–4).
- Echte beeldgeneratie-koppeling (Replicate/fal.ai) in `lib/ai/generateDesign.ts`.
- Echte Claude API-koppeling voor briefanalyse/contentregels in `lib/ai/analyzeRequest.ts`.
- E-mailverzending (Resend) in `lib/email/sendProposalEmail.ts`.
- Login/rechtenbeheer voor het interne overzicht.
- Echt Supabase-project aanmaken en koppelen (nu alleen migratie-structuur).
- Vullen van `/docs/reference`, `/assets/brand` en `/assets/mockups` met echt materiaal van
  De Mediagraaf.
- Lokaal draaien en testen met `npm install` / `npm run dev` (nog niet gedaan in deze sessie
  door het ontbreken van Node.js in de sandbox-omgeving).
