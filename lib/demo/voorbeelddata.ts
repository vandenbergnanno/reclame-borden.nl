// Statische kopie van supabase/seed.sql, gebruikt als terugval voor de interne
// overzichtspagina's zolang er nog geen echt Supabase-project gekoppeld is (zie
// `isSupabaseGeconfigureerd()` in lib/supabase/server.ts). Puur om de interface zelf te kunnen
// bekijken en testen — dit is geen vervanging van een database en wordt nooit beschreven.
import type { Database } from "@/lib/types/database";
import { bouwVoorstelEmail } from "@/lib/email/voorstelEmailTemplate";

type KlantRow = Database["public"]["Tables"]["klanten"]["Row"];
type AanvraagRow = Database["public"]["Tables"]["aanvragen"]["Row"];
type ContentCheckRow = Database["public"]["Tables"]["content_checks"]["Row"];
type DesignRow = Database["public"]["Tables"]["designs"]["Row"];
type FeedbackRow = Database["public"]["Tables"]["feedback"]["Row"];
type EmailRow = Database["public"]["Tables"]["emails"]["Row"];

const NU = new Date();
const minutenGeleden = (minuten: number) => new Date(NU.getTime() - minuten * 60_000).toISOString();
const minutenVoorbij = (minuten: number) => new Date(NU.getTime() + minuten * 60_000).toISOString();
const dagenGeleden = (dagen: number) => new Date(NU.getTime() - dagen * 24 * 60 * 60_000).toISOString();

export const VOORBEELD_KLANTEN: KlantRow[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    auth_user_id: null,
    naam: "Jan de Boer",
    bedrijf: "VV Oudewater",
    email: "jan@vvoudewater.nl",
    telefoon: "0348123456",
    provincie: "Utrecht",
    created_at: dagenGeleden(5),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    auth_user_id: null,
    naam: "Marieke Visser",
    bedrijf: "HC De Meern",
    email: "marieke@hcdemeern.nl",
    telefoon: null,
    provincie: "Utrecht",
    created_at: dagenGeleden(3),
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    auth_user_id: null,
    naam: "Tom Bakker",
    bedrijf: "Bakker Makelaardij",
    email: "tom@bakkermakelaardij.nl",
    telefoon: "0611223344",
    provincie: "Noord-Holland",
    created_at: dagenGeleden(1),
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    auth_user_id: null,
    naam: "Sanne de Groot",
    bedrijf: "VV Groningen",
    email: "sanne@vvgroningen.nl",
    telefoon: null,
    provincie: "Groningen",
    created_at: dagenGeleden(4),
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    auth_user_id: null,
    naam: "Lotte Hendriks",
    bedrijf: "Sportcafé De Kantine",
    email: "lotte@dekantine.nl",
    telefoon: null,
    provincie: "Zeeland",
    created_at: dagenGeleden(2),
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    auth_user_id: null,
    naam: "Erik Mulder",
    bedrijf: "Tennisclub Smash",
    email: "erik@tcsmash.nl",
    telefoon: null,
    provincie: "Flevoland",
    created_at: dagenGeleden(3),
  },
  {
    id: "77777777-7777-7777-7777-777777777777",
    auth_user_id: null,
    naam: "Dennis Kuipers",
    bedrijf: "Kuipers Garagebedrijf",
    email: "dennis@kuipersgarage.nl",
    telefoon: "0591234567",
    provincie: "Drenthe",
    created_at: dagenGeleden(1),
  },
];

// Standaardwaarden van de ontwerptool-kolommen (zie supabase/migrations/0002_ontwerptool.sql) —
// gespreid in elke demo-aanvraag zodat de oudere testflow-rijen (tekstuele wens) niet elk apart
// al deze nieuwe velden hoeven te herhalen.
const ONTWERPTOOL_DEFAULTS = {
  aantal: 1,
  bedrukking: "Enkelzijdig",
  kromtrekken: false,
  levering: "Bezorgen",
  straat: null,
  postcode: null,
  plaats: null,
  opmerking: null,
  ontwerp_door_ons: false,
  qr_codes: null,
  teksten: null,
  waarschuwingen: null,
  lege_logoplek: false,
  compleet_ontwerp: null,
  ontwerp_ontbreekt: false,
  gewijzigd_door_klant_op: null,
  bordnaam: null,
  drukbestand_pad: null,
  drukbestand_achter_pad: null,
  voorbeeld_pad: null,
  voorbeeld_achter_pad: null,
  ontwerp_pad: null,
  overige_bestanden: null,
} as const satisfies Partial<AanvraagRow>;

export const VOORBEELD_AANVRAGEN: AanvraagRow[] = [
  {
    ...ONTWERPTOOL_DEFAULTS,
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    bestelling_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    klant_id: "11111111-1111-1111-1111-111111111111",
    veldtype: "voetbal-zijlijn",
    afmeting: "300 x 100 cm",
    bord_aanschaf: "hergebruiken",
    wens: 'Reclamebord met onze clublogo in groen/wit, tekst "Trots hoofdsponsor van VV Oudewater".',
    status: "nieuw",
    bijlage_pad: null,
    voorstel_gepland_op: minutenGeleden(5),
    created_at: dagenGeleden(5),
    updated_at: dagenGeleden(5),
  },
  {
    ...ONTWERPTOOL_DEFAULTS,
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    bestelling_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    klant_id: "22222222-2222-2222-2222-222222222222",
    veldtype: "scorebord",
    afmeting: "200 x 100 cm",
    bord_aanschaf: "nieuw",
    wens: "Strak scorebord-ontwerp passend bij onze clubkleuren blauw en geel.",
    status: "voorstel_verstuurd",
    bijlage_pad: null,
    voorstel_gepland_op: minutenGeleden(120),
    created_at: dagenGeleden(3),
    updated_at: dagenGeleden(3),
  },
  {
    ...ONTWERPTOOL_DEFAULTS,
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    bestelling_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    klant_id: "33333333-3333-3333-3333-333333333333",
    veldtype: "voetbal-zijlijn",
    afmeting: "450 x 90 cm",
    bord_aanschaf: "nieuw",
    wens: "Groot bord voor aan onze gevel bij het veld, met logo en pand-adres.",
    status: "nieuw",
    bijlage_pad: null,
    voorstel_gepland_op: minutenVoorbij(50),
    created_at: dagenGeleden(1),
    updated_at: dagenGeleden(1),
  },
  {
    ...ONTWERPTOOL_DEFAULTS,
    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    bestelling_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    klant_id: "44444444-4444-4444-4444-444444444444",
    veldtype: "hockeyveld",
    afmeting: "300 x 100 cm",
    bord_aanschaf: "hergebruiken",
    wens: "Bord met logo van onze hoofdsponsor in rood/wit.",
    status: "gemaakt",
    bijlage_pad: null,
    voorstel_gepland_op: dagenGeleden(3),
    created_at: dagenGeleden(4),
    updated_at: dagenGeleden(3),
  },
  {
    ...ONTWERPTOOL_DEFAULTS,
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    bestelling_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    klant_id: "55555555-5555-5555-5555-555555555555",
    veldtype: "scorebord",
    afmeting: "200 x 100 cm",
    bord_aanschaf: "nieuw",
    wens: "Scorebord in onze huisstijl, geel/zwart, met ons logo bovenaan.",
    // Goedgekeurd door de klant — gaat daarom direct terug naar "nieuw" (de productieflow).
    status: "nieuw",
    bijlage_pad: null,
    voorstel_gepland_op: dagenGeleden(1),
    created_at: dagenGeleden(2),
    updated_at: dagenGeleden(1),
  },
  {
    ...ONTWERPTOOL_DEFAULTS,
    id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    bestelling_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    klant_id: "66666666-6666-6666-6666-666666666666",
    veldtype: "voetbal-zijlijn",
    afmeting: "300 x 100 cm",
    bord_aanschaf: "hergebruiken",
    wens: 'Bord met ons logo en de tekst "Tennisclub Smash - nieuwe leden welkom".',
    // Afgewezen door de klant — de AI heeft automatisch een herzien concept gemaild, dus de
    // aanvraag blijft gewoon "voorstel_verstuurd" in afwachting van een nieuwe reactie.
    status: "voorstel_verstuurd",
    bijlage_pad: null,
    voorstel_gepland_op: dagenGeleden(2),
    created_at: dagenGeleden(3),
    updated_at: dagenGeleden(2),
  },
  {
    ...ONTWERPTOOL_DEFAULTS,
    id: "99999999-9999-9999-9999-999999999999",
    bestelling_id: "99999999-9999-9999-9999-999999999999",
    klant_id: "77777777-7777-7777-7777-777777777777",
    veldtype: "voetbal-zijlijn",
    afmeting: "300 x 100 cm",
    bord_aanschaf: "nieuw",
    wens: "Bord met ons logo en telefoonnummer 0591234567 zodat mensen ons direct kunnen bellen.",
    // Content-check vond een telefoonnummer, maar dat escaleert niet meer naar een aparte status —
    // gewoon "nieuw", met de check zichtbaar als "Te controleren"-signaal.
    status: "nieuw",
    bijlage_pad: null,
    voorstel_gepland_op: minutenGeleden(360),
    created_at: dagenGeleden(1),
    updated_at: minutenGeleden(360),
  },
  // Vanaf hier: aanvragen uit de nieuwe ontwerptool (reclamebord-maker), i.p.v. de oude
  // testflow hierboven (tekstuele wens + AI-concept). Geen veldtype/wens meer; het drukbestand
  // komt kant-en-klaar binnen, of de klant vraagt om het voor hem te laten ontwerpen.
  {
    ...ONTWERPTOOL_DEFAULTS,
    id: "a0000000-0000-0000-0000-000000000001",
    bestelling_id: "a0000000-0000-0000-0000-000000000001",
    klant_id: "11111111-1111-1111-1111-111111111111",
    veldtype: null,
    afmeting: "300 x 100 cm",
    bord_aanschaf: "nieuw",
    wens: null,
    status: "nieuw",
    bijlage_pad: null,
    voorstel_gepland_op: minutenGeleden(10),
    created_at: minutenGeleden(10),
    updated_at: minutenGeleden(10),
    opmerking: null,
    teksten: "Trots hoofdsponsor van VV Oudewater / www.vvoudewater.nl",
    drukbestand_pad: "/placeholder-ontwerp.svg",
    voorbeeld_pad: "/placeholder-ontwerp.svg",
  },
  {
    ...ONTWERPTOOL_DEFAULTS,
    id: "a0000000-0000-0000-0000-000000000002",
    bestelling_id: "a0000000-0000-0000-0000-000000000002",
    klant_id: "22222222-2222-2222-2222-222222222222",
    veldtype: null,
    afmeting: "200 x 100 cm",
    bord_aanschaf: "hergebruiken",
    wens: null,
    status: "nieuw",
    bijlage_pad: null,
    voorstel_gepland_op: minutenGeleden(25),
    created_at: minutenGeleden(25),
    updated_at: minutenGeleden(25),
    ontwerp_door_ons: true,
    opmerking: "Ons logo, tekst 'HC De Meern' en telefoonnummer. Kleuren: blauw en geel.",
    overige_bestanden: [{ naam: "logo-hc-de-meern.png", pad: "a0000000-0000-0000-0000-000000000002/logo-hc-de-meern.png" }],
  },
];

export const VOORBEELD_CONTENT_CHECKS: ContentCheckRow[] = [
  {
    id: "e1111111-e111-e111-e111-e11111111111",
    aanvraag_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    probleem: "geen probleem gevonden",
    geblokkeerd: false,
    toelichting: "Placeholder-check (trefwoorden) heeft niets verdachts gevonden in de ingevoerde wens.",
    created_at: dagenGeleden(5),
  },
  {
    id: "e9999999-e999-e999-e999-e99999999999",
    aanvraag_id: "99999999-9999-9999-9999-999999999999",
    probleem: "telefoonnummer gedetecteerd",
    geblokkeerd: true,
    toelichting: "Overleg met de klant of dit telefoonnummer echt op het bord moet komen.",
    created_at: minutenGeleden(360),
  },
];

export const VOORBEELD_DESIGNS: DesignRow[] = [
  {
    id: "f1111111-f111-f111-f111-f11111111111",
    aanvraag_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    versienummer: 1,
    status: "concept",
    opslaglocatie: "/placeholder-ontwerp.svg",
    created_at: dagenGeleden(3),
  },
  {
    id: "f5555555-f555-f555-f555-f55555555555",
    aanvraag_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    versienummer: 1,
    status: "definitief",
    opslaglocatie: "/placeholder-ontwerp.svg",
    created_at: dagenGeleden(1),
  },
  {
    id: "f6666666-f666-f666-f666-f66666666666",
    aanvraag_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    versienummer: 1,
    status: "vervangen",
    opslaglocatie: "/placeholder-ontwerp.svg",
    created_at: dagenGeleden(2),
  },
  {
    id: "f7777777-f777-f777-f777-f77777777777",
    aanvraag_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    versienummer: 2,
    status: "vervangen",
    opslaglocatie: "/placeholder-ontwerp.svg",
    created_at: dagenGeleden(1),
  },
  {
    id: "f8888888-f888-f888-f888-f88888888888",
    aanvraag_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    versienummer: 3,
    status: "concept",
    opslaglocatie: "/placeholder-ontwerp.svg",
    created_at: minutenGeleden(180),
  },
];

export const VOORBEELD_FEEDBACK: FeedbackRow[] = [
  {
    id: "17777777-1777-1777-1777-177777777777",
    aanvraag_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    goedgekeurd: true,
    feedbacktekst: null,
    created_at: dagenGeleden(1),
  },
  {
    id: "28888888-2888-2888-2888-288888888888",
    aanvraag_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    goedgekeurd: false,
    feedbacktekst: "Logo mag groter en graag iets minder tekst.",
    created_at: dagenGeleden(2),
  },
  {
    id: "39999999-3999-3999-3999-399999999999",
    aanvraag_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    goedgekeurd: false,
    feedbacktekst: "Helaas nog steeds niet goed — de kleuren kloppen niet met ons clublogo.",
    created_at: dagenGeleden(1),
  },
];

// Eén e-mail per designversie hierboven — opgebouwd met dezelfde `bouwVoorstelEmail()` als de
// echte flow, zodat de preview op /intern/[id] exact toont wat een klant ook echt zou krijgen.
// De echte sendProposalEmail() maakt designUrl/voorstelUrl altijd absoluut (e-mailclients kunnen
// geen relatieve paden laden) — dat doen we hier ook, anders laadt de ontwerpafbeelding niet in de
// gesandboxte voorbeeld-iframe op de detailpagina (die heeft geen eigen basis-URL om relatieve
// paden tegen op te lossen).
function maakVoorbeeldEmail(
  rij: Pick<EmailRow, "id" | "aanvraag_id" | "design_id" | "verzonden" | "verzonden_op">,
  inhoud: Parameters<typeof bouwVoorstelEmail>[0]
): EmailRow {
  const basisUrl = "http://localhost:3000";
  const { onderwerp, html, text } = bouwVoorstelEmail({
    ...inhoud,
    designUrl: new URL(inhoud.designUrl, basisUrl).toString(),
    voorstelUrl: new URL(inhoud.voorstelUrl, basisUrl).toString(),
  });
  return { ...rij, onderwerp, html_inhoud: html, platte_tekst: text };
}

export const VOORBEELD_EMAILS: EmailRow[] = [
  maakVoorbeeldEmail(
    {
      id: "d1111111-d111-d111-d111-d11111111111",
      aanvraag_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      design_id: "f1111111-f111-f111-f111-f11111111111",
      verzonden: false,
      verzonden_op: dagenGeleden(3),
    },
    {
      klantNaam: "Marieke Visser",
      veldtype: "scorebord",
      afmeting: "200 x 100 cm",
      designUrl: "/placeholder-ontwerp.svg",
      voorstelUrl: "/voorstel/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    }
  ),
  maakVoorbeeldEmail(
    {
      id: "d5555555-d555-d555-d555-d55555555555",
      aanvraag_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      design_id: "f5555555-f555-f555-f555-f55555555555",
      verzonden: false,
      verzonden_op: dagenGeleden(2),
    },
    {
      klantNaam: "Lotte Hendriks",
      veldtype: "scorebord",
      afmeting: "200 x 100 cm",
      designUrl: "/placeholder-ontwerp.svg",
      voorstelUrl: "/voorstel/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    }
  ),
  maakVoorbeeldEmail(
    {
      id: "d6666666-d666-d666-d666-d66666666666",
      aanvraag_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      design_id: "f6666666-f666-f666-f666-f66666666666",
      verzonden: false,
      verzonden_op: dagenGeleden(3),
    },
    {
      klantNaam: "Erik Mulder",
      veldtype: "voetbal-zijlijn",
      afmeting: "300 x 100 cm",
      designUrl: "/placeholder-ontwerp.svg",
      voorstelUrl: "/voorstel/ffffffff-ffff-ffff-ffff-ffffffffffff",
    }
  ),
  maakVoorbeeldEmail(
    {
      id: "d7777777-d777-d777-d777-d77777777777",
      aanvraag_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      design_id: "f7777777-f777-f777-f777-f77777777777",
      verzonden: false,
      verzonden_op: dagenGeleden(2),
    },
    {
      klantNaam: "Erik Mulder",
      veldtype: "voetbal-zijlijn",
      afmeting: "300 x 100 cm",
      designUrl: "/placeholder-ontwerp.svg",
      voorstelUrl: "/voorstel/ffffffff-ffff-ffff-ffff-ffffffffffff",
      isHerzien: true,
    }
  ),
  maakVoorbeeldEmail(
    {
      id: "d8888888-d888-d888-d888-d88888888888",
      aanvraag_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      design_id: "f8888888-f888-f888-f888-f88888888888",
      verzonden: false,
      verzonden_op: minutenGeleden(180),
    },
    {
      klantNaam: "Erik Mulder",
      veldtype: "voetbal-zijlijn",
      afmeting: "300 x 100 cm",
      designUrl: "/placeholder-ontwerp.svg",
      voorstelUrl: "/voorstel/ffffffff-ffff-ffff-ffff-ffffffffffff",
      isHerzien: true,
    }
  ),
];
