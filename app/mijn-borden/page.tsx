import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { createServerSupabaseClient, isSupabaseAuthGeconfigureerd } from "@/lib/supabase/server";
import { naarOndertekendeLink } from "@/lib/supabase/bestandsLinks";
import { AANVRAAG_STATUS_KLEUREN, AANVRAAG_STATUS_LABELS, type AanvraagStatus } from "@/lib/types/domain";

export const metadata: Metadata = {
  title: "Mijn borden — reclame-borden.nl",
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
//
// Deze pagina toont alleen de bestelgeschiedenis -- de profielgegevens zelf staan op de eigen
// pagina /mijn-account, bewust niet door elkaar.
export default async function MijnBordenPagina() {
  if (!isSupabaseAuthGeconfigureerd()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-brand-zwart">Mijn borden</h1>
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
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const { data: aanvragenData } = klant
    ? await supabase
        .from("aanvragen")
        .select(
          "id, afmeting, aantal, status, created_at, voorbeeld_pad, drukbestand_pad, levering, straat, postcode, plaats"
        )
        .eq("klant_id", klant.id)
        .order("created_at", { ascending: false })
    : { data: null };

  // Ondertekenen met de service-role client: de klant-sessie zelf heeft geen Storage-rechten op
  // deze privé-bucket (geen policy daarvoor, zie SUPABASE_STORAGE_BUCKET) -- de rij hierboven is
  // al via Row Level Security tot de eigen aanvragen beperkt, dus dit maakt geen andermans
  // bestanden bereikbaar.
  const storageClient = createServerSupabaseClient();
  const aanvragen = aanvragenData
    ? await Promise.all(
        aanvragenData.map(async (aanvraag) => ({
          ...aanvraag,
          voorbeeldUrl: await naarOndertekendeLink(storageClient, aanvraag.voorbeeld_pad),
          drukbestandUrl: await naarOndertekendeLink(storageClient, aanvraag.drukbestand_pad),
        }))
      )
    : null;

  // Onderhanden: nog status "nieuw", dus nog aan te passen (zie app/api/aanvragen/[id]/klant-
  // bewerken/route.ts) -- dit telt als "nog niet afgemaakt". Alles daarna is al in productie en
  // staat op slot; dat groepje komt hieronder als "Afgemaakte borden".
  const onderhanden = aanvragen?.filter((a) => a.status === "nieuw") ?? [];
  const afgemaakt = aanvragen?.filter((a) => a.status !== "nieuw") ?? [];

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-brand-zwart">Mijn borden</h1>

      {!aanvragen || aanvragen.length === 0 ? (
        <div className="rounded border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
          Je hebt nog geen borden aangevraagd.{" "}
          <a href="/aanvraag" className="font-medium text-brand-groen hover:underline">
            Begin met ontwerpen
          </a>
          .
        </div>
      ) : (
        <>
          {onderhanden.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Nog niet afgemaakt
              </h2>
              <ul className="space-y-3">
                {onderhanden.map((aanvraag) => (
                  <li
                    key={aanvraag.id}
                    className="rounded border-2 border-dashed border-brand-groen/50 bg-brand-groen/5 p-4"
                  >
                    <AanvraagKaart aanvraag={aanvraag} />
                    <a
                      href={`/aanvraag?bewerk=${aanvraag.id}`}
                      className="mt-3 inline-block rounded bg-brand-groen px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-groen/90"
                    >
                      Verder werken
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {afgemaakt.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Afgemaakte borden</h2>
              <ul className="space-y-3">
                {afgemaakt.map((aanvraag) => (
                  <li key={aanvraag.id} className="rounded border border-neutral-200 p-4">
                    <AanvraagKaart aanvraag={aanvraag} />
                    <p className="mt-3 text-sm text-neutral-500">
                      Deze aanvraag is al in productie. Wil je nog iets wijzigen? Mail naar{" "}
                      <a href="mailto:info@demediagraaf.nl" className="text-brand-groen underline">
                        info@demediagraaf.nl
                      </a>
                      .
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

interface AanvraagKaartData {
  id: string;
  afmeting: string;
  aantal: number;
  status: AanvraagStatus;
  created_at: string;
  levering: string | null;
  straat: string | null;
  postcode: string | null;
  plaats: string | null;
  voorbeeldUrl: string | null;
  drukbestandUrl: string | null;
}

function AanvraagKaart({ aanvraag }: { aanvraag: AanvraagKaartData }) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-brand-zwart">
            {aanvraag.afmeting} · {aanvraag.aantal}×
          </p>
          <p className="text-sm text-neutral-500">
            Aangevraagd op {new Date(aanvraag.created_at).toLocaleDateString("nl-NL")}
          </p>
          {aanvraag.levering === "Bezorgen" && (aanvraag.straat || aanvraag.plaats) && (
            <p className="mt-1 text-sm text-neutral-500">
              Bezorgadres: {[aanvraag.straat, [aanvraag.postcode, aanvraag.plaats].filter(Boolean).join(" ")]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {aanvraag.levering === "Zelf ophalen in Oudewater" && (
            <p className="mt-1 text-sm text-neutral-500">Zelf ophalen in Oudewater</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${AANVRAAG_STATUS_KLEUREN[aanvraag.status]}`}
        >
          {AANVRAAG_STATUS_LABELS[aanvraag.status]}
        </span>
      </div>

      {aanvraag.voorbeeldUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- tijdelijke ondertekende Storage-link, geen vaste breedte/hoogte nodig
        <img
          src={aanvraag.voorbeeldUrl}
          alt={`Voorbeeld van je bord (${aanvraag.afmeting})`}
          className="mt-3 w-full rounded border border-neutral-200 object-contain"
        />
      )}

      {aanvraag.drukbestandUrl && (
        <a
          href={aanvraag.drukbestandUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-brand-groen hover:underline"
        >
          Download drukbestand
        </a>
      )}
    </>
  );
}
