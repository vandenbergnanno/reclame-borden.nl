import type { Metadata } from "next";
import { ToegangForm } from "./ToegangForm";

export const metadata: Metadata = {
  title: "Toegang — reclame-borden.nl",
};

export default function ToegangPagina({ searchParams }: { searchParams: { van?: string } }) {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Welkom</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Deze site is nog niet publiek live. Heb je een wachtwoord gekregen? Vul het hieronder in.
        </p>
      </div>
      <ToegangForm terugNaar={searchParams.van} />
    </div>
  );
}
