import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { isSupabaseAuthGeconfigureerd } from "@/lib/supabase/server";
import { AANVRAAG_STATUS_KLEUREN, AANVRAAG_STATUS_LABELS } from "@/lib/types/domain";
import { AccountActies } from "./AccountActies";

export const metadata: Metadata = {
  title: "Mijn borden — De Mediagraaf",
};

// Zonder dit kan Next.js deze pagina bij het bouwen statisch maken (gebeurt zolang er nog geen
// Supabase-omgevingsvariabelen ingevuld zijn: dan wordt de cookies()-aanroep hieronder nooit bereikt
// tijdens het bouwen) -- daarna zou iedereen dezelfde, op bouwmoment bevroren pagina te zien krijgen
// in plaats van zijn eigen inlogstatus en eigen aanvragen.
export const dynamic = "force-dynamic";

// Server Component, bewust geen middleware-gate (zie middleware.ts): de sessie-check gebeurt hier
// rechtstreeks, en de rijen die terugkomen zijn al door Row Level Security beperkt tot de eigen
// klant (supabase/migrations/0003_klant_accounts.sql) -- dus zelfs een verkeerd ingeschatte query
// hieronder kan nooit de borden van iemand anders tonen.
export default async function MijnBordenPage() {
  if (!isSupabaseAuthGeconfigureerd()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-brand-zwart">Mijn borden</h1>
        <p className="text-sm text-neutral-600">
          Klantaccounts zijn nog niet actief op deze omgeving. Neem contact op met De Mediagraaf voor de status van
          je aanvraag.
        </p>
      </div>
    );
  }

  const supabase = createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/inloggen");
  }

  const { data: klant } = await supabase
    .from("klanten")
    .select("id, naam")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const { data: aanvragen } = klant
    ? await supabase
        .from("aanvragen")
        .select("id, afmeting, aantal, status, created_at, voorbeeld_pad, drukbestand_pad")
        .eq("klant_id", klant.id)
        .order("created_at", { ascending: false })
    : { data: null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Mijn borden</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {klant ? `Welkom terug, ${klant.naam}.` : "Welkom terug."} Hier zie je de borden die je hebt laten
          ontwerpen.
        </p>
      </div>

      {!aanvragen || aanvragen.length === 0 ? (
        <div className="rounded border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
          Je hebt nog geen borden aangevraagd.{" "}
          <a href="/aanvraag" className="font-medium text-brand-groen hover:underline">
            Begin met ontwerpen
          </a>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {aanvragen.map((aanvraag) => (
            <li key={aanvraag.id} className="flex items-center justify-between rounded border border-neutral-200 p-4">
              <div>
                <p className="font-medium text-brand-zwart">
                  {aanvraag.afmeting} · {aanvraag.aantal}×
                </p>
                <p className="text-sm text-neutral-500">
                  Aangevraagd op {new Date(aanvraag.created_at).toLocaleDateString("nl-NL")}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${AANVRAAG_STATUS_KLEUREN[aanvraag.status]}`}
              >
                {AANVRAAG_STATUS_LABELS[aanvraag.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <AccountActies />
    </div>
  );
}
