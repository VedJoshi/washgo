export function Spinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-[32px] border border-white/80 bg-white/75 p-8 text-center shadow-panel">
      <div className="h-11 w-11 animate-spin rounded-full border-4 border-ink/10 border-t-ember" />
      <p className="text-sm text-ink/70">{label}</p>
    </div>
  )
}
