import { Card } from '../../../components/ui/card'
import { formatKilometers } from '../../../lib/utils/format'
import type { Vehicle, VehicleHealth } from '../../../types/domain'

const statusCards = (
  vehicle: Vehicle,
  health: VehicleHealth,
): Array<{ label: string; value: string; hint: string }> => [
  {
    label: 'Next service',
    value: formatKilometers(vehicle.nextServiceDueKm - vehicle.currentOdometerKm),
    hint: 'Remaining before the next recommended maintenance window',
  },
  {
    label: 'Primary watch',
    value: 'Battery',
    hint: 'Recent city-heavy usage is increasing battery strain',
  },
  {
    label: 'Drive pattern',
    value: 'City-heavy',
    hint: `${health.issues.length} systems worth checking before the weekend`,
  },
]

export function StatusOverview({ vehicle, health }: { vehicle: Vehicle; health: VehicleHealth }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {statusCards(vehicle, health).map((item) => (
        <Card key={item.label} className="rounded-[26px] p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">{item.label}</p>
          <p className="mt-2 font-display text-[2rem] leading-none">{item.value}</p>
          <p className="mt-2 text-sm leading-5 text-ink/62">{item.hint}</p>
        </Card>
      ))}
    </div>
  )
}
