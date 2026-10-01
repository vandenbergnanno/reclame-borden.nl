// Statische kopie van supabase/seed.sql, gebruikt als terugval voor de interne
// overzichtspagina's zolang er nog geen echt Supabase-project gekoppeld is (zie
// `isSupabaseGeconfigureerd()` in lib/supabase/server.ts). Puur om de interface zelf te kunnen
// bekijken en testen — dit is geen vervanging van een database en wordt nooit beschreven.
import type { Database } from "@/lib/types/database";

type KlantRow = Database["public"]["Tables"]["klanten"]["Row"];
type AanvraagRow = Database["public"]["Tables"]["aanvragen"]["Row"];
type ContentCheckRow = Database["public"]["Tables"]["content_checks"]["Row"];
type DesignRow = Database["public"]["Tables"]["designs"]["Row"];
type FeedbackRow = Database["public"]["Tables"]["feedback"]["Row"];

const NU = new Date();
const minutenGeleden = (minuten: number) => new Date(NU.getTime() - minuten * 60_000).toISOString();
const minutenVoorbij = (minuten: number) => new Date(NU.getTime() + minuten * 60_000).toISOString();
const dagenGeleden = (dagen: number) => new Date(NU.getTime() - dagen * 24 * 60 * 60_000).toISOString();

export const VOORBEELD_KLANTEN: KlantRow[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    naam: "Jan de Boer",
    bedrijf: "VV Oudewater",
    email: "jan@vvoudewater.nl",
    telefoon: "0348123456",
    provincie: "Utrecht",
    created_at: dagenGeleden(5),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    naam: "Marieke Visser",
    bedrijf: "HC De Meern",
    email: "marieke@hcdemeern.nl",
    telefoon: null,
    provincie: "Utrecht",
    created_at: dagenGeleden(3),
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    naam: "Tom Bakker",
    bedrijf: "Bakker Makelaardij",
    email: "tom@bakkermakelaardij.nl",
    telefoon: "0611223344",
    provincie: "Noord-Holland",
    created_at: dagenGeleden(1),
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    naam: "Sanne de Groot",
    bedrijf: "VV Groningen",
    email: "sanne@vvgroningen.nl",
    telefoon: null,
    provincie: "Groningen",
    created_at: dagenGeleden(4),
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    naam: "Lotte Hendriks",
    bedrijf: "Sportcafé De Kantine",
    email: "lotte@dekantine.nl",
    telefoon: null,
    provincie: "Zeeland",
    created_at: dagenGeleden(2),
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    naam: "Erik Mulder",
    bedrijf: "Tennisclub Smash",
    email: "erik@tcsmash.nl",
    telefoon: null,
    provincie: "Flevoland",
    created_at: dagenGeleden(3),
  },
  {
    id: "77777777-7777-7777-7777-777777777777",
    naam: "Dennis Kuipers",
    bedrijf: "Kuipers Garagebedrijf",
    email: "dennis@kuipersgarage.nl",
    telefoon: "0591234567",
    provincie: "Drenthe",
    created_at: dagenGeleden(1),
  },
];

export const VOORBEELD_AANVRAGEN: AanvraagRow[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
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
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
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
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
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
    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
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
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    klant_id: "55555555-5555-5555-5555-555555555555",
    veldtype: "scorebord",
    afmeting: "200 x 100 cm",
    bord_aanschaf: "nieuw",
    wens: "Scorebord in onze huisstijl, geel/zwart, met ons logo bovenaan.",
    status: "goedgekeurd",
    bijlage_pad: null,
    voorstel_gepland_op: dagenGeleden(1),
    created_at: dagenGeleden(2),
    updated_at: dagenGeleden(1),
  },
  {
    id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    klant_id: "66666666-6666-6666-6666-666666666666",
    veldtype: "voetbal-zijlijn",
    afmeting: "300 x 100 cm",
    bord_aanschaf: "hergebruiken",
    wens: 'Bord met ons logo en de tekst "Tennisclub Smash - nieuwe leden welkom".',
    status: "afgewezen",
    bijlage_pad: null,
    voorstel_gepland_op: dagenGeleden(2),
    created_at: dagenGeleden(3),
    updated_at: dagenGeleden(2),
  },
  {
    id: "99999999-9999-9999-9999-999999999999",
    klant_id: "77777777-7777-7777-7777-777777777777",
    veldtype: "voetbal-zijlijn",
    afmeting: "300 x 100 cm",
    bord_aanschaf: "nieuw",
    wens: "Bord met ons logo en telefoonnummer 0591234567 zodat mensen ons direct kunnen bellen.",
    status: "geescaleerd",
    bijlage_pad: null,
    voorstel_gepland_op: minutenGeleden(360),
    created_at: dagenGeleden(1),
    updated_at: minutenGeleden(360),
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
];
