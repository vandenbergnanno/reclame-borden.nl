// Plek voor een foto/screenshot/video die er nog niet is -- puur CSS, geen <Image> (die heeft een
// echt bestand nodig). Zodra het echte beeld er is, vervangt dat deze component-aanroep 1-op-1
// door next/image met `fill` + `sizes`.
export function MediaPlaceholder({
  label,
  aspectClassName = "aspect-video",
  className = "",
}: {
  label: string;
  aspectClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex ${aspectClassName} items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-100 p-4 text-center text-sm font-medium text-neutral-400 ${className}`}
    >
      [{label}]
    </div>
  );
}
