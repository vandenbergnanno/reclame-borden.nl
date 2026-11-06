import type { SupabaseClient } from "@supabase/supabase-js";

// De Storage-bucket (zie SUPABASE_STORAGE_BUCKET) is bewust privé -- klantbijlagen (logo's,
// drukbestanden) mogen niet zomaar door iedereen met het pad te raden ingezien worden. De paden
// die in de database staan (bijv. drukbestand_pad) zijn daarom alleen bruikbaar via een tijdelijke,
// ondertekende link; zonder deze functie bleven die paden kaal/onbruikbaar op het scherm staan.
const GELDIGHEID_SECONDEN = 60 * 60; // 1 uur, ruim genoeg voor één paginabezoek

// Een pad dat al met "/" of "http" begint is geen Storage-pad maar een placeholder/demo-bestand
// (zie Bestandsvoorbeeld in app/intern/(besloten)/[id]/page.tsx) -- die hoeft niet ondertekend te
// worden en blijft gewoon zoals hij is.
function isStoragePad(pad: string | null | undefined): pad is string {
  return !!pad && !pad.startsWith("/") && !pad.startsWith("http");
}

export async function naarOndertekendeLink(
  supabase: SupabaseClient,
  pad: string | null | undefined
): Promise<string | null> {
  if (!pad) return null;
  if (!isStoragePad(pad)) return pad;

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "aanvraag-bijlagen";
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(pad, GELDIGHEID_SECONDEN);
  if (error || !data) return null;
  return data.signedUrl;
}

// Meerdere paden tegelijk omzetten (gewoon Promise.all eromheen, maar hier zodat aanroepers dat
// niet allemaal zelf hoeven te onthouden).
export async function naarOndertekendeLinks(
  supabase: SupabaseClient,
  paden: (string | null | undefined)[]
): Promise<(string | null)[]> {
  return Promise.all(paden.map((pad) => naarOndertekendeLink(supabase, pad)));
}
