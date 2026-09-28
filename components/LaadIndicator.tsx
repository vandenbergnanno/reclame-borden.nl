export function LaadIndicator({ tekst = "Bezig met laden..." }: { tekst?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-neutral-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-groen" />
      <p className="text-sm">{tekst}</p>
    </div>
  );
}
