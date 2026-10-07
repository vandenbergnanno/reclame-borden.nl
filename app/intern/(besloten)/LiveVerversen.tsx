"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Ververst periodiek de server-data van de huidige pagina, zodat een medewerker niet zelf
// handmatig F5 hoeft te drukken om te zien of er een nieuwe aanvraag of klantreactie is
// binnengekomen. Alleen op de lijstpagina's (Aanvragen/Concepten) — bewust NIET op de
// detailpagina, waar een halverwege-ingevuld bewerkformulier anders ongevraagd zou resetten.
export function LiveVerversen({ intervalSeconden = 30 }: { intervalSeconden?: number }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), intervalSeconden * 1000);
    return () => clearInterval(interval);
  }, [router, intervalSeconden]);

  return null;
}
