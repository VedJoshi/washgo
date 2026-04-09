export function SuggestionChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[]
  onSelect: (message: string) => void
}) {
  if (!suggestions.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          className="rounded-full border border-ink/8 bg-white/90 px-4 py-2.5 text-sm text-ink/75 transition hover:-translate-y-0.5 hover:border-ember/40 hover:bg-sand"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
