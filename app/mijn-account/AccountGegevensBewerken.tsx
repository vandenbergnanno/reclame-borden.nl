"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AccountGegevensBewerken({
  naam: initieleNaam,
  bedrijf: initieelBedrijf,
  telefoon: initieelTelefoon,
  email,
}: {
  naam: string;
  bedrijf: string | null;
  telefoon: string | null;
  email: string;
}) {
  const router = useRouter();
  const [naam, setNaam] = useState(initieleNaam);
  const [bedrijf, setBedrijf] = useState(initieelBedrijf ?? "");
  const [telefoon, setTelefoon] = useState(initieelTelefoon ?? "");
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [opgeslagen, setOpgeslagen] = useState(false);

  const gewijzigd =
    naam.trim() !== initieleNaam.trim() ||
    bedrijf.trim() !== (initieelBedrijf ?? "").trim() ||
    telefoon.trim() !== (initieelTelefoon ?? "").trim();

  async function opslaan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!naam.trim()) {
      setFoutmelding("Naam is verplicht.");
      return;
    }

    setBezig(true);
    setFoutmelding(null);
    setOpgeslagen(false);

    try {
      const response = await fetch("/api/account/bijwerken", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naam, bedrijf, telefoon }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Opslaan is mislukt.");
      }

      setOpgeslagen(true);
      router.refresh();
    } catch (error) {
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
    } finally {
      setBezig(false);
    }
  }

  return (
    <form onSubmit={opslaan} className="grid gap-5 sm:grid-cols-2">
      <Veld label="Naam" id="naam">
        <input
          id="naam"
          type="text"
          required
          value={naam}
          onChange={(event) => { setNaam(event.target.value); setOpgeslagen(false); }}
          autoComplete="name"
          className="w-full rounded border border-neutral-300 px-2 py-1.5 focus:border-brand-groen focus:outline-none"
        />
      </Veld>
      <Veld label="Bedrijf / vereniging" id="bedrijf">
        <input
          id="bedrijf"
          type="text"
          value={bedrijf}
          onChange={(event) => { setBedrijf(event.target.value); setOpgeslagen(false); }}
          autoComplete="organization"
          className="w-full rounded border border-neutral-300 px-2 py-1.5 focus:border-brand-groen focus:outline-none"
        />
      </Veld>
      <Veld label="E-mail">
        <p className="text-brand-zwart">{email}</p>
      </Veld>
      <Veld label="Telefoon" id="telefoon">
        <input
          id="telefoon"
          type="tel"
          value={telefoon}
          onChange={(event) => { setTelefoon(event.target.value); setOpgeslagen(false); }}
          autoComplete="tel"
          className="w-full rounded border border-neutral-300 px-2 py-1.5 focus:border-brand-groen focus:outline-none"
        />
      </Veld>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={bezig || !gewijzigd}
          className="rounded bg-brand-groen-donker px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {bezig ? "Opslaan..." : "Wijzigingen opslaan"}
        </button>
        {!bezig && opgeslagen && <span className="text-sm text-brand-groen-donker">Opgeslagen!</span>}
        {foutmelding && <span className="text-sm text-red-700">{foutmelding}</span>}
      </div>
    </form>
  );
}

function Veld({ label, id, children }: { label: string; id?: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
