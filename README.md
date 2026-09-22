# Mediagraaf Conceptor

Schoolproject (Bedrijfskunde-stage, AI-workshop) voor **De Mediagraaf**, een grafisch bedrijf in
Oudewater.

## Projectdoel

Op de lange termijn moet dit een tool worden waarmee klanten zelf een ontwerpwens voor een
reclamebord indienen (voornamelijk borden langs voetbal- en hockeyvelden, soms scoreborden of
plattegronden). De tool stuurt binnen ongeveer een uur een concept-ontwerp terug. De klant keurt
dit goed of af met feedback; bij afwijzing krijgt De Mediagraaf een seintje om mee te kijken.

Belangrijk uitgangspunt: het resultaat mag nooit aanvoelen als een generiek AI-plaatje.

- De achtergrond/stijl mag door een AI-model gegenereerd worden, gefinetuned op de eigen,
  niet-AI-gemaakte designs van De Mediagraaf (zie de `designdatabase`-tabel).
- **Tekst, logo en contactgegevens worden nooit door dat model getekend.** Die worden apart en
  volgens vaste regels op het ontwerp geplaatst, zodat alles altijd leesbaar en correct is.
- Er gelden harde contentregels: bepaalde informatie (zoals een e-mailadres of telefoonnummer)
  hoort niet op een reclamebord thuis, ongeacht hoe goed het gerenderd is, en wordt eruit
  gefilterd.

## Scope van deze versie

Dit is bewust alleen het **fundament**: een werkende, nette basis waar in latere sessies stap
voor stap functionaliteit aan wordt toegevoegd. Er zit hier nog:

- **Geen** echte koppeling met een beeldgeneratiemodel (Replicate/fal.ai) — zie
  [`lib/ai/generateDesign.ts`](lib/ai/generateDesign.ts), een duidelijk gemarkeerde placeholder
  die nu een vaste testafbeelding teruggeeft.
- **Geen** echte Claude API-koppeling voor briefanalyse/contentregels — zie
  [`lib/ai/analyzeRequest.ts`](lib/ai/analyzeRequest.ts), die nu een eenvoudige
  trefwoorden-check doet (zoekt naar een `@` of een cijferreeks die op een telefoonnummer lijkt).
- **Geen** e-mailverzending — zie [`lib/email/sendProposalEmail.ts`](lib/email/sendProposalEmail.ts),
  een placeholder die nu alleen logt wat er verstuurd zou worden.

Zie [`PROGRESS.md`](PROGRESS.md) voor de actuele status per fase.

## Architectuurkeuzes

- **Next.js (App Router, TypeScript)** — één project voor zowel het klantformulier als het
  interne overzicht, met API-routes voor serverlogica. Geen aparte backend nodig voor dit
  stadium.
- **Supabase/Postgres** als datalaag. Het schema staat als SQL-migratie in
  [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), zodat het met de
  Supabase CLI (`supabase db push`) op een echt project gezet kan worden zodra dat er is. Tot die
  tijd is dit puur een migratie-structuur; er is nog geen Supabase-project aan gekoppeld.
- **Server-side Supabase-toegang met de service-role key** ([`lib/supabase/server.ts`](lib/supabase/server.ts)).
  Er is nog geen login/rechtenbeheer, dus alle databasetoegang loopt bewust via API-routes in
  plaats van rechtstreeks vanuit de browser. Zodra rechtenbeheer wordt toegevoegd, verschuift dit
  naar Row Level Security-policies met de anon-key ([`lib/supabase/client.ts`](lib/supabase/client.ts)
  staat daar al voor klaar, maar wordt nu nog niet gebruikt).
- **Tailwind CSS** met de merkkleuren van De Mediagraaf (`brand.groen` `#5FB238`,
  `brand.oranje` `#E8792A`, `brand.zwart` `#111111`) als theme-extensie in
  [`tailwind.config.ts`](tailwind.config.ts).
- **Domeintypes centraal** in [`lib/types/domain.ts`](lib/types/domain.ts) (veldtypen,
  aanvraagstatussen, designstatussen) — zowel de frontend als de databasetypes in
  [`lib/types/database.ts`](lib/types/database.ts) verwijzen hiernaar, zodat er één bron van
  waarheid is voor toegestane waarden. Houd dit in lijn met de CHECK-constraints in de
  SQL-migratie.

## Mapstructuur

```
app/                     Next.js App Router: pagina's en API-routes
  aanvraag/              Klantformulier
  intern/                Intern overzicht van aanvragen
  api/aanvragen/         API-route die aanvragen aanmaakt en opslaat
lib/
  ai/                    Placeholder-functies analyzeRequest() en generateDesign()
  email/                 Placeholder-functie sendProposalEmail()
  supabase/              Server- en browser-Supabase-clients
  types/                 Domeintypes en (handgeschreven) Supabase-databasetypes
  constants/             Merkkleuren
supabase/
  migrations/            SQL-schema (klanten, aanvragen, content_checks, designs,
                         designdatabase, feedback)
  seed.sql               Minimale testdata
docs/reference/          Later aan te vullen met organisatieanalyse, stagewerkplan, e.d.
assets/brand/            Merkmateriaal van De Mediagraaf (kleuren nu, logo later)
assets/mockups/          Later te vullen met eigen veldfoto's per veldtype
```

## Lokaal draaien

Deze code is in een sandbox-omgeving zonder Node.js geschreven en dus **nog niet lokaal getest**.
Draai het als volgt op een machine met Node.js 18+ geïnstalleerd:

```bash
npm install
cp .env.example .env.local
# vul .env.local met de gegevens van een Supabase-project
npm run dev
```

Zonder ingevulde Supabase-omgevingsvariabelen geven de formulierpagina en het interne overzicht
een duidelijke foutmelding in plaats van een crash.

### Supabase opzetten

1. Maak een gratis project aan op [supabase.com](https://supabase.com) (of gebruik de Supabase
   CLI voor een lokale instantie).
2. Voer de migratie uit: `supabase db push` (met de CLI gekoppeld aan je project) of plak de
   inhoud van `supabase/migrations/0001_init.sql` in de SQL-editor van het dashboard.
3. Voeg optioneel testdata toe met `supabase/seed.sql`.
4. Maak een Storage-bucket aan met de naam uit `SUPABASE_STORAGE_BUCKET` (standaard
   `aanvraag-bijlagen`) voor de bijlagen die klanten uploaden.
5. Kopieer de Project URL, anon key en service role key naar `.env.local`.
