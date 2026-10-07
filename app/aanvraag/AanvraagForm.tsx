"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AFMETING_ANDERS,
  BORD_AANSCHAF_LABELS,
  BORD_AANSCHAF_OPTIES,
  PROVINCIES,
  STANDAARD_AFMETINGEN,
  VELDTYPEN,
  VELDTYPE_LABELS,
  type BordAanschaf,
  type Veldtype,
} from "@/lib/types/domain";

type Status = "idle" | "versturen" | "gelukt" | "mislukt";

// Veldnamen die (los van de bestandsbijlage, die zich niet laat herstellen) automatisch
// tussentijds opgeslagen worden, zodat een klant die per ongeluk de tab sluit of de pagina
// vernieuwt niet alles opnieuw hoeft in te typen.
const OPGESLAGEN_VELDNAMEN = ["naam", "bedrijf", "email", "telefoon", "provincie", "wens"] as const;
const CONCEPT_OPSLAGSLEUTEL = "mediagraaf_aanvraag_concept";

export function AanvraagForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [veldtype, setVeldtype] = useState<Veldtype | "">("");
  const [afmetingKeuze, setAfmetingKeuze] = useState<string>("");
  const [bordAanschaf, setBordAanschaf] = useState<BordAanschaf | "">("");
  const [bijlageNaam, setBijlageNaam] = useState<string | null>(null);
  const [conceptHersteld, setConceptHersteld] = useState(false);

  // Eenmalig bij het laden: kijk of er een eerder tussentijds opgeslagen concept ligt, en herstel
  // dat dan in zowel de React-state (voor de keuzekaarten) als de gewone tekstvelden.
  useEffect(() => {
    try {
      const ruw = window.localStorage.getItem(CONCEPT_OPSLAGSLEUTEL);
      if (!ruw) return;
      const concept = JSON.parse(ruw) as Record<string, string>;

      if (concept.veldtype) setVeldtype(concept.veldtype as Veldtype);
      if (concept.afmetingKeuze) setAfmetingKeuze(concept.afmetingKeuze);
      if (concept.bordAanschaf) setBordAanschaf(concept.bordAanschaf as BordAanschaf);

      const form = formRef.current;
      if (form) {
        for (const naam of OPGESLAGEN_VELDNAMEN) {
          const waarde = concept[naam];
          const veld = form.elements.namedItem(naam);
          if (
            waarde &&
            (veld instanceof HTMLInputElement || veld instanceof HTMLTextAreaElement || veld instanceof HTMLSelectElement)
          ) {
            veld.value = waarde;
          }
        }
      }

      setConceptHersteld(true);
    } catch {
      // localStorage kan geblokkeerd zijn (bijv. privénavigatie) — dan slaan we het herstellen
      // gewoon over in plaats van de pagina te laten breken.
    }
  }, []);

  function conceptOpslaan() {
    const form = formRef.current;
    if (!form) return;
    try {
      const data = new FormData(form);
      const concept: Record<string, string> = { veldtype, afmetingKeuze, bordAanschaf };
      for (const naam of OPGESLAGEN_VELDNAMEN) {
        const waarde = data.get(naam);
        if (typeof waarde === "string") concept[naam] = waarde;
      }
      window.localStorage.setItem(CONCEPT_OPSLAGSLEUTEL, JSON.stringify(concept));
    } catch {
      // zie hierboven
    }
  }

  function conceptWissen() {
    try {
      window.localStorage.removeItem(CONCEPT_OPSLAGSLEUTEL);
    } catch {
      // zie hierboven
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("versturen");
    setFoutmelding(null);

    const formData = new FormData(event.currentTarget);

    // De keuzekaart stuurt bij "Anders, namelijk..." de sentinel-waarde mee; die vervangen we
    // hier door wat de klant in het vrije-tekstveld heeft ingevuld, zodat de server altijd
    // gewoon een leesbare afmeting binnenkrijgt.
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
      conceptWissen();
      event.currentTarget.reset();
      setVeldtype("");
      setAfmetingKeuze("");
      setBordAanschaf("");
      setBijlageNaam(null);
    } catch (error) {
      setStatus("mislukt");
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
    }
  }

  if (status === "gelukt") {
    return (
      <div className="rounded-xl border border-brand-groen bg-green-50 p-8 text-center text-brand-zwart">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-groen text-2xl text-white">
          ✓
        </div>
        <h2 className="text-lg font-semibold">Aanvraag ontvangen!</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-700">
          Bedankt voor je aanvraag. De Mediagraaf gaat hiermee aan de slag en neemt contact met je
          op zodra er een concept-ontwerp klaarstaat.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 rounded border border-brand-zwart px-4 py-2 text-sm font-medium hover:bg-white"
        >
          Nog een aanvraag indienen
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onInput={conceptOpslaan}
      onChange={conceptOpslaan}
      className="space-y-6"
    >
      {conceptHersteld && (
        <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
          We hebben je eerder ingevulde gegevens herladen — klopt alles nog, ga dan gewoon verder.
        </p>
      )}

      <Sectie stap={1} titel="Jouw gegevens">
        <div className="grid gap-4 sm:grid-cols-2">
          <Veld label="Naam" name="naam" required autoComplete="name" />
          <Veld label="Bedrijf / vereniging" name="bedrijf" autoComplete="organization" />
          <Veld
            label="E-mailadres"
            name="email"
            type="email"
            required
            autoComplete="email"
            hint="Hierop nemen we contact met je op."
          />
          <Veld
            label="Telefoonnummer"
            name="telefoon"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
          />
          <div>
            <label htmlFor="provincie" className="mb-1 block text-sm font-medium text-brand-zwart">
              Provincie *
            </label>
            <select
              id="provincie"
              name="provincie"
              required
              defaultValue=""
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 focus:border-brand-groen focus:outline-none focus:ring-1 focus:ring-brand-groen"
            >
              <option value="" disabled>
                Kies een provincie
              </option>
              {PROVINCIES.map((provincie) => (
                <option key={provincie} value={provincie}>
                  {provincie}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Sectie>

      <Sectie stap={2} titel="Jouw ontwerpwens">
        <div>
          <span className="mb-2 block text-sm font-medium text-brand-zwart">Voor welk type veld? *</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {VELDTYPEN.map((optie) => (
              <KaartOptie
                key={optie}
                naam="veldtype"
                waarde={optie}
                label={VELDTYPE_LABELS[optie]}
                geselecteerd={veldtype === optie}
                onSelecteer={() => setVeldtype(optie)}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-brand-zwart">Gewenste afmeting *</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {STANDAARD_AFMETINGEN.map((optie) => (
              <KaartOptie
                key={optie}
                naam="afmeting"
                waarde={optie}
                label={optie}
                geselecteerd={afmetingKeuze === optie}
                onSelecteer={() => setAfmetingKeuze(optie)}
              />
            ))}
            <KaartOptie
              naam="afmeting"
              waarde={AFMETING_ANDERS}
              label="Anders, namelijk..."
              geselecteerd={afmetingKeuze === AFMETING_ANDERS}
              onSelecteer={() => setAfmetingKeuze(AFMETING_ANDERS)}
            />
          </div>
          {afmetingKeuze === AFMETING_ANDERS && (
            <div className="mt-3">
              <Veld label="Eigen afmeting" name="afmeting_anders" placeholder="Bijv. 250 x 120 cm" required />
            </div>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-brand-zwart">Bord *</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {BORD_AANSCHAF_OPTIES.map((optie) => (
              <KaartOptie
                key={optie}
                naam="bord_aanschaf"
                waarde={optie}
                label={BORD_AANSCHAF_LABELS[optie]}
                geselecteerd={bordAanschaf === optie}
                onSelecteer={() => setBordAanschaf(optie)}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Let op: bij een nieuw bord komen er uiteraard extra kosten bij.
          </p>
        </div>

        <div>
          <label htmlFor="wens" className="mb-1 block text-sm font-medium text-brand-zwart">
            Beschrijf wat er op het bord moet komen *
          </label>
          <textarea
            id="wens"
            name="wens"
            required
            rows={5}
            placeholder="Bijv. onze clublogo, tekst 'Trots hoofdsponsor van...', in onze clubkleuren groen en wit."
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 focus:border-brand-groen focus:outline-none focus:ring-1 focus:ring-brand-groen"
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
            accept="image/*,.pdf"
            onChange={(event) => setBijlageNaam(event.target.files?.[0]?.name ?? null)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-zwart hover:file:bg-neutral-200"
          />
          {bijlageNaam ? (
            <p className="mt-1.5 text-xs font-medium text-brand-groen">Gekozen: {bijlageNaam}</p>
          ) : (
            <p className="mt-1 text-xs text-neutral-500">
              Wordt nu alleen opgeslagen — er vindt nog geen automatische verwerking van dit bestand
              plaats.
            </p>
          )}
        </div>
      </Sectie>

      {status === "mislukt" && foutmelding && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {foutmelding}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "versturen"}
        className="w-full rounded-lg bg-brand-groen px-4 py-3 font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        {status === "versturen" ? "Versturen..." : "Aanvraag indienen"}
      </button>
    </form>
  );
}

function Sectie({ stap, titel, children }: { stap: number; titel: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-groen text-xs font-semibold text-white">
          {stap}
        </span>
        <h2 className="font-semibold text-brand-zwart">{titel}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function KaartOptie({
  naam,
  waarde,
  label,
  geselecteerd,
  onSelecteer,
}: {
  naam: string;
  waarde: string;
  label: string;
  geselecteerd: boolean;
  onSelecteer: () => void;
}) {
  return (
    <label
      className={`relative cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition ${
        geselecteerd
          ? "border-brand-groen bg-green-50 text-brand-zwart"
          : "border-neutral-300 text-neutral-700 hover:border-brand-groen"
      }`}
    >
      <input
        type="radio"
        name={naam}
        value={waarde}
        required
        checked={geselecteerd}
        onChange={onSelecteer}
        className="sr-only"
      />
      {geselecteerd && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-groen text-[10px] text-white">
          ✓
        </span>
      )}
      {label}
    </label>
  );
}

function Veld({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  autoComplete,
  inputMode,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  hint?: string;
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
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 focus:border-brand-groen focus:outline-none focus:ring-1 focus:ring-brand-groen"
      />
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
