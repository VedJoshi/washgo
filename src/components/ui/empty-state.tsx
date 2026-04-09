import { Card } from './card'

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="mt-2 text-sm text-ink/70">{description}</p>
    </Card>
  )
}
