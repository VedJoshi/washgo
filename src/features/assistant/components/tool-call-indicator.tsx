import { Badge } from '../../../components/ui/badge'

export function ToolCallIndicator({ activities }: { activities: string[] }) {
  if (!activities.length) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activities.slice(-4).map((activity, index) => (
        <Badge key={`${activity}-${index}`} tone="neutral">
          {activity}...
        </Badge>
      ))}
    </div>
  )
}
