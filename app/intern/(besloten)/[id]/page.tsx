import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  AANVRAAG_STATUS_KLEUREN,
  AANVRAAG_STATUS_LABELS,
  BORD_AANSCHAF_LABELS,
  VELDTYPE_LABELS,
} from "@/lib/types/domain";
import { StatusWijzigen } from "./StatusWijzigen";

export const metadata: Metadata = {
  title: "Aanvraag — Mediagraaf Conceptor",
};

// Live gegevens per aanvraag, dus net als /intern bewust niet statisch prerenderen.
export const dynamic = "force-dynamic";

export default async function AanvraagDetailPage({ params }: { params: { id: string } }) {
  let supabase: ReturnType<typeof createServerSupabaseClient>;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return (
      <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error instanceof Error ? error.message : "Supabase is niet geconfigureerd."}
      </p>
    );
  }

  const { data: aanvraag, error: aanvraagFout } = await supabase
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

  if (!aanvraag) {
    notFound();
  }

  const [{ data: klant }, { data: contentChecks }, { data: designs }, { data: feedback }] = await Promise.all([
    supabase.from("klanten").select("*").eq("id", aanvraag.klant_id).maybeSingle(),
    supabase.from("content_checks").select("*").eq("aanvraag_id", aanvraag.id).order("created_at", { ascending: false }),
    supabase.from("designs").select("*").eq("aanvraag_id", aanvraag.id).order("versienummer", { ascending: false }),
    supabase.from("feedback").select("*").eq("aanvraag_id", aanvraag.id).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
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

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-semibold text-brand-zwart">Klantgegevens</h2>
          <dl className="space-y-1 text-sm">
            <Rij label="Naam" waarde={klant?.naam} />
            <Rij label="Bedrijf" waarde={klant?.bedrijf} />
            <Rij label="E-mail" waarde={klant?.email} />
            <Rij label="Telefoon" waarde={klant?.telefoon} />
          </dl>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-semibold text-brand-zwart">Bord</h2>
          <dl className="space-y-1 text-sm">
            <Rij label="Veldtype" waarde={VELDTYPE_LABELS[aanvraag.veldtype] ?? aanvraag.veldtype} />
            <Rij label="Afmeting" waarde={aanvraag.afmeting} />
            <Rij
              label="Aanschaf"
              waarde={BORD_AANSCHAF_LABELS[aanvraag.bord_aanschaf] ?? aanvraag.bord_aanschaf}
            />
            <Rij
              label="Voorstel gepland op"
              waarde={new Date(aanvraag.voorstel_gepland_op).toLocaleString("nl-NL")}
            />
          </dl>
        </div>
      </section>

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

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-semibold text-brand-zwart">Contentchecks</h2>
        {!contentChecks || contentChecks.length === 0 ? (
          <p className="text-sm text-neutral-500">Nog geen contentcheck uitgevoerd.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {contentChecks.map((check) => (
              <li key={check.id} className="flex items-start gap-2">
                {check.geblokkeerd ? (
                  <span className="mt-0.5 shrink-0 rounded-full bg-brand-oranje/10 px-2 py-0.5 text-xs font-medium text-brand-oranje">
                    Overleg met klant
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

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-semibold text-brand-zwart">Ontwerpen</h2>
        {!designs || designs.length === 0 ? (
          <p className="text-sm text-neutral-500">Nog geen ontwerp gegenereerd.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {designs.map((design) => (
              <li key={design.id}>
                Versie {design.versienummer} — {design.status} — {design.opslaglocatie}
              </li>
            ))}
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
    </div>
  );
}

function Rij({ label, waarde }: { label: string; waarde?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right text-brand-zwart">{waarde ?? "—"}</dd>
    </div>
  );
}
