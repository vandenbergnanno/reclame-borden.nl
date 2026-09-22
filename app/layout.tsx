import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "De Mediagraaf — Conceptor",
  description: "Interne prototype-tool voor het aanvragen en beoordelen van reclamebord-ontwerpen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-brand-zwart text-white px-6 py-4">
            <nav className="mx-auto flex max-w-4xl items-center justify-between">
              <a href="/" className="font-semibold tracking-tight">
                De Mediagraaf <span className="text-brand-groen">Conceptor</span>
              </a>
              <div className="flex gap-4 text-sm">
                <a href="/aanvraag" className="hover:text-brand-oranje">
                  Nieuwe aanvraag
                </a>
                <a href="/intern" className="hover:text-brand-oranje">
                  Intern overzicht
                </a>
              </div>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">{children}</main>
          <footer className="px-6 py-4 text-center text-xs text-neutral-500">
            Prototype — De Mediagraaf
          </footer>
        </div>
      </body>
    </html>
  );
}
