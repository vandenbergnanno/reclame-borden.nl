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
];

export const VOORBEELD_FEEDBACK: FeedbackRow[] = [];
