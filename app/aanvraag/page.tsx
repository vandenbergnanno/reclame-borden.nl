import type { Metadata } from "next";
import { AanvraagForm } from "./AanvraagForm";

export const metadata: Metadata = {
  title: "Nieuwe aanvraag — Mediagraaf Conceptor",
};

export default function AanvraagPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Nieuwe aanvraag</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Vul je gegevens en ontwerpwens in. De Mediagraaf stuurt hierna een concept-ontwerp
          terug dat je kunt goedkeuren of van feedback kunt voorzien.
        </p>
      </div>
      <AanvraagForm />
    </div>
  );
}
