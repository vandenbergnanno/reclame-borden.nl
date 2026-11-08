export default function NotFoundPagina() {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-2xl font-semibold text-brand-zwart">Deze pagina bestaat niet</h1>
      <p className="text-sm text-neutral-600">
        De pagina die je zoekt is er niet (meer), of de link klopt niet helemaal.
      </p>
      <a
        href="/"
        className="inline-block rounded-full bg-brand-oranje-donker px-6 py-3 font-medium text-white shadow-sm transition hover:opacity-90"
      >
        Terug naar de homepage
      </a>
    </div>
  );
}
