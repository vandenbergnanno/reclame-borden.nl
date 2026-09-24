import type { Metadata } from "next";
import { AanvraagForm } from "./AanvraagForm";
import { PRODUCTTYPEN, type Producttype } from "@/lib/types/domain";

export const metadata: Metadata = {
  title: "Nieuwe aanvraag — Mediagraaf Conceptor",
};

function isProducttype(waarde: string | undefined): waarde is Producttype {
  return typeof waarde === "string" && (PRODUCTTYPEN as readonly string[]).includes(waarde);
}

export default function AanvraagPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const initieelProducttype = isProducttype(searchParams.type) ? searchParams.type : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Nieuwe aanvraag</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Vul je gegevens en ontwerpwens in. De Mediagraaf stuurt hierna een concept-ontwerp
          terug dat je kunt goedkeuren of van feedback kunt voorzien.
        </p>
      </div>
      <AanvraagForm initieelProducttype={initieelProducttype} />
    </div>
  );
}
