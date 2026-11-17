import type { Metadata } from "next";
import { WachtwoordVergetenForm } from "./WachtwoordVergetenForm";

export const metadata: Metadata = {
  title: "Wachtwoord vergeten — reclame-borden.nl",
};

export default function WachtwoordVergetenPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Wachtwoord vergeten</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Vul je e-mailadres in. Je krijgt een mail met een link om een nieuw wachtwoord te kiezen.
        </p>
      </div>
      <WachtwoordVergetenForm />
    </div>
  );
}
