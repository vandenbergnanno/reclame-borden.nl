"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UitloggenKnop() {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);

  async function uitloggen() {
    setBezig(true);
    await fetch("/api/intern/logout", { method: "POST" });
    router.push("/intern/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={uitloggen}
      disabled={bezig}
      className="text-sm text-neutral-500 underline hover:text-brand-zwart disabled:opacity-50"
    >
      {bezig ? "Bezig..." : "Uitloggen"}
    </button>
  );
}
