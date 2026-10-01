import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { VELDTYPE_LABELS } from "@/lib/types/domain";
import { VoorstelActies } from "./VoorstelActies";

export const metadata: Metadata = {
  title: "Jouw voorstel — De Mediagraaf",
};

// Live status, dus niet statisch prerenderen (zelfde reden als /intern).
export const dynamic = "force-dynamic";

export default async function VoorstelPage({ params }: { params: { id: string } }) {
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

  const [{ data: klant }, { data: designs }, { data: feedback }] = await Promise.all([
    supabase.from("klanten").select("naam").eq("id", aanvraag.klant_id).maybeSingle(),
    supabase
      .from("designs")
      .select("*")
      .eq("aanvraag_id", aanvraag.id)
      .order("versienummer", { ascending: false })
      .limit(1),
    supabase
      .from("feedback")
      .select("*")
      .eq("aanvraag_id", aanvraag.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const design = designs?.[0];
  const laatsteFeedback = feedback?.[0];
  const veldtypeLabel = VELDTYPE_LABELS[aanvraag.veldtype] ?? aanvraag.veldtype;
  const klantNaam = klant?.naam ?? "";

  // Bij goedkeuring gaat de aanvraag direct door naar "nieuw" (de productieflow) — die status
  // zegt dus niets meer over of de klant al gereageerd heeft. De laatste feedback-rij wel.
  if (laatsteFeedback?.goedgekeurd === true) {
    return (
      <Kader titel="Bedankt voor je goedkeuring!">
        <p className="text-sm text-neutral-700">
          Je hebt het concept-ontwerp voor je {veldtypeLabel.toLowerCase()} goedgekeurd. De
          Mediagraaf gaat ermee verder — je hoort van ons zodra het bord klaar is.
        </p>
      </Kader>
    );
  }

  if (!design) {
    return (
      <Kader titel={`Hoi ${klantNaam || "daar"},`}>
        <p className="text-sm text-neutral-700">
          Je concept-ontwerp is nog niet klaar. Zodra het klaarstaat, sturen we je een e-mail met
          een link naar deze pagina.
        </p>
      </Kader>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Hoi {klantNaam || "daar"},</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Hier is het concept-ontwerp voor jouw {veldtypeLabel.toLowerCase()} ({aanvraag.afmeting}).
        </p>
      </div>

      {laatsteFeedback?.goedgekeurd === false && (
        <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
          We hebben je eerdere feedback verwerkt in dit nieuwe concept.
          {laatsteFeedback.feedbacktekst && <> Jouw feedback was: “{laatsteFeedback.feedbacktekst}”</>}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- extern/placeholder pad, geen vaste breedte/hoogte nodig */}
        <img src={design.opslaglocatie} alt="Concept-ontwerp" className="w-full" />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-semibold text-brand-zwart">Wat je hebt aangevraagd</h2>
        <p className="whitespace-pre-wrap text-sm text-neutral-700">{aanvraag.wens}</p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-brand-zwart">Wat vind je ervan?</h2>
        <VoorstelActies aanvraagId={aanvraag.id} />
      </div>
    </div>
  );
}

function Kader({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-xl font-semibold text-brand-zwart">{titel}</h1>
      {children}
    </div>
  );
}
