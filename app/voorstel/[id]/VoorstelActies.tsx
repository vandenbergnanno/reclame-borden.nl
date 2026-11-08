"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function VoorstelActies({ aanvraagId }: { aanvraagId: string }) {
  const router = useRouter();
  const [modus, setModus] = useState<"idle" | "feedback">("idle");
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [feedbacktekst, setFeedbacktekst] = useState("");

  async function verstuur(actie: "goedkeuren" | "feedback", tekst?: string) {
    setBezig(true);
    setFoutmelding(null);

    try {
      const response = await fetch(`/api/aanvragen/${aanvraagId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actie, feedbacktekst: tekst }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Onbekende fout.");
      }

      router.refresh();
    } catch (error) {
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
      setBezig(false);
    }
  }

  function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void verstuur("feedback", feedbacktekst);
  }

  if (modus === "feedback") {
    return (
      <form onSubmit={handleFeedbackSubmit} className="space-y-3">
        <label htmlFor="feedbacktekst" className="block text-sm font-medium text-brand-zwart">
          Wat zou je graag anders zien?
        </label>
        <textarea
          id="feedbacktekst"
          required
          rows={4}
          value={feedbacktekst}
          onChange={(event) => setFeedbacktekst(event.target.value)}
          placeholder="Bijv. het logo mag groter, en de kleur van de tekst mag wit worden."
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 focus:border-brand-groen focus:outline-none focus:ring-1 focus:ring-brand-groen"
        />
        {foutmelding && <p className="text-sm text-red-700">{foutmelding}</p>}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={bezig}
            className="rounded-lg bg-brand-groen-donker px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {bezig ? "Versturen..." : "Feedback versturen"}
          </button>
          <button
            type="button"
            onClick={() => {
              setModus("idle");
              setFoutmelding(null);
            }}
            disabled={bezig}
            className="rounded-lg border border-neutral-300 px-4 py-2.5 font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Annuleren
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      {foutmelding && <p className="text-sm text-red-700">{foutmelding}</p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void verstuur("goedkeuren")}
          disabled={bezig}
          className="rounded-lg bg-brand-groen-donker px-5 py-2.5 font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          {bezig ? "Bezig..." : "Ontwerp goedkeuren"}
        </button>
        <button
          type="button"
          onClick={() => {
            setModus("feedback");
            setFoutmelding(null);
          }}
          disabled={bezig}
          className="rounded-lg border border-neutral-300 px-5 py-2.5 font-medium text-brand-zwart hover:bg-neutral-50 disabled:opacity-50"
        >
          Feedback geven
        </button>
      </div>
    </div>
  );
}
