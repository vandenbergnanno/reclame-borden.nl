import type { Metadata } from "next";
import { KlantLoginForm } from "@/app/inloggen/KlantLoginForm";

export const metadata: Metadata = {
  title: "Account aanmaken — reclame-borden.nl",
};

// Bewust een eigen pagina (geen tabblad op /inloggen) -- zo kom je hier nooit per ongeluk op de
// inlog-pagina terecht in plaats van op "Account aanmaken", en andersom.
export default function AccountAanmakenPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Account aanmaken</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Met een account zie je al je aanvragen en hun status terug, en kun je zelf een bord
          ontwerpen in de ontwerptool.
        </p>
      </div>
      <KlantLoginForm vasteModus="account_aanmaken" />
    </div>
  );
}
