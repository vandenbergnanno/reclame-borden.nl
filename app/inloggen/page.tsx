import type { Metadata } from "next";
import { InloggenTabs } from "./InloggenTabs";

export const metadata: Metadata = {
  title: "Inloggen — De Mediagraaf",
};

export default function InloggenPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Inloggen</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Als klant zie je hier je eigen borden terug. Medewerkers van De Mediagraaf loggen hier ook in.
        </p>
      </div>
      <InloggenTabs />
    </div>
  );
}
