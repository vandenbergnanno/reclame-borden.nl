import type { Metadata } from "next";
import { WachtwoordInstellenForm } from "./WachtwoordInstellenForm";

export const metadata: Metadata = {
  title: "Nieuw wachtwoord kiezen — reclame-borden.nl",
};

// Hier komt de klant terecht via de link uit de "wachtwoord vergeten"-mail (zie
// app/api/klant/wachtwoord-vergeten/route.ts). De eenmalige code staat achter de # in het adres,
// dus de server ziet 'm hier niet: het formulier leest 'm zelf uit en stuurt 'm pas mee bij het
// opslaan van het nieuwe wachtwoord.
export default function WachtwoordInstellenPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Nieuw wachtwoord kiezen</h1>
        <p className="mt-1 text-sm text-neutral-600">Kies een nieuw wachtwoord voor je account.</p>
      </div>
      <WachtwoordInstellenForm />
    </div>
  );
}
