import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient, isSupabaseGeconfigureerd } from "@/lib/supabase/server";
import { naarOndertekendeLinks } from "@/lib/supabase/bestandsLinks";
import {
  VOORBEELD_AANVRAGEN,
  VOORBEELD_CONTENT_CHECKS,
  VOORBEELD_DESIGNS,
  VOORBEELD_EMAILS,
  VOORBEELD_FEEDBACK,
  VOORBEELD_KLANTEN,
} from "@/lib/demo/voorbeelddata";
import {
  AANVRAAG_STATUS_KLEUREN,
  AANVRAAG_STATUS_LABELS,
  BORD_AANSCHAF_LABELS,
  VELDTYPE_LABELS,
} from "@/lib/types/domain";
import { StatusWijzigen } from "./StatusWijzigen";
import { ConceptBewerken } from "./ConceptBewerken";
import { EmailBewerken } from "./EmailBewerken";
import { BevestigingsmailKopieren } from "./BevestigingsmailKopieren";

export const metadata: Metadata = {
  title: "Aanvraag — reclame-borden.nl Conceptor",
};

// Live gegevens per aanvraag, dus net als /intern bewust niet statisch prerenderen.
export const dynamic = "force-dynamic";

export default async function AanvraagDetailPage({ params }: { params: { id: string } }) {
  const toontVoorbeelddata = !isSupabaseGeconfigureerd();

  let aanvraag: (typeof VOORBEELD_AANVRAGEN)[number] | null | undefined;
  let klant: (typeof VOORBEELD_KLANTEN)[number] | null | undefined;
  let contentChecks: typeof VOORBEELD_CONTENT_CHECKS | null;
  let designs: typeof VOORBEELD_DESIGNS | null;
  let feedback: typeof VOORBEELD_FEEDBACK | null;
  let emails: typeof VOORBEELD_EMAILS | null;
  // Bestandspaden in de database zijn kale Supabase Storage-paden (de bucket is bewust privé, zie
  // SUPABASE_STORAGE_BUCKET) -- pas na het omzetten naar een tijdelijke ondertekende link kan de
  // browser ze echt laden. Zonder dit stond hier eerder alleen de kale bestandsnaam.
  let drukbestandUrl: string | null = null;
  let drukbestandAchterUrl: string | null = null;
  let voorbeeldUrl: string | null = null;
  let voorbeeldAchterUrl: string | null = null;
  let ontwerpUrl: string | null = null;
  let overigeBestandenUrls: (string | null)[] = [];

  if (toontVoorbeelddata) {
    aanvraag = VOORBEELD_AANVRAGEN.find((item) => item.id === params.id);
    klant = aanvraag ? VOORBEELD_KLANTEN.find((item) => item.id === aanvraag!.klant_id) : undefined;
    contentChecks = VOORBEELD_CONTENT_CHECKS.filter((item) => item.aanvraag_id === params.id);
    designs = VOORBEELD_DESIGNS.filter((item) => item.aanvraag_id === params.id).sort(
      (a, b) => a.versienummer - b.versienummer
    );
    feedback = VOORBEELD_FEEDBACK.filter((item) => item.aanvraag_id === params.id);
    emails = VOORBEELD_EMAILS.filter((item) => item.aanvraag_id === params.id);
    // Voorbeelddata gebruikt al bestaande, publieke paden (/placeholder-ontwerp.svg) -- die
    // hoeven niet ondertekend te worden.
    drukbestandUrl = aanvraag?.drukbestand_pad ?? null;
    drukbestandAchterUrl = aanvraag?.drukbestand_achter_pad ?? null;
    voorbeeldUrl = aanvraag?.voorbeeld_pad ?? null;
    voorbeeldAchterUrl = aanvraag?.voorbeeld_achter_pad ?? null;
    ontwerpUrl = aanvraag?.ontwerp_pad ?? null;
    overigeBestandenUrls = aanvraag?.overige_bestanden?.map((b) => b.pad) ?? [];
  } else {
    const supabase = createServerSupabaseClient();

    const { data: aanvraagData, error: aanvraagFout } = await supabase
      .from("aanvragen")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (aanvraagFout) {
      return (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {aanvraagFout.message}
        </p>
      );
    }

    aanvraag = aanvraagData;

    if (!aanvraag) {
      notFound();
    }

    const [{ data: klantData }, { data: contentChecksData }, { data: designsData }, { data: feedbackData }, { data: emailsData }] =
      await Promise.all([
        supabase.from("klanten").select("*").eq("id", aanvraag.klant_id).maybeSingle(),
        supabase.from("content_checks").select("*").eq("aanvraag_id", aanvraag.id).order("created_at", { ascending: false }),
        supabase.from("designs").select("*").eq("aanvraag_id", aanvraag.id).order("versienummer", { ascending: true }),
        supabase.from("feedback").select("*").eq("aanvraag_id", aanvraag.id).order("created_at", { ascending: false }),
        supabase.from("emails").select("*").eq("aanvraag_id", aanvraag.id).order("verzonden_op", { ascending: true }),
      ]);

    klant = klantData;
    contentChecks = contentChecksData;
    designs = designsData;
    feedback = feedbackData;
    emails = emailsData;

    const overigePaden = aanvraag.overige_bestanden?.map((b) => b.pad) ?? [];
    const [
      drukbestandResult,
      drukbestandAchterResult,
      voorbeeldResult,
      voorbeeldAchterResult,
      ontwerpResult,
      ...overigeResults
    ] = await naarOndertekendeLinks(supabase, [
      aanvraag.drukbestand_pad,
      aanvraag.drukbestand_achter_pad,
      aanvraag.voorbeeld_pad,
      aanvraag.voorbeeld_achter_pad,
      aanvraag.ontwerp_pad,
      ...overigePaden,
    ]);
    drukbestandUrl = drukbestandResult;
    drukbestandAchterUrl = drukbestandAchterResult;
    voorbeeldUrl = voorbeeldResult;
    voorbeeldAchterUrl = voorbeeldAchterResult;
    ontwerpUrl = ontwerpResult;
    overigeBestandenUrls = overigeResults;
  }

  if (!aanvraag) {
    notFound();
  }

  const hoogsteVersienummer = designs?.length
    ? Math.max(...designs.map((design) => design.versienummer))
    : 0;

  return (
    <div className="space-y-6">
      {toontVoorbeelddata && (
        <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Je ziet nu voorbeelddata — er is nog geen Supabase-project gekoppeld (zie .env.example).
        </p>
      )}

      <div>
        <a href="/intern" className="text-sm text-neutral-500 hover:text-brand-zwart">
          ← Terug naar overzicht
        </a>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-brand-zwart">
            Aanvraag van {klant?.naam ?? "onbekende klant"}
          </h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${AANVRAAG_STATUS_KLEUREN[aanvraag.status]}`}
          >
            {AANVRAAG_STATUS_LABELS[aanvraag.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          Ingediend op {new Date(aanvraag.created_at).toLocaleString("nl-NL")}
        </p>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-brand-zwart">Status wijzigen</h2>
        <StatusWijzigen aanvraagId={aanvraag.id} huidigeStatus={aanvraag.status} />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <BevestigingsmailKopieren
          tekst={bouwBevestigingsmailTekst(klant?.naam ?? "", aanvraag.afmeting, aanvraag.aantal)}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-semibold text-brand-zwart">Klantgegevens</h2>
          <dl className="space-y-1 text-sm">
            <Rij label="Naam" waarde={klant?.naam} />
            <Rij label="Bedrijf" waarde={klant?.bedrijf} />
            <Rij label="E-mail" waarde={klant?.email} />
            <Rij label="Telefoon" waarde={klant?.telefoon} />
            <Rij label="Provincie" waarde={klant?.provincie} />
          </dl>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-semibold text-brand-zwart">Bord</h2>
          <dl className="space-y-1 text-sm">
            {aanvraag.veldtype && <Rij label="Veldtype" waarde={VELDTYPE_LABELS[aanvraag.veldtype] ?? aanvraag.veldtype} />}
            <Rij label="Afmeting" waarde={aanvraag.afmeting} />
            <Rij label="Aantal" waarde={String(aanvraag.aantal)} />
            <Rij label="Bedrukking" waarde={aanvraag.bedrukking} />
            {aanvraag.kromtrekken && <Rij label="Kromtrekken" waarde="Extra bescherming besteld" />}
            <Rij
              label="Aanschaf"
              waarde={BORD_AANSCHAF_LABELS[aanvraag.bord_aanschaf] ?? aanvraag.bord_aanschaf}
            />
            <Rij
              label="Levering"
              waarde={
                aanvraag.levering === "Bezorgen"
                  ? [aanvraag.straat, [aanvraag.postcode, aanvraag.plaats].filter(Boolean).join(" ")]
                      .filter(Boolean)
                      .join(", ") || "Bezorgen"
                  : aanvraag.levering
              }
            />
            <Rij
              label="Voorstel gepland op"
              waarde={new Date(aanvraag.voorstel_gepland_op).toLocaleString("nl-NL")}
            />
          </dl>
        </div>
      </section>

      {aanvraag.wens ? (
        // Oude testflow: tekstuele wens + AI-conceptgeneratie (zie de "Ontwerpen & e-mails"-sectie
        // verderop).
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-semibold text-brand-zwart">Ontwerpwens</h2>
          <p className="whitespace-pre-wrap text-sm text-neutral-700">{aanvraag.wens}</p>
          {aanvraag.bijlage_pad && (
            <p className="mt-2 text-sm text-neutral-500">
              Bijlage: {aanvraag.bijlage_pad}{" "}
              <span className="text-xs">(nog geen downloadlink — wacht op een echt Supabase-project)</span>
            </p>
          )}
        </section>
      ) : (
        // Nieuwe ontwerptool (reclamebord-maker): ofwel een kant-en-klaar drukbestand (de klant
        // heeft het zelf ontworpen), ofwel alleen een logo + opmerking ("Laat ons het ontwerp
        // maken" — zie aanvraag.ontwerp_door_ons).
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-semibold text-brand-zwart">
            {aanvraag.ontwerp_door_ons ? "Ontwerpwens (laat ons het ontwerp maken)" : "Zelf ontworpen"}
          </h2>

          {aanvraag.ontwerp_door_ons ? (
            <>
              <p className="rounded-lg border border-brand-oranje/30 bg-brand-oranje/5 px-3 py-2 text-sm text-brand-oranje">
                Dit ontwerp moet nog gemaakt worden — de klant heeft gekozen voor &ldquo;Laat ons het
                ontwerp maken&rdquo;.
              </p>
              {aanvraag.opmerking && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{aanvraag.opmerking}</p>
              )}
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Bestandsvoorbeeld label="Drukbestand (voorkant)" pad={drukbestandUrl} />
              {aanvraag.drukbestand_achter_pad && (
                <Bestandsvoorbeeld label="Drukbestand (achterkant)" pad={drukbestandAchterUrl} />
              )}
              <Bestandsvoorbeeld label="Voorbeeld (voorkant)" pad={voorbeeldUrl} afbeelding />
              {aanvraag.voorbeeld_achter_pad && (
                <Bestandsvoorbeeld label="Voorbeeld (achterkant)" pad={voorbeeldAchterUrl} afbeelding />
              )}
              {aanvraag.ontwerp_pad && <Bestandsvoorbeeld label="Ontwerpbestand (bewerkbaar)" pad={ontwerpUrl} />}
              {aanvraag.ontwerp_ontbreekt && (
                <p className="text-sm text-brand-oranje sm:col-span-2">
                  Het bewerkbare ontwerpbestand kon niet worden meegestuurd (te groot) — vraag het apart op bij de klant.
                </p>
              )}
              {aanvraag.opmerking && (
                <p className="whitespace-pre-wrap text-sm text-neutral-700 sm:col-span-2">
                  <span className="font-medium text-brand-zwart">Opmerking: </span>
                  {aanvraag.opmerking}
                </p>
              )}
              {aanvraag.teksten && (
                <div className="sm:col-span-2">
                  <p className="font-medium text-brand-zwart">Teksten op het bord</p>
                  <p className="whitespace-pre-wrap text-sm text-neutral-700">{aanvraag.teksten}</p>
                </div>
              )}
              {aanvraag.qr_codes && (
                <div className="sm:col-span-2">
                  <p className="font-medium text-brand-zwart">QR-codes</p>
                  <p className="whitespace-pre-wrap text-sm text-neutral-700">{aanvraag.qr_codes}</p>
                </div>
              )}
              {aanvraag.waarschuwingen && (
                <div className="sm:col-span-2">
                  <p className="font-medium text-brand-oranje">Genegeerde waarschuwingen</p>
                  <p className="whitespace-pre-wrap text-sm text-neutral-700">{aanvraag.waarschuwingen}</p>
                </div>
              )}
              {aanvraag.lege_logoplek && (
                <p className="text-sm text-brand-oranje sm:col-span-2">
                  Er staat nog een lege logoplek op het bord — de klant heeft geen logo meegestuurd voor die plek.
                </p>
              )}
            </div>
          )}

          {aanvraag.overige_bestanden && aanvraag.overige_bestanden.length > 0 && (
            <div className="mt-3 border-t border-neutral-100 pt-3">
              <p className="mb-1 font-medium text-brand-zwart">Meegestuurde bestanden</p>
              <ul className="space-y-1 text-sm text-neutral-600">
                {aanvraag.overige_bestanden.map((bestand, index) => {
                  const url = overigeBestandenUrls[index];
                  return (
                    <li key={bestand.pad}>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-groen hover:underline">
                          {bestand.naam}
                        </a>
                      ) : (
                        <>
                          {bestand.naam} <span className="text-xs text-neutral-400">(link kon niet worden gemaakt)</span>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-semibold text-brand-zwart">Checks</h2>
        {!contentChecks || contentChecks.length === 0 ? (
          <p className="text-sm text-neutral-500">Nog geen contentcheck uitgevoerd.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {contentChecks.map((check) => (
              <li key={check.id} className="flex items-start gap-2">
                {check.geblokkeerd ? (
                  <span className="mt-0.5 shrink-0 rounded-full bg-brand-oranje/10 px-2 py-0.5 text-xs font-medium text-brand-oranje">
                    Te controleren
                  </span>
                ) : (
                  <span className="mt-0.5 shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                    Oké
                  </span>
                )}
                <span>
                  <span className="font-medium text-brand-zwart">{check.probleem}</span>
                  {check.toelichting && <span className="text-neutral-600"> — {check.toelichting}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Zelf ontworpen aanvragen (kant-en-klaar drukbestand, geen "ontwerp_door_ons") hebben geen
          voorstel/goedkeuringscyclus — er is nooit een design/e-mail/feedback-rij voor. Alleen de
          oude wens-flow en "laat ons het ontwerp maken" (waar een medewerker nog een ontwerp +
          e-mail moet toevoegen) gebruiken deze twee secties. */}
      {(aanvraag.wens !== null || aanvraag.ontwerp_door_ons) && (
        <>
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-semibold text-brand-zwart">Ontwerpen &amp; e-mails</h2>
        <p className="mb-3 text-xs text-neutral-500">
          Elke conceptversie die de AI heeft bedacht, met de e-mail die daarbij naar de klant is
          (of zou zijn) gestuurd.
        </p>
        {!designs || designs.length === 0 ? (
          <p className="text-sm text-neutral-500">Nog geen ontwerp gegenereerd.</p>
        ) : (
          <ul className="space-y-4">
            {designs.map((design) => {
              const email = emails?.find((item) => item.design_id === design.id);
              // Alleen de nieuwste versie is wat een klant nu daadwerkelijk zou zien — oudere
              // (vervangen) versies tonen we wel in de geschiedenis, maar zijn niet meer te
              // bewerken, ook al staat hun eigen e-mail toevallig nog op verzonden=false.
              const isHuidigeVersie = design.versienummer === hoogsteVersienummer;
              return (
                <li key={design.id} className="rounded-lg border border-neutral-200 p-3">
                  <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- extern/placeholder pad */}
                    <img
                      src={design.opslaglocatie}
                      alt={`Ontwerp versie ${design.versienummer}`}
                      className="h-14 w-24 shrink-0 rounded border border-neutral-200 object-cover"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-brand-zwart">
                        Concept versie {design.versienummer}
                        <span className="ml-2 text-xs font-normal text-neutral-500">{design.status}</span>
                        {isHuidigeVersie && (
                          <span className="ml-2 rounded-full bg-brand-groen/10 px-2 py-0.5 text-[10px] font-medium text-brand-groen">
                            Huidig
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-500">{design.opslaglocatie}</p>
                      {isHuidigeVersie && !email?.verzonden && (
                        <ConceptBewerken
                          aanvraagId={aanvraag.id}
                          designId={design.id}
                          huidigeOpslaglocatie={design.opslaglocatie}
                        />
                      )}
                    </div>
                  </div>

                  {email ? (
                    <div className="mt-3 border-t border-neutral-100 pt-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-brand-zwart">{email.onderwerp}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            email.verzonden
                              ? "bg-brand-groen/10 text-brand-groen"
                              : "bg-brand-oranje/10 text-brand-oranje"
                          }`}
                        >
                          {email.verzonden ? "Echt verstuurd" : "Alleen gelogd (RESEND_API_KEY ontbreekt)"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-400">
                        {new Date(email.verzonden_op).toLocaleString("nl-NL")}
                      </p>
                      <iframe
                        // "allow-same-origin" laat de ontwerpafbeelding gewoon laden; scripts blijven
                        // uitgeschakeld omdat "allow-scripts" bewust ontbreekt — dus geen risico, ook
                        // niet als klantNaam/afmeting ooit HTML/script zouden bevatten.
                        sandbox="allow-same-origin"
                        srcDoc={email.html_inhoud}
                        title={`E-mail bij concept versie ${design.versienummer}`}
                        className="mt-2 h-64 w-full rounded border border-neutral-200 bg-white"
                      />
                      {isHuidigeVersie && !email.verzonden && (
                        <EmailBewerken
                          aanvraagId={aanvraag.id}
                          emailId={email.id}
                          huidigOnderwerp={email.onderwerp}
                          huidigePlatteTekst={email.platte_tekst}
                          huidigeHtmlInhoud={email.html_inhoud}
                        />
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 border-t border-neutral-100 pt-3 text-xs text-neutral-400">
                      Geen e-mail gevonden bij deze conceptversie.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-semibold text-brand-zwart">Feedback van de klant</h2>
        {!feedback || feedback.length === 0 ? (
          <p className="text-sm text-neutral-500">Nog geen feedback ontvangen.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {feedback.map((item) => (
              <li key={item.id}>
                <span
                  className={`font-medium ${item.goedgekeurd ? "text-brand-groen" : "text-brand-oranje"}`}
                >
                  {item.goedgekeurd ? "Goedgekeurd" : "Afgewezen"}
                </span>
                {item.feedbacktekst && <span className="text-neutral-600"> — {item.feedbacktekst}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
        </>
      )}
    </div>
  );
}

// Kant-en-klare, kopieerbare tekst voor een medewerker om zelf (met de factuur als bijlage) te
// versturen -- bewust geen automatische verzending, zie BevestigingsmailKopieren.tsx.
function bouwBevestigingsmailTekst(klantNaam: string, afmeting: string, aantal: number): string {
  return [
    `Beste ${klantNaam || "klant"},`,
    "",
    "Uw order is ontvangen.",
    "",
    `Dit is uw bord: ${afmeting}${aantal > 1 ? ` (${aantal}x)` : ""}.`,
    "",
    "Hieronder vindt u de factuur.",
    "",
    "Met vriendelijke groet,",
    "reclame-borden.nl",
  ].join("\n");
}

function Rij({ label, waarde }: { label: string; waarde?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right text-brand-zwart">{waarde ?? "—"}</dd>
    </div>
  );
}

// Een pad dat met "/" begint is een echt bestaand bestand in /public (zoals de demo-placeholder);
// een kaal Supabase Storage-pad (bijv. "<aanvraag-id>/bestand.pdf") heeft nog geen downloadlink,
// net zoals bij aanvraag.bijlage_pad hierboven.
function Bestandsvoorbeeld({ label, pad, afbeelding = false }: { label: string; pad: string | null; afbeelding?: boolean }) {
  if (!pad) return null;
  const isEchteUrl = pad.startsWith("/") || pad.startsWith("http");

  return (
    <div>
      <p className="mb-1 font-medium text-brand-zwart">{label}</p>
      {isEchteUrl && afbeelding ? (
        // eslint-disable-next-line @next/next/no-img-element -- extern/placeholder pad
        <img src={pad} alt={label} className="h-32 w-full rounded border border-neutral-200 object-contain bg-neutral-50" />
      ) : isEchteUrl ? (
        <a href={pad} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-groen hover:underline">
          {pad}
        </a>
      ) : (
        <p className="text-sm text-neutral-500">
          {pad} <span className="text-xs text-neutral-400">(nog geen downloadlink — wacht op een echt Supabase-project)</span>
        </p>
      )}
    </div>
  );
}
