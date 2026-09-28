"use client";

import { useState, type FormEvent } from "react";
import {
  AFMETING_ANDERS,
  BORD_AANSCHAF_LABELS,
  BORD_AANSCHAF_OPTIES,
  STANDAARD_AFMETINGEN,
  VELDTYPEN,
  VELDTYPE_LABELS,
  type Veldtype,
} from "@/lib/types/domain";

type Status = "idle" | "versturen" | "gelukt" | "mislukt";

export function AanvraagForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [veldtype, setVeldtype] = useState<Veldtype | "">("");
  const [afmetingKeuze, setAfmetingKeuze] = useState<string>("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("versturen");
    setFoutmelding(null);

    const formData = new FormData(event.currentTarget);

    // De select stuurt bij "Anders, namelijk..." de sentinel-waarde mee; die vervangen we hier
    // door wat de klant in het vrije-tekstveld heeft ingevuld, zodat de server altijd gewoon een
    // leesbare afmeting binnenkrijgt.
    if (formData.get("afmeting") === AFMETING_ANDERS) {
      formData.set("afmeting", formData.get("afmeting_anders") ?? "");
    }

    try {
      const response = await fetch("/api/aanvragen", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Onbekende fout bij het versturen van de aanvraag.");
      }

      setStatus("gelukt");
      event.currentTarget.reset();
      setVeldtype("");
      setAfmetingKeuze("");
    } catch (error) {
      setStatus("mislukt");
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
    }
  }

  if (status === "gelukt") {
    return (
      <div className="rounded border border-brand-groen bg-green-50 p-6 text-brand-zwart">
        <h2 className="font-semibold">Aanvraag ontvangen</h2>
        <p className="mt-2 text-sm">
          Bedankt voor je aanvraag. De Mediagraaf gaat hiermee aan de slag en neemt contact met je
          op zodra er een concept-ontwerp klaarstaat.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 rounded border border-brand-zwart px-3 py-1.5 text-sm hover:bg-white"
        >
          Nog een aanvraag indienen
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-brand-zwart">Jouw gegevens</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Veld label="Naam" name="naam" required />
          <Veld label="Bedrijf / vereniging" name="bedrijf" />
          <Veld label="E-mailadres" name="email" type="email" required />
          <Veld label="Telefoonnummer" name="telefoon" type="tel" />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-brand-zwart">Jouw ontwerpwens</legend>

        <div>
          <label htmlFor="veldtype" className="mb-1 block text-sm font-medium text-brand-zwart">
            Voor welk type veld?
          </label>
          <select
            id="veldtype"
            name="veldtype"
            required
            value={veldtype}
            onChange={(event) => setVeldtype(event.target.value as Veldtype)}
            className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-brand-groen focus:outline-none"
          >
            <option value="" disabled>
              Kies een veldtype
            </option>
            {VELDTYPEN.map((optie) => (
              <option key={optie} value={optie}>
                {VELDTYPE_LABELS[optie]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="afmeting" className="mb-1 block text-sm font-medium text-brand-zwart">
            Gewenste afmeting
          </label>
          <select
            id="afmeting"
            name="afmeting"
            required
            value={afmetingKeuze}
            onChange={(event) => setAfmetingKeuze(event.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-brand-groen focus:outline-none"
          >
            <option value="" disabled>
              Kies een afmeting
            </option>
            {STANDAARD_AFMETINGEN.map((optie) => (
              <option key={optie} value={optie}>
                {optie}
              </option>
            ))}
            <option value={AFMETING_ANDERS}>Anders, namelijk...</option>
          </select>
        </div>

        {afmetingKeuze === AFMETING_ANDERS && (
          <Veld label="Eigen afmeting" name="afmeting_anders" placeholder="Bijv. 250 x 120 cm" required />
        )}

        <div>
          <span className="mb-1 block text-sm font-medium text-brand-zwart">Bord</span>
          <div className="space-y-2">
            {BORD_AANSCHAF_OPTIES.map((optie) => (
              <label key={optie} className="flex items-center gap-2 text-sm text-neutral-700">
                <input type="radio" name="bord_aanschaf" value={optie} required className="accent-brand-groen" />
                {BORD_AANSCHAF_LABELS[optie]}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Let op: bij een nieuw bord komen er uiteraard extra kosten bij.
          </p>
        </div>

        <div>
          <label htmlFor="wens" className="mb-1 block text-sm font-medium text-brand-zwart">
            Beschrijf wat er op het bord moet komen
          </label>
          <textarea
            id="wens"
            name="wens"
            required
            rows={5}
            placeholder="Bijv. onze clublogo, tekst 'Trots hoofdsponsor van...', in onze clubkleuren groen en wit."
            className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-brand-groen focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="bijlage" className="mb-1 block text-sm font-medium text-brand-zwart">
            Voorbeeld of document toevoegen (optioneel)
          </label>
          <input
            id="bijlage"
            name="bijlage"
            type="file"
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Wordt nu alleen opgeslagen — er vindt nog geen automatische verwerking van dit bestand
            plaats.
          </p>
        </div>
      </fieldset>

      {status === "mislukt" && foutmelding && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {foutmelding}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "versturen"}
        className="rounded bg-brand-groen px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {status === "versturen" ? "Versturen..." : "Aanvraag indienen"}
      </button>
    </form>
  );
}

function Veld({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-brand-zwart">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-brand-groen focus:outline-none"
      />
    </div>
  );
}
