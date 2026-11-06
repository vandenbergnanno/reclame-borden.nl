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

      <dl className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
        <Rij label="Naam" waarde={klant?.naam} />
        <Rij label="Bedrijf / vereniging" waarde={klant?.bedrijf} />
        <Rij label="E-mail" waarde={user.email} />
        <Rij label="Telefoon" waarde={klant?.telefoon} />
      </dl>

      <a href="/mijn-borden" className="inline-block text-sm font-medium text-brand-groen hover:underline">
        Bekijk mijn bestelde borden →
      </a>

      <div className="border-t border-neutral-100 pt-4">
        <AccountActies />
      </div>
    </div>
  );
}

function Rij({ label, waarde }: { label: string; waarde?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-brand-zwart">{waarde || "—"}</dd>
    </div>
  );
}
