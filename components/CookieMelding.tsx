"use client";

import { useEffect, useState } from "react";

const OPSLAGSLEUTEL = "mediagraaf_cookiemelding_gezien";

// Alle cookies op deze site zijn functioneel: de inlogsessie voor /intern (zie
// lib/auth/internSessie.ts) en, sinds klantaccounts (/inloggen, /mijn-borden), de
// Supabase Auth-sessiecookies van ingelogde klanten — geen tracking/advertentiecookies, dus geen
// "weigeren"-knop nodig. localStorage i.p.v. een cookie om dit te onthouden: dat voorkomt de
// ironie van een cookie plaatsen om te melden dat er cookies zijn, en werkt prima voor een puur
// lokale voorkeur.
export function CookieMelding() {
  const [zichtbaar, setZichtbaar] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(OPSLAGSLEUTEL)) {
        setZichtbaar(true);
      }
    } catch {
      // localStorage kan geblokkeerd zijn (bijv. privénavigatie) — dan laten we de melding
      // gewoon weg in plaats van de pagina te laten breken.
    }
  }, []);

  function accepteren() {
    try {
      window.localStorage.setItem(OPSLAGSLEUTEL, "1");
    } catch {
      // zie hierboven
    }
    setZichtbaar(false);
  }

  if (!zichtbaar) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-700">
          Deze site gebruikt alleen cookies die nodig zijn om je ingelogd te houden. Geen tracking-
          of advertentiecookies.
        </p>
        <button
          type="button"
          onClick={accepteren}
          className="shrink-0 rounded bg-brand-groen-donker px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Oké
        </button>
      </div>
    </div>
  );
}
