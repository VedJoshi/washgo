import { Badge } from '../../../components/ui/badge'
import { useSessionStore } from '../../../store/session-store'

export function ToolCallIndicator({ activities }: { activities: string[] }) {
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  if (!activities.length) {
    return null
  }

  const localizeActivity = (activity: string) => {
    if (uiLanguage !== 'vi') return activity
    const map: Record<string, string> = {
      'Checking nearby services': 'Dang tim dich vu gan ban',
      'Reading current vehicle status': 'Dang doc trang thai xe',
      'Calculating service quote': 'Dang tinh bao gia dich vu',
      'Reserving service slot': 'Dang giu cho khung gio dich vu',
      'Checking booking status': 'Dang kiem tra trang thai dat lich',
    }
    return map[activity] ?? activity
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activities.slice(-4).map((activity, index) => (
        <Badge key={`${activity}-${index}`} tone="neutral">
          {localizeActivity(activity)}...
        </Badge>
      ))}
    </div>
  )
}
