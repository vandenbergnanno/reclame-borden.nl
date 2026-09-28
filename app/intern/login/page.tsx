import type { Metadata } from "next";
import { InternLoginForm } from "./InternLoginForm";

export const metadata: Metadata = {
  title: "Inloggen — Mediagraaf Conceptor",
};

export default function InternLoginPage({ searchParams }: { searchParams: { van?: string } }) {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Inloggen</h1>
        <p className="mt-1 text-sm text-neutral-600">Toegang voor medewerkers van De Mediagraaf.</p>
      </div>
      <InternLoginForm terugNaar={searchParams.van} />
    </div>
  );
}
