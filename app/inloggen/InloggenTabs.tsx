"use client";

import { useState } from "react";
import { InternLoginForm } from "@/app/intern/login/InternLoginForm";
import { KlantLoginForm } from "./KlantLoginForm";

type Rol = "klant" | "medewerker";

// Eén inlogpagina voor zowel klanten (eigen account via Supabase Auth, zie KlantLoginForm) als
// medewerkers (het bestaande gedeelde-wachtwoord-systeem, hergebruikt via InternLoginForm) — op
// verzoek samengevoegd zodat de ontwerptool zelf geen apart "medewerker login"-linkje meer nodig
// heeft en er maar één plek is waar iedereen moet zijn.
export function InloggenTabs() {
  const [rol, setRol] = useState<Rol>("klant");

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-lg border border-neutral-200 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setRol("klant")}
          className={`flex-1 rounded-md px-3 py-2 transition ${rol === "klant" ? "bg-brand-groen text-white" : "text-neutral-500 hover:text-brand-zwart"}`}
        >
          Klant
        </button>
        <button
          type="button"
          onClick={() => setRol("medewerker")}
          className={`flex-1 rounded-md px-3 py-2 transition ${rol === "medewerker" ? "bg-brand-groen text-white" : "text-neutral-500 hover:text-brand-zwart"}`}
        >
          Medewerker
        </button>
      </div>

      {rol === "klant" ? <KlantLoginForm /> : <InternLoginForm />}
    </div>
  );
}
