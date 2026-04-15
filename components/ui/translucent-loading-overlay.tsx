type TranslucentLoadingOverlayProps = {
  label?: string;
  fullscreen?: boolean;
  overlay?: boolean;
  className?: string;
};

export function TranslucentLoadingOverlay({
  label = 'Loading...',
  fullscreen = false,
  overlay = true,
  className = '',
}: TranslucentLoadingOverlayProps) {
  const positioning = fullscreen ? 'fixed inset-0 z-[90]' : 'absolute inset-0 z-20';
  const layout = overlay
    ? `${positioning} bg-zinc-950/45 backdrop-blur-sm`
    : 'relative bg-transparent';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`${layout} flex items-center justify-center ${className}`}
    >
      <div className="flex min-w-56 flex-col items-center gap-4 rounded-2xl border border-zinc-700/70 bg-zinc-900/75 px-8 py-6 shadow-2xl shadow-black/40">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-orange-400/70 border-t-transparent animate-spin" />
          <div className="absolute inset-1 rounded-full border border-orange-200/30 animate-pulse" />
        </div>
        <p className="text-sm font-medium tracking-wide text-zinc-100">{label}</p>
      </div>
    </div>
  );
}
