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

## Update — generateDesign() klaargezet voor een echte koppeling ✅

Nog geen account/API-key bij een beeldgeneratie-dienst, dus nog geen echte generatie mogelijk.
Wel de structuur alvast klaargezet zodat het invullen van een key straks voldoende is:

- `lib/ai/generateDesign.ts` is nu async en checkt `REPLICATE_API_TOKEN`. Zonder token (huidige
  situatie) blijft het gewoon de vaste testafbeelding teruggeven — niks verandert voor wie er nu
  mee test. Mét token zou het `genereerAchtergrondMetReplicate()` aanroepen — die functie gooit nu
  bewust een duidelijke "nog niet geïmplementeerd"-foutmelding, met TODO's over de opzet (prompt
  bouwen uit veldtype/wens, idealiter gestuurd door de `designdatabase`-referentiedesigns, dan de
  Replicate API aanroepen).
- Nogmaals expliciet vastgelegd in commentaar: het model tekent alleen de achtergrond/stijl, nooit
  tekst/logo/contactgegevens — die blijven apart en volgens vaste regels geplaatst. Hoe de vrije
  tekst uit de ontwerpwens straks omgezet wordt naar die exacte tekstvelden is nog een open
  ontwerpvraag (staat hieronder in de open lijst).
- `app/api/aanvragen/verwerk-geplande-voorstellen/route.ts` await't `generateDesign()` nu, en
  vangt per aanvraag fouten op (één mislukte aanvraag mag de rest van de batch niet blokkeren).
- `.env.example` uitgebreid met `REPLICATE_API_TOKEN` (optioneel, nog leeg).
- Geverifieerd met `npm run typecheck` en een schone `npm run build` — het gedrag met lege
  `REPLICATE_API_TOKEN` (de huidige situatie) is ongewijzigd getest via de bestaande testknop.

## Update — klantformulier en interne pagina's visueel opgefrist ✅

- **Klantformulier** (`AanvraagForm.tsx`): elke sectie ("Jouw gegevens", "Jouw ontwerpwens") is nu
  een genummerde kaart. Veldtype, afmeting en "Bord" zijn omgezet van dropdown/radio's naar
  klikbare keuzekaarten (`KaartOptie`) — grotere tikvlakken, prettiger op mobiel, en je ziet in
  één oogopslag wat je al gekozen hebt. Bestandsupload-knop en het successcherm (met vinkje) zijn
  ook opgefrist. Functioneel ongewijzigd: dezelfde velden, dezelfde validatie, dezelfde
  `/api/aanvragen`-aanroep.
- **Interne pagina's**: `AANVRAAG_STATUS_KLEUREN` toegevoegd in `lib/types/domain.ts` — één plek
  die bepaalt welke kleur bij welke status hoort (blauw voor nieuw, paars voor voorstel
  verstuurd, groen voor goedgekeurd, rood voor afgewezen, oranje voor geëscaleerd, amber voor in
  behandeling). Gebruikt op zowel `/intern` (tabelbadges) als de detailpagina (badge naast de
  titel). Tabellen op `/intern` en `/intern/klanten` hebben nu een kaart-uiterlijk
  (`rounded-xl`, `shadow-sm`), een hover-effect per rij, en een kleine "X klanten"-teller
  bovenaan de klantenpagina. Detailpagina-secties zijn in dezelfde kaartstijl gezet.
- Geverifieerd met `npm run typecheck`, een schone `npm run build`, en handmatig doorlopen in de
  browser (inclusief een volledige testinzending van het formulier en tijdelijke voorbeelddata
  om de statuskleuren te controleren, daarna weer teruggedraaid).

## Update — voorstel-e-mail en publieke reactiepagina ✅

De "mail-opbouw" die de klant krijgt, plus de pagina waar de knoppen in die e-mail naartoe
moeten linken (zonder die pagina had de e-mail nog geen werkende call-to-action):

- `lib/email/voorstelEmailTemplate.ts`: `bouwVoorstelEmail()` bouwt een volledige HTML-e-mail
  (tabellen + inline styles, zoals gebruikelijk voor e-mailclients) met het ontwerp, een korte
  tekst, en een knop "Bekijk en reageer op je voorstel". Ook een platte-tekstversie.
- `lib/email/sendProposalEmail.ts` gebruikt dit sjabloon nu en logt de opgebouwde e-mail
  (onderwerp + platte tekst) naar de console — nog steeds geen echte verzending (Resend), maar de
  inhoud staat nu klaar.
- Nieuwe publieke pagina `/voorstel/[id]` (geen `/intern`-login nodig, de klant komt hier via de
  link in de e-mail): toont het ontwerp, de ontwerpwens, en twee acties — "Ontwerp goedkeuren" of
  "Feedback geven" (met tekstveld). Toont ook nette tussenstatussen: nog geen ontwerp klaar, of al
  eerder gereageerd (goedgekeurd/afgewezen, met de gegeven feedback erbij).
- Nieuwe publieke route `POST /api/aanvragen/[id]/feedback`: slaat de reactie op in `feedback` en
  zet de status op `goedgekeurd` of `afgewezen`. Weigert een tweede reactie als er al een besluit
  ligt.
- `public/placeholder-ontwerp.svg` toegevoegd: een echte (placeholder) afbeelding in de
  merkkleuren, zodat de e-mail en voorstelpagina ook echt iets tonen in plaats van een kapotte
  afbeeldingslink. `generateDesign()` en de seed-data verwijzen hier nu naar.
- `.env.example`: `APP_URL` toegevoegd (basis-URL om volledige links in de e-mail te bouwen —
  e-mailclients laden geen relatieve paden; valt terug op `http://localhost:3000`).
- Intern detailpagina toont nu ook een kleine miniatuur van elk gegenereerd ontwerp.
- Geverifieerd met `npm run typecheck`, een schone `npm run build`, en handmatig getest in de
  browser: de HTML-e-mail zelf bekeken (via een tijdelijke debug-route, weer verwijderd), en de
  volledige voorstelpagina inclusief het feedbackformulier doorlopen met tijdelijke voorbeelddata
  (daarna teruggedraaid).

## Update — Resend-koppeling klaargezet ✅

Zelfde aanpak als bij `generateDesign()`/Replicate: nog geen Resend-account, dus de structuur
staat klaar zodat het invullen van een key straks voldoende is.

- `resend` npm-package toegevoegd.
- `lib/email/sendProposalEmail.ts` is nu async en checkt `RESEND_API_KEY`. Zonder key (huidige
  situatie) verandert er niks — logt nog steeds naar de console. Mét key roept het echt
  `resend.emails.send()` aan met de al opgebouwde HTML/tekst uit `bouwVoorstelEmail()`, en stuurt
  vanaf de afzender in `RESEND_AFZENDER` (standaard `onboarding@resend.dev`, Resend's
  testadres — werkt zonder een geverifieerd eigen domein).
- `.env.example` uitgebreid met `RESEND_API_KEY` en `RESEND_AFZENDER`.
- `verwerk-geplande-voorstellen/route.ts` await't `sendProposalEmail()` nu.
- Geverifieerd met `npm run typecheck`, een schone `npm run build`, en de testknop op `/intern` —
  gedrag zonder key is ongewijzigd (nog steeds console-log, geen crash).

## Update — algemene polish: favicon, laadstatussen, mobiel gefixt ✅

Brede kwaliteitsronde over de hele site:

- **Favicon** (`app/icon.svg`): het beeldmerk (groen vierkant met "M" + oranje stip) als browser-
  tabblad-icoon, via Next.js' automatische `app/icon.svg`-conventie.
- **Laadstatussen**: nieuwe `components/LaadIndicator.tsx` (spinner + tekst) en `loading.tsx` op
  `/intern`, `/intern/klanten`, `/intern/[id]` en `/voorstel/[id]` — deze pagina's halen data op
  bij Supabase, en toonden daarvoor een blanco scherm tijdens het laden. Nu een nette spinner.
- **Selectie-vinkje**: keuzekaarten in het aanvraagformulier tonen nu een klein groen vinkje
  rechtsboven zodra ze geselecteerd zijn — duidelijker dan alleen een kleurverschil.
- **Mobiel gefixt (echte bug)**: de header knalde op smalle schermen — "De Mediagraaf" en
  "· Conceptor" braken onhandig af naast de menulinks. Op mobiel toont de header nu alleen het
  logo-icoon (tekst verschijnt vanaf `sm:`), en de menulinks zijn iets kleiner/compacter. Getest
  op 375px breed op alle pagina's (homepage, formulier, intern, voorstelpagina) — ziet er nu
  overal netjes uit.
- Geverifieerd met `npm run typecheck`, een schone `npm run build`, en handmatig doorlopen zowel
  op desktop- als mobiel-breedte in de browser.

## Update — check op besteldbaarheid bij afwijkende maat ✅

Extra risico gesignaleerd: bij een **nieuw** bord in een **afwijkende maat** (niet een van de
standaardmaten, via "Anders, namelijk...") weet de tool niet of De Mediagraaf zo'n bord
daadwerkelijk bij de leverancier kan bestellen. Dat mag niet zomaar automatisch doorlopen.

- Nieuwe functie `controleerAfmetingBeschikbaarheid()` in
  `lib/ai/controleerAfmetingBeschikbaarheid.ts`: vlagt de aanvraag alleen bij de combinatie
  "nieuw bord" + niet-standaardmaat (bij "hergebruiken" is dit nooit een probleem, de klant heeft
  het bord al).
- `app/api/aanvragen/route.ts` combineert dit met de bestaande contentcheck; bij een gevonden
  probleem (van beide soorten) krijgt de aanvraag meteen status `geescaleerd`, zodat een
  medewerker het eerst bekijkt voordat het voorstel automatisch naar de klant gaat.
- Label op `/intern` en de detailpagina hernoemd van "Overleg met klant"/"Contentcheck(s)" naar
  het neutralere "Te controleren"/"Checks" — dekt nu zowel "overleg met de klant nodig" als
  "check bij de leverancier nodig".
- Geverifieerd met `npm run typecheck`, een schone `npm run build`, en de functie zelf getest via
  een tijdelijke debug-route (nieuw bord + standaardmaat → geen check; nieuw bord + afwijkende
  maat → gevlagd; hergebruiken + afwijkende maat → geen check) — route daarna verwijderd.

## Update — kwaliteitsronde: lint, kleine bugfix, volledige doorloop ✅

Op verzoek om de site "spik en span" te maken: een grondige kwaliteitscontrole over het geheel.

- **ESLint ingericht** (`.eslintrc.json`, `next/core-web-vitals`) en één echte lint-fout
  gevonden en gefixt: een niet-geëscapet aanhalingsteken in
  `VerwerkGeplandeVoorstellenKnop.tsx`. `npm run lint` is nu volledig schoon.
- **Bugfix**: op de voorstelpagina bleef een oude foutmelding soms zichtbaar staan nadat je van
  "Feedback geven" terug naar "Annuleren" ging, of andersom wisselde — de foutmelding werd niet
  gewist bij het wisselen tussen die twee standen. Gefixt in `VoorstelActies.tsx`.
- **Volledige doorloop**: elke pagina en flow opnieuw getest (homepage, formulier met alle
  combinaties inclusief "Anders, namelijk..." + "nieuw bord", intern overzicht, klanten, detail,
  login/uitloggen, voorstelpagina met alle statussen) — zowel op desktop- als mobielformaat.
  Geen verdere problemen gevonden; een eerder vermoeden van een selectie-bug in de keuzekaarten
  bleek een timing-artefact van de testmethode te zijn (bevestigd met screenshots: selectie werkt
  gewoon correct).
- Geverifieerd met `npm run typecheck`, `npm run lint` en een schone `npm run build`.

## Update — productiepad (Nieuw → In behandeling → Gemaakt) en provincie ✅

Los van de klant-goedkeuringsflow wilde je een simpel, eenknops-doorstuurpad voor de productiekant
van een order, en bij "Gemaakt" sorteren op provincie (bijv. voor het plannen van bezorgroutes).

- **Nieuwe status "Gemaakt"** toegevoegd aan `AANVRAAG_STATUSSEN` (met een teal badge-kleur).
- **Provincie bij de klant**: nieuw verplicht veld in het aanvraagformulier (12 Nederlandse
  provincies, `PROVINCIES` in `lib/types/domain.ts`) en nieuwe kolom `klanten.provincie`.
- **Doorstuur-knoppen** (`StatusActieKnop.tsx`, nieuw): in het overzicht krijgt elke rij met
  status "Nieuw" een knop "Start behandeling" (→ in behandeling), en elke rij met "In
  behandeling" een knop "Markeer als gemaakt" (→ gemaakt) — één klik, geen navigatie naar de
  detailpagina nodig. Dit pad staat los van de bestaande statusdropdown op de detailpagina, die
  alle statussen blijft tonen.
- **Sortering op provincie**: kies je het tabblad "Gemaakt", dan wordt de lijst gesorteerd op
  provincie (alfabetisch) in plaats van op datum.
- Provincie ook zichtbaar op `/intern` (nieuwe kolom), `/intern/klanten` en de detailpagina.
- Seed-data uitgebreid met een vierde klant (Groningen) en twee "gemaakt"-aanvragen om de
  sortering te kunnen demonstreren.
- Geverifieerd met `npm run typecheck`, `npm run lint`, een schone `npm run build`, en handmatig
  getest met tijdelijke voorbeelddata (sortering op provincie bevestigd: Groningen vóór
  Noord-Holland; doorstuur-knoppen tonen de juiste nette foutmelding zonder Supabase, geen crash).

## Update — Aanvragen als kanban-bord met bevestiging ✅

Het tabel+tabbladen-overzicht is omgebouwd naar een kanban-bord: één kolom per status, met
kaarten die je met een pijltje een stap verder zet.

- `/intern` toont nu horizontaal scrollbare kolommen voor alle statussen (Nieuw, In behandeling,
  Voorstel verstuurd, Goedgekeurd, Afgewezen, Geëscaleerd, Gemaakt), elk met het aantal kaarten.
  Alles komt binnen in de kolom "Nieuw".
- `StatusActieKnop.tsx` is omgebouwd tot een rond pijltje-knopje rechtsboven op de kaart (alleen
  zichtbaar op kaarten in "Nieuw" en "In behandeling", waar een volgende productiestap bestaat).
  Vóór het versturen vraagt `window.confirm()` nu expliciet bevestiging: "Weet je zeker dat je de
  aanvraag van [klant] wilt verplaatsen naar '[volgende status]'?" — bij annuleren gebeurt er
  niets.
- De "Gemaakt"-kolom blijft gesorteerd op provincie (zoals eerder gevraagd), de andere kolommen op
  datum van indienen.
- De oude statustabbladen zijn vervallen (de kolommen van het bord tonen nu alle statussen
  tegelijk); de klantfilter (`/intern?klant=...`) vanaf de Klanten-pagina blijft gewoon werken.
- Geverifieerd met `npm run typecheck`, `npm run lint`, een schone `npm run build`, en handmatig
  getest met tijdelijke voorbeelddata — inclusief het bevestigingsdialoogje (bevestigd via de
  consolelog dat de juiste vraag met de juiste doel-status verschijnt; native dialogs worden in
  deze testomgeving automatisch onderdrukt, wat in een echte browser niet gebeurt).

## Update — Laatste kolom hernoemd naar "Klaar voor levering" ✅

Op basis van een schermafbeelding van hoe het bord eruit moet zien: de laatste kanban-kolom heet
nu "Klaar voor levering" in plaats van "Gemaakt" (alle 7 kolommen blijven staan, alleen het label
is aangepast).

- `AANVRAAG_STATUS_LABELS.gemaakt` en het knoplabel in `VOLGENDE_PRODUCTIESTATUS.in_behandeling`
  in `lib/types/domain.ts` zijn bijgewerkt — de statuswaarde zelf (`"gemaakt"`) blijft ongewijzigd,
  dus er is geen database-migratie nodig.
- Geverifieerd met `npm run typecheck`, `npm run lint`, een schone `npm run build`, en handmatig
  getest met tijdelijke voorbeelddata (kolomkop en de knoptekst "Markeer als klaar voor levering"
  tonen allebei de nieuwe naam).

## Update — Aanvragen terug naar klikbare statusvakjes (één status per keer) ✅

Het kanban-bord met alle kolommen tegelijk zichtbaar bleek niet de gewenste interactie: in plaats
daarvan is `/intern` nu een rij klikbare "vakjes" (één per status, met aantal), waarbij je per
klik maar de aanvragen van dát vakje ziet.

- Standaard staat het vakje "Nieuw" actief (`/intern`); klikken op bijv. "In behandeling" navigeert
  naar `/intern?status=in_behandeling` en toont alleen die aanvragen eronder, als kaarten (niet
  meer als tabel).
- De pijltje-knop (`StatusActieKnop`) en het bevestigingsdialoogje op elke kaart werken ongewijzigd
  — na het doorzetten verdwijnt de kaart automatisch uit de huidige status-weergave.
- Bij het vakje "Klaar voor levering" blijven de kaarten op provincie gesorteerd in plaats van op
  datum.
- Geverifieerd met `npm run typecheck`, `npm run lint`, een schone `npm run build`, en handmatig
  getest met tijdelijke voorbeelddata (klikken tussen vakjes toont steeds de juiste, enkele groep
  aanvragen).

## Update — Voorbeelddata zichtbaar in /intern zonder Supabase-project ✅

Zonder Supabase-project toonden de interne overzichtspagina's alleen een rode foutmelding —
daardoor leek het alsof wijzigingen niet werkten wanneer je ze zelf in de browser bekeek. De
pagina's vallen nu automatisch terug op voorbeelddata (een statische kopie van
`supabase/seed.sql`) zodra Supabase niet gekoppeld is, met een duidelijke gele banner erboven.

- Nieuw: `lib/demo/voorbeelddata.ts` met dezelfde klanten/aanvragen/checks/designs als
  `supabase/seed.sql`, en `isSupabaseGeconfigureerd()` in `lib/supabase/server.ts`.
- `/intern`, `/intern/klanten` en `/intern/[id]` gebruiken deze voorbeelddata als terugval, met
  de tekst "Je ziet nu voorbeelddata — er is nog geen Supabase-project gekoppeld" erboven, zodat
  nooit de indruk ontstaat dat het om echte aanvragen/klanten gaat.
- Schrijfacties (pijltje-knop, statusdropdown, aanvraagformulier) blijven ongewijzigd een
  duidelijke Supabase-foutmelding geven zodra je ze gebruikt — dit verandert alleen het
  **bekijken** van bestaande (voorbeeld)data.
- Geverifieerd met `npm run typecheck`, `npm run lint`, een schone `npm run build`, en
  handmatig getest in de browser (alle drie pagina's tonen nu meteen bruikbare voorbeeldkaarten,
  zonder tijdelijke code-aanpassingen).

## Update — Nieuw tabblad "Concepten", Aanvragen alleen nog productieflow ✅

`/intern` (Aanvragen) had te veel vakjes: zodra een aanvraag daar binnenkomt is de klant het
voorstel immers al gepasseerd. De klant-goedkeuringsflow (voorstel versturen, wachten op reactie,
afwijzen/escaleren) is daarom verplaatst naar een nieuw tabblad "Concepten", naast Aanvragen en
Klanten.

- `/intern` (Aanvragen) toont nu alleen nog de 3 productievakjes: Nieuw, In behandeling, Klaar
  voor levering (`PRODUCTIE_STATUSSEN` in `lib/types/domain.ts`). De knop "Verwerk geplande
  voorstellen (test)" is hier weggehaald.
- Nieuw: `/intern/concepten` toont de 4 klant-goedkeuringsvakjes: Voorstel verstuurd,
  Goedgekeurd, Afgewezen, Geëscaleerd (`CONCEPT_STATUSSEN`). Per kaart zie je het laatst
  gegenereerde ontwerp (versie + status + thumbnail), de laatste klantreactie (goedgekeurd/
  afgewezen + feedbacktekst), en bij een geëscaleerde aanvraag de gevonden contentcheck. De
  testknop "Verwerk geplande voorstellen" staat nu hier, want dat is precies de stap waarbij de
  AI een concept genereert en de voorstel-mail verstuurt.
- `InternNav.tsx` toont nu 3 tabbladen: Aanvragen, Concepten, Klanten.
- De onderliggende status (`aanvragen.status`, nog steeds 7 waarden) en de detailpagina
  (`/intern/[id]`, met de volledige statusdropdown) zijn ongewijzigd — dit is puur een opsplitsing
  in hoe `/intern` de bestaande statussen toont.
- `supabase/seed.sql` en `lib/demo/voorbeelddata.ts` uitgebreid met 3 extra klanten/aanvragen
  (status goedgekeurd/afgewezen/geëscaleerd, met bijpassende designs/feedback/content_check) zodat
  alle vakjes op Concepten iets te tonen hebben.
- Geverifieerd met `npm run typecheck`, `npm run lint`, een schone `npm run build`, en handmatig
  getest in de browser (alle 4 Concepten-vakjes en alle 3 Aanvragen-vakjes tonen de juiste
  voorbeeldkaarten).

## Update — Escaleren en "afgewezen" als doodlopend eindpunt verwijderd ✅

Het systeem had drie statussen die eigenlijk nergens toe leidden zonder handmatig ingrijpen:
"geëscaleerd" (contentcheck-escalatie) en "afgewezen"/"goedgekeurd" (klantreactie als eindpunt).
Die zijn nu allemaal verwijderd — `AANVRAAG_STATUSSEN` bestaat nog maar uit 4 waarden: nieuw,
in_behandeling, voorstel_verstuurd, gemaakt.

- **Geen escalatie meer:** een contentcheck (telefoonnummer/e-mailadres gedetecteerd, of een
  afwijkende maat bij een nieuw bord) blokkeert niets meer. De aanvraag start altijd gewoon op
  "nieuw"; het gevonden probleem blijft gewoon zichtbaar als "Te controleren"-badge (ongewijzigd),
  alleen zonder aparte status eromheen.
- **Goedgekeurd → recht naar Aanvragen "Nieuw":** `POST /api/aanvragen/[id]/feedback` zet de
  status bij goedkeuring nu op `"nieuw"` in plaats van `"goedgekeurd"` — de aanvraag verschijnt
  meteen in de productieflow. De klantreactie zelf blijft gewoon bewaard in de `feedback`-tabel
  (zichtbaar op de detailpagina en op Concepten).
- **Afgewezen → AI mailt automatisch een herzien concept terug:** in plaats van een dode
  "afgewezen"-status genereert en verstuurt de feedback-route nu meteen een nieuwe
  conceptversie (`generateDesign()` + `sendProposalEmail()` met een "herzien concept"-variant
  van de mailtekst, zie `lib/email/voorstelEmailTemplate.ts`), terwijl de aanvraag gewoon
  "voorstel_verstuurd" blijft — de klant kan dus opnieuw reageren. Een mislukte regeneratie
  blokkeert de opgeslagen feedback van de klant niet (try/catch, net als bij de geplande-
  voorstellen-batch).
- **Dubbele verwerking voorkomen:** `POST /api/aanvragen/verwerk-geplande-voorstellen` (de
  "Verwerk geplande voorstellen"-testknop) sloeg aanvragen met status "nieuw" op die hun
  geplande tijdstip gepasseerd zijn — maar "nieuw" is nu ook de status van een net goedgekeurde
  aanvraag. De route slaat nu aanvragen over die al minstens één design hebben, zodat een
  goedgekeurde aanvraag niet per ongeluk nóg een voorstel-mail krijgt.
- `/voorstel/[id]` (publieke klantpagina) checkt nu de laatste `feedback`-rij in plaats van
  `aanvraag.status` om te bepalen of er al goedgekeurd is, en toont bij een eerdere afwijzing een
  korte melding ("we hebben je feedback verwerkt") boven het nieuwe concept in plaats van een
  doodlopend "bedankt voor je feedback"-scherm.
- `/intern/concepten` toont nu, omdat er nog maar één openstaande status (`voorstel_verstuurd`)
  over is, geen vakjes meer maar een directe lijst met per aanvraag een tijdlijn van
  conceptversies + klantreacties door elkaar — zo zie je in één oogopslag het "heen-en-weer
  mailen" bij een afwijzing.
- `supabase/migrations/0001_init.sql` (CHECK-constraint), `supabase/seed.sql` en
  `lib/demo/voorbeelddata.ts` bijgewerkt: de 3 voorbeeldaanvragen die eerder goedgekeurd/
  afgewezen/geëscaleerd demonstreerden, laten nu respectievelijk zien: een goedgekeurde aanvraag
  terug op "nieuw", een afgewezen aanvraag met een tweede (herziene) conceptversie op
  "voorstel_verstuurd", en een "Te controleren"-aanvraag gewoon op "nieuw".
- Geverifieerd met `npm run typecheck`, `npm run lint`, een schone `npm run build`, en handmatig
  getest in de browser (Aanvragen "Nieuw" toont de teruggekeerde goedgekeurde aanvraag en de
  "Te controleren"-aanvraag; Concepten toont de volledige concept-/feedbacktijdlijn inclusief de
  herziene tweede versie na afwijzing).

## Update — "Loopt vast"-signaal bij 2x afwijzen op Concepten ✅

De AI blijft nu automatisch concepten herzien en mailen na een afwijzing, maar als de klant
hetzelfde voorstel twee keer op rij afwijst, komt de AI er zelf kennelijk niet uit — dat moet dan
een medewerker oppakken. Concepten splitst daarom de openstaande voorstellen in twee groepen.

- Nieuwe sectie bovenaan `/intern/concepten`: **"Loopt vast"** — toont elke aanvraag met 2 of meer
  afwijzingen (`LOOPT_VAST_VANAF` in `app/intern/(besloten)/concepten/page.tsx`), met een rode
  "Nx afgewezen"-badge en een korte uitleg ("neem persoonlijk contact op").
  Aanvragen met 0 of 1 afwijzing blijven gewoon in de bestaande "Voorstel verstuurd"-sectie staan.
  De kaart zelf (tijdlijn, contentcheck-badge, Bekijken-link) is ongewijzigd, nu alleen gedeeld via
  een `ConceptKaartWeergave`-component i.p.v. inline gedupliceerde JSX.
- `lib/demo/voorbeelddata.ts` en `supabase/seed.sql`: de Erik Mulder-aanvraag heeft nu een tweede
  afwijzing + een derde conceptversie, zodat "Loopt vast" direct een voorbeeld te zien heeft.
- Geen statuswijziging of database-aanpassing nodig — dit is puur een telling over de bestaande
  `feedback`-rijen per aanvraag, dus geen migratie nodig.
- Geverifieerd met `npm run typecheck`, `npm run lint`, een schone `npm run build`, en handmatig
  getest in de browser (Erik Mulder verschijnt nu bovenaan bij "Loopt vast" met "2x afgewezen",
  Marieke Visser blijft gewoon bij "Voorstel verstuurd").

## Nog volledig open (bewuste placeholders voor latere sessies)

- Open ontwerpvraag: hoe wordt de vrije tekst uit de ontwerpwens (sponsornaam, slogan, ...)
  omgezet naar de exacte tekstvelden die apart op het ontwerp geplaatst worden? Handmatig door
  een medewerker, of een latere geautomatiseerde stap?
- `genereerAchtergrondMetReplicate()` in `lib/ai/generateDesign.ts` echt implementeren zodra er
  een Replicate-account/API-key is.
- `RESEND_API_KEY` invullen zodra er een Resend-account is — de koppeling zelf staat al klaar.

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
- Echt Supabase-project aanmaken en koppelen (nu alleen migratie-structuur) en de
  `SUPABASE_STORAGE_BUCKET` daadwerkelijk aanmaken.
- Vullen van `/docs/reference`, `/assets/brand` en `/assets/mockups` met echt materiaal van
  De Mediagraaf.
