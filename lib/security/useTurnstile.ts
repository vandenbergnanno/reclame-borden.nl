"use client";

import { useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | Element, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
    };
  }
}

// Eén widget-render + token-ophaal-logica voor elk formulier met een Cloudflare Turnstile-check
// (klant-login, medewerker-login, de site-brede wachtwoordpoort) -- voorheen in elk van die drie
// losse componenten gedupliceerd. Lost ook de "eerste poging faalt altijd" bug op: voorheen werd
// het token synchroon gelezen op het moment van versturen, en was dat bij een snelle klik nog leeg
// (de widget had dan simpelweg nog niet genoeg tijd gehad om 'm te genereren) -- nu wordt er,
// alleen als het token nog leeg is, eerst nog even (tot 4s) gewacht voordat opgegeven wordt.
export function useTurnstile(containerId: string, opties: { theme?: string; appearance?: string } = {}) {
  const widgetId = useRef<string | null>(null);
  const token = useRef("");

  function laad(siteKey: string | undefined) {
    if (!siteKey || widgetId.current !== null || !window.turnstile) return;
    widgetId.current = window.turnstile.render(`#${containerId}`, {
      sitekey: siteKey,
      ...opties,
      callback: (t: string) => {
        token.current = t;
      },
      "error-callback": () => {
        token.current = "";
      },
      "expired-callback": () => {
        token.current = "";
        if (widgetId.current !== null) window.turnstile?.reset(widgetId.current);
      },
    });
  }

  // Haalt het token op voor de aanstaande poging, en reset de widget daarna (Cloudflare-tokens
  // zijn maar één keer bruikbaar) zodat er een vers token klaarstaat voor een eventuele volgende
  // poging. Zonder site key (CAPTCHA staat nog niet aan) meteen `undefined` -- er wordt dan ook
  // nooit een widget gerenderd, dus wachten zou altijd zinloos tot de timeout lopen.
  async function haalToken(siteKeyAanwezig: boolean): Promise<string | undefined> {
    if (!siteKeyAanwezig) return undefined;
    for (let poging = 0; poging < 40 && !token.current; poging++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const huidig = token.current || undefined;
    if (widgetId.current !== null) window.turnstile?.reset(widgetId.current);
    token.current = "";
    return huidig;
  }

  return { laad, haalToken };
}
