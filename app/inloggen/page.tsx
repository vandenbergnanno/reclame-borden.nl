import type { Metadata } from "next";
import { KlantLoginForm } from "./KlantLoginForm";

export const metadata: Metadata = {
  title: "Inloggen — reclame-borden.nl",
};

export default function InloggenPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Inloggen</h1>
        <p className="mt-1 text-sm text-neutral-600">Zie hier je eigen borden terug.</p>
      </div>
      <KlantLoginForm vasteModus="inloggen" />
    </div>
  );
}
