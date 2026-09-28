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

## Fase 3 — Klantformulier (frontend) ✅

- `/aanvraag`-pagina met een formulier (`app/aanvraag/AanvraagForm.tsx`): veldtype-keuze,
  klantgegevens (naam, bedrijf, e-mail, telefoon), ontwerpwens/tekst, en een optionele
  bestandsupload.
- `POST /api/aanvragen` (`app/api/aanvragen/route.ts`) verwerkt de inzending: maakt/hergebruikt
  een klant op basis van e-mailadres, maakt de aanvraag aan met status `nieuw`, uploadt een
  eventuele bijlage naar Supabase Storage, en slaat het pad op in `aanvragen.bijlage_pad`.
- De contentcheck (`analyzeRequest()`, nog een placeholder) wordt bij het indienen uitgevoerd en
  de resultaten worden weggeschreven in `content_checks`, zodat het datamodel end-to-end werkt.
- Stijl gebaseerd op de merkkleuren van De Mediagraaf (groen/oranje/zwart), bewust rustig en
  simpel gehouden — dit is een intern prototype, geen marketingsite.

**Bewust nog niet af / placeholder:**
- Een gevonden contentcheck-probleem blokkeert de aanvraag in dit fundament nog niet en
  verandert de status ook nog niet automatisch naar `geescaleerd` — dat hoort bij een latere fase
  waarin De Mediagraaf ook echt een seintje krijgt.
- De geüploade bijlage wordt alleen opgeslagen, niet verwerkt of getoond in het interne
  overzicht (nog geen preview/download-link).
- `generateDesign()` wordt hier bewust nog **niet** aangeroepen — de aanvraag komt binnen met
  status `nieuw` en blijft daar staan tot een latere sessie het genereren van een concept-ontwerp
  daadwerkelijk aan de flow koppelt.
- Geen client-side validatie verder dan HTML `required`-attributen; geen bestandsgrootte-limiet;
  geen unieke constraint op `klanten.email` (hergebruik gebeurt nu via een losse lookup-query).

## Fase 4 — Intern overzicht ✅

- `/intern`-pagina (server component, `app/intern/page.tsx`) die alle aanvragen toont met
  klantnaam, bedrijf, veldtype, status en tijdstip, gesorteerd op meest recent, plus of er een
  contentcheck is die geblokkeerd staat.
- Haalt `aanvragen`, `klanten` en `content_checks` apart op en koppelt ze in JavaScript, zodat de
  Supabase-typing simpel blijft zolang `lib/types/database.ts` handgeschreven is (nog geen
  relatie-/embed-typing zoals gegenereerde Supabase-types die hebben).
- Toont een duidelijke foutmelding in plaats van te crashen als Supabase niet geconfigureerd is
  of een query faalt.
- Nog geen login/rechtenbeheer — de pagina is voor iedereen die de URL kent bereikbaar, zoals
  afgesproken ("dat komt later").

**Bewust nog niet af / placeholder:**
- Geen acties vanuit dit overzicht (bijv. status handmatig wijzigen, voorstel versturen) — puur
  ter simulatie van hoe De Mediagraaf dit later zou gebruiken.
- Geen paginering/filtering; bij weinig testdata niet nodig.
- Toont nog niet of er een bijlage is meegestuurd of wat de inhoud van de ontwerpwens is
  (bewust beperkt tot een overzichtstabel).

## Update — producttypen toegevoegd, daarna weer teruggedraaid ✅

Na testen eerst uitgebreid met een `producttype`-keuze (reclamebord / visitekaartje / bord in
een andere maat), inclusief een aparte migratie, drie klikbare kaarten op de homepage en
conditionele formuliervelden. Na overleg met de stagebegeleider is de scope weer teruggebracht:
**de tool focust puur op reclameborden**, visitekaartjes vervallen volledig.

Omdat er nog nooit een echt Supabase-project gekoppeld is geweest (dus de eerdere migratie ook
nergens daadwerkelijk is uitgevoerd), is het schema rechtstreeks teruggebracht in plaats van er
een omslachtige revert-migratie overheen te zetten:

- `lib/types/domain.ts`: `Producttype` verwijderd. `andere-maat` is toegevoegd als vijfde
  waarde van `Veldtype` zelf — geen apart product, gewoon een reclamebord dat niet in de
  standaardmaten past.
- `supabase/migrations/0001_init.sql`: rechtstreeks aangepast (geen aparte
  `0002_producttypen.sql` meer) — `aanvragen.veldtype` staat weer `not null`, met `'andere-maat'`
  als extra toegestane waarde, en een nieuwe nullable `aanvragen.afmeting`-kolom voor die keuze.
- Formulier (`AanvraagForm.tsx`): weer één simpele veldtype-select (nu met 5 opties); het
  "gewenste afmeting"-veld verschijnt alleen bij "Andere maat".
- Homepage (`app/page.tsx`): teruggebracht naar één duidelijk welkomstbericht met één
  call-to-action ("Nieuwe aanvraag indienen") — de maatkeuze zit in het formulier, niet meer op
  de homepage.
- `/intern` toont weer een "Veldtype"-kolom (met de ingevulde afmeting erbij tussen haakjes bij
  "Andere maat").
- Geverifieerd met `npm run typecheck`, `npm run build` en handmatig getest in de browser.

## Update — tijdelijk beeldmerk en levendigere homepage ✅

Er is nog geen logo-bestand van De Mediagraaf aangeleverd (komt later). Om niet te wachten:

- `components/MediagraafLogo.tsx`: een simpel, herbruikbaar beeldmerk (groen vierkant met "M" +
  oranje accentstip) in de merkkleuren, met een `donkereAchtergrond`-variant voor op de zwarte
  header. Duidelijk gemarkeerd als tijdelijk — vervang de inhoud van dit ene component door het
  echte logo zodra dat er is, de rest van de app hoeft niet aangepast te worden.
- Header (`app/layout.tsx`) gebruikt nu dit component in plaats van platte tekst.
- Homepage (`app/page.tsx`) opnieuw ingericht: een hero-sectie met zachte kleurverloop-achtergrond
  en het grote beeldmerk, plus een korte "hoe werkt het"-uitleg in 3 stappen (wens vertellen →
  wij ontwerpen → jij keurt goed) voor wat meer leven zonder overdreven te worden — dit blijft
  een intern prototype.
- Geverifieerd met `npm run typecheck`, een schone `npm run build`, en visueel gecontroleerd in
  de browser op zowel de homepage als de header van de andere pagina's.

## Update — afmeting kiezen uit lijst óf zelf invullen ✅

Bij "Jouw ontwerpwens" kan de klant nu een afmeting kiezen uit een lijst met veelvoorkomende
maten, of via "Anders, namelijk..." zelf een maat intypen:

- `lib/types/domain.ts`: `STANDAARD_AFMETINGEN` toegevoegd — **placeholder-waarden** (200/300/
  400/600 x 100 cm), duidelijk gemarkeerd met een TODO. **De stagebegeleider bepaalt nog de
  daadwerkelijke standaardmaten van De Mediagraaf — deze lijst moet dan bijgewerkt worden.**
  Ook `AFMETING_ANDERS` toegevoegd (sentinel-waarde voor de "Anders, namelijk..."-optie).
- Het losse veldtype "andere-maat" is vervallen (overbodig geworden nu elke aanvraag sowieso een
  afmeting heeft) — `VELDTYPEN` bevat weer de originele 4 waarden.
- `aanvragen.afmeting` is nu verplicht (`not null`) in plaats van optioneel, zowel in de
  migratie, de TypeScript-types als de API-validatie.
- Formulier: een select met de standaardmaten + "Anders, namelijk...", die bij die laatste keuze
  een extra tekstveld toont. Vóór het versturen wordt de sentinel-waarde in JS vervangen door de
  ingevulde eigen maat, zodat de server altijd gewoon een leesbare afmeting binnenkrijgt.
- `/intern` toont veldtype + afmeting altijd samen (bijv. "Scorebord (200 x 100 cm)").
- Geverifieerd met `npm run typecheck`, een schone `npm run build`, en handmatig getest
  (inclusief de "Anders, namelijk..."-flow) in de browser.

**TODO (staat ook hieronder in de open lijst):** vervang de placeholder-standaardmaten door de
daadwerkelijke maten zodra de stagebegeleider die heeft vastgesteld.

## Update — hergebruiken of nieuw bord aanschaffen ✅

Extra keuze toegevoegd bij "Jouw ontwerpwens": heeft de klant al een bruikbaar bord, of moet er
een nieuw bord komen? Relevant voor De Mediagraaf omdat een nieuw bord (materiaal + montage)
extra kosten met zich meebrengt.

- `lib/types/domain.ts`: `BordAanschaf` (`hergebruiken` / `nieuw`) toegevoegd.
- `supabase/migrations/0001_init.sql`: nieuwe verplichte kolom `aanvragen.bord_aanschaf`.
- Formulier: twee radiobuttons, met een kleine toelichting eronder dat een nieuw bord extra
  kosten met zich meebrengt.
- `/intern` toont een "Bord"-kolom; bij "nieuw" een oranje badge zodat dit in één oogopslag
  opvalt (kostenimplicatie).
- Geverifieerd met `npm run typecheck`, een schone `npm run build`, en handmatig getest in de
  browser.

## Update — bewuste vertraging vóór het voorstel (voelt menselijker) ✅

Expliciete wens: een klant mag niet binnen een minuut een voorstel terugkrijgen, want dat
verraadt meteen dat het AI is. Er zit nu altijd 45-60 minuten tussen het indienen en het (nog
placeholder) voorstel:

- `lib/planning/voorstelPlanning.ts`: `berekenVoorstelGeplandOp()` bepaalt bij het indienen een
  willekeurig tijdstip 45-60 minuten later. De bandbreedte staat in `VOORSTEL_VERTRAGING_MINUTEN`
  (makkelijk aan te passen).
- `aanvragen.voorstel_gepland_op` (nieuwe verplichte kolom) legt dat tijdstip vast.
- Nieuwe route `POST /api/aanvragen/verwerk-geplande-voorstellen`: verwerkt alle aanvragen met
  status `nieuw` waarvan dat tijdstip inmiddels verstreken is — roept de placeholders
  `generateDesign()` en `sendProposalEmail()` aan, slaat het ontwerp op, en zet de status op
  `voorstel_verstuurd`.
- `/intern` toont een "Voorstel gepland op"-kolom, plus een testknop
  ("Verwerk geplande voorstellen") die deze route handmatig aanroept — puur om lokaal te kunnen
  testen zolang er geen echte scheduler draait.

**Bewust nog niet af:** dit endpoint wordt nu alleen handmatig (via de testknop) of los
aangeroepen; het moet in productie periodiek en automatisch draaien via een echte scheduler
(Vercel Cron of Supabase `pg_cron`), en dan ook beveiligd worden met een secret zodat niet
zomaar iedereen het kan aanroepen. Zie de TODO-comment in
`app/api/aanvragen/verwerk-geplande-voorstellen/route.ts`.

## Update — interne pagina: login, detailweergave, status aanpassen ✅

Drie verbeteringen aan het interne overzicht tegelijk opgepakt:

- **Login/rechtenbeheer**: `/intern` (en alle sub-pagina's) zijn nu afgeschermd met een
  gedeeld-wachtwoord-poort. `middleware.ts` stuurt niet-ingelogde bezoekers naar `/intern/login`;
  na een correct wachtwoord (uit de env-variabele `INTERN_WACHTWOORD`) wordt een httpOnly cookie
  gezet (`lib/auth/internSessie.ts`, 12 uur geldig). Een "Uitloggen"-knop staat rechtsboven op
  `/intern`. **Dit is bewust een simpele, gedeelde poort — geen individuele medewerkersaccounts.**
  Vervang dit door Supabase Auth zodra er een project gekoppeld is.
- **Detailweergave per aanvraag** (`/intern/[id]`): toont alle klant- en bordgegevens, de volledige
  ontwerpwens, bijlage-pad (nog geen downloadlink — wacht op een echt Supabase Storage-project),
  contentcheck-resultaten, gegenereerde ontwerpen en klantfeedback. Elke rij in het overzicht
  linkt hiernaartoe via "Bekijken →".
- **Status handmatig aanpassen**: op de detailpagina kan een medewerker de status van een
  aanvraag wijzigen via `PATCH /api/aanvragen/[id]/status` (ook beveiligd door de middleware).

Geverifieerd met `npm run typecheck`, een schone `npm run build`, en de hele inlogflow handmatig
doorlopen in de browser (fout wachtwoord → foutmelding; juist wachtwoord → toegang; uitloggen →
weer afgeschermd; rechtstreeks naar `/intern/<id>` zonder login → ook geredirect).

## Update — Klanten-sectie, statusfilters en sub-navigatie in /intern ✅

Het interne overzicht was één platte tabel; nu is het opgedeeld in twee secties met een
duidelijke sub-navigatie:

- De afgeschermde /intern-pagina's zijn verplaatst naar een route group
  `app/intern/(besloten)/` met een gedeelde `layout.tsx` (sub-nav "Aanvragen" / "Klanten" +
  de "Uitloggen"-knop). De inlogpagina zelf (`/intern/login`) valt hier bewust buiten. De URL's
  blijven ongewijzigd (`/intern`, `/intern/[id]`) — een route group is onzichtbaar in het pad.
- **Aanvragen** (`/intern`): statustabbladen bovenaan ("Alle", "Nieuw", "In behandeling",
  "Voorstel verstuurd", "Goedgekeurd", "Afgewezen", "Geëscaleerd") met een teller per status, als
  link naar `/intern?status=...`. "Goedgekeurd" is bijvoorbeeld meteen de "orders die klaar
  zijn"-weergave.
- **Klanten** (`/intern/klanten`, nieuw): overzicht van alle klanten met contactgegevens en het
  aantal aanvragen (met een oranje badge voor het aantal nog lopende aanvragen). Een link per
  klant filtert de aanvragen-pagina op die klant (`/intern?klant=<id>`).
- Geverifieerd met `npm run typecheck`, een schone `npm run build`, en handmatig doorlopen in de
  browser (sub-nav, statustabbladen met tellingen, Klanten-pagina, detailpagina — allemaal nog
  met de bekende nette foutmelding zolang er geen echt Supabase-project is).

**Bewust nog niet af:** de status- en klantfilters werken nu los van elkaar (kiezen van een
status-tab reset een actief klantfilter, en andersom) — prima voor dit stadium, maar geen
combinatie van beide filters tegelijk.

## Update — contentcheck escaleert i.p.v. verbiedt ✅

Discussie: sommige klanten willen bewust hun telefoonnummer op het bord, en de tool moet niet
voor iedereen hard bepalen dat dit niet mag. Aangepast:

- `app/api/aanvragen/route.ts`: `analyzeRequest()` wordt nu vóór het opslaan van de aanvraag
  uitgevoerd. Vindt de check een contactgegeven, dan krijgt de aanvraag meteen status
  `geescaleerd` in plaats van `nieuw` — De Mediagraaf krijgt het dus te zien en beslist zelf, in
  overleg met de klant, of het akkoord is. Geen automatische afwijzing van de klant.
- Omdat `verwerk-geplande-voorstellen` alleen aanvragen met status `nieuw` oppakt, wordt er voor
  een geëscaleerde aanvraag ook geen voorstel automatisch gegenereerd/verstuurd totdat een
  medewerker de status zelf verzet (via de detailpagina).
- Labels op `/intern` en de detailpagina aangepast van "Geblokkeerd (probleem)" naar
  "Overleg met klant" — minder alsof het verboden is, meer een seintje om het te bespreken.
- `lib/ai/analyzeRequest.ts`: toelichtingsteksten en commentaar aangepast in dezelfde geest.
- Geverifieerd met `npm run typecheck` en een schone `npm run build`.

## Nog volledig open (bewuste placeholders voor latere sessies)

- Scheduler koppelen (Vercel Cron / Supabase `pg_cron`) die
  `POST /api/aanvragen/verwerk-geplande-voorstellen` automatisch en beveiligd aanroept, in plaats
  van de handmatige testknop op `/intern`.
- Individuele medewerkersaccounts (Supabase Auth) in plaats van de huidige gedeelde-
  wachtwoord-poort voor `/intern`.
- Downloadlink voor bijlagen op de detailpagina (`/intern/[id]`) zodra Supabase Storage echt werkt.
- **TODO van de stagebegeleider:** de daadwerkelijke standaard-afmetingen van De Mediagraaf
  bepalen en `STANDAARD_AFMETINGEN` in `lib/types/domain.ts` bijwerken (nu placeholder-waarden).
- Echte beeldgeneratie-koppeling (Replicate/fal.ai) in `lib/ai/generateDesign.ts`.
- Echte Claude API-koppeling voor briefanalyse/contentregels in `lib/ai/analyzeRequest.ts`.
- E-mailverzending (Resend) in `lib/email/sendProposalEmail.ts`.
- Echt Supabase-project aanmaken en koppelen (nu alleen migratie-structuur) en de
  `SUPABASE_STORAGE_BUCKET` daadwerkelijk aanmaken.
- Vullen van `/docs/reference`, `/assets/brand` en `/assets/mockups` met echt materiaal van
  De Mediagraaf.
