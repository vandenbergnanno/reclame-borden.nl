import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { isSupabaseAuthGeconfigureerd } from "@/lib/supabase/server";
import { AccountActies } from "./AccountActies";

export const metadata: Metadata = {
  title: "Mijn account — reclame-borden.nl",
};

// Zonder dit kan Next.js deze pagina bij het bouwen statisch maken (zie dezelfde toelichting bij
// /mijn-borden) -- dan zou iedereen dezelfde, bevroren pagina te zien krijgen in plaats van zijn
// eigen gegevens.
export const dynamic = "force-dynamic";

// Puur je eigen gegevens, netjes op een rijtje -- je bestelgeschiedenis staat bewust op een eigen
// pagina (/mijn-borden), niet hier doorheen gemengd.
export default async function MijnAccountPagina() {
  if (!isSupabaseAuthGeconfigureerd()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-brand-zwart">Mijn account</h1>
        <p className="text-sm text-neutral-600">
          Klantaccounts zijn nog niet actief op deze omgeving. Neem contact op met reclame-borden.nl voor de status van
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
    .select("naam, bedrijf, telefoon")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-brand-zwart">Mijn account</h1>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Veld label="Naam" waarde={klant?.naam} />
          <Veld label="Bedrijf / vereniging" waarde={klant?.bedrijf} />
          <Veld label="E-mail" waarde={user.email} />
          <Veld label="Telefoon" waarde={klant?.telefoon} />
        </div>
      </div>

      <a
        href="/mijn-borden"
        className="inline-block rounded-full bg-brand-groen-donker px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
      >
        Bekijk mijn bestelde borden →
      </a>

      <div className="border-t border-neutral-100 pt-4">
        <AccountActies />
      </div>
    </div>
  );
}

function Veld({ label, waarde }: { label: string; waarde?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1 text-brand-zwart">{waarde || "—"}</dd>
    </div>
  );
}
