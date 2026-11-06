import type { MetadataRoute } from "next";

// Zie de toelichting bij `robots` in app/layout.tsx: de site mag nog niet geïndexeerd worden,
// maar blijft wel gewoon bereikbaar voor iedereen die de link heeft.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
