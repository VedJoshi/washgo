import { BatteryCharging, CircleDot, Droplets, Gauge } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { Card } from '../../../components/ui/card'
import { formatKilometers } from '../../../lib/utils/format'
import type { Vehicle, VehicleHealth } from '../../../types/domain'

function statusTone(status: 'watch' | 'needs_service' | 'good') {
  if (status === 'good') return 'good'
  if (status === 'watch') return 'warn'
  return 'danger'
}

const monitoredSystems = (vehicle: Vehicle) => [
  {
    key: 'battery',
    label: 'Battery',
    state: 'Watch',
    description: 'Short city trips and idle-heavy usage are reducing reserve stability.',
    icon: BatteryCharging,
    markerStyle: { left: '24%', top: '48%' },
    toneClassName: 'bg-amber-300',
  },
  {
    key: 'fluids',
    label: 'Engine fluids',
    state: 'Soon',
    description: `Service due in ${formatKilometers(vehicle.nextServiceDueKm - vehicle.currentOdometerKm)}.`,
    icon: Droplets,
    markerStyle: { left: '50%', top: '38%', transform: 'translateX(-50%)' },
    toneClassName: 'bg-sky-300',
  },
  {
    key: 'tires',
    label: 'Tire pressure',
    state: 'Check',
    description: 'Worth checking before any longer drive this week.',
    icon: CircleDot,
    markerStyle: { right: '24%', top: '70%' },
    toneClassName: 'bg-white',
  },
]

export function VehicleDiagnosticPanel({ vehicle, health }: { vehicle: Vehicle; health: VehicleHealth }) {
  const systems = monitoredSystems(vehicle)

  return (
    <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,_rgba(13,34,57,1)_0%,_rgba(22,58,87,1)_58%,_rgba(39,93,111,1)_100%)] p-0 text-white">
      <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="p-5 sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Your car today</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="font-display text-[2.6rem] leading-[0.96] sm:text-[3.3rem]">
              {vehicle.make} {vehicle.model}
            </p>
            <Badge tone={statusTone(health.status)}>{health.status.replace('_', ' ')}</Badge>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/74">
            Battery is the main watch item today. The vehicle is still usable, but the current driving pattern is creating more strain than normal and the next service window is getting closer.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Health score</p>
              <p className="mt-2 font-display text-5xl leading-none">{health.score}</p>
              <p className="mt-2 text-sm text-white/68">Stable enough to drive, not ideal to ignore.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Next service</p>
              <p className="mt-2 font-display text-3xl leading-none">
                {formatKilometers(vehicle.nextServiceDueKm - vehicle.currentOdometerKm)}
              </p>
              <p className="mt-2 text-sm text-white/68">Service timing is becoming part of the same decision.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-white/64">
            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2">{vehicle.nickname}</span>
            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2">{vehicle.plateNumber}</span>
            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2">
              {formatKilometers(vehicle.currentOdometerKm)} driven
            </span>
          </div>
        </div>

        <div className="border-t border-white/10 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/50">
            <Gauge className="h-4 w-4" />
            Diagnostic view
          </div>

          <div className="mt-4 grid gap-4">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.08)_0%,_rgba(255,255,255,0.03)_100%)] px-4 py-4">
              <div className="absolute inset-x-[16%] bottom-5 h-5 rounded-full bg-black/30 blur-xl" />
              <div className="absolute right-8 top-4 h-20 w-20 rounded-full bg-sky-300/10 blur-2xl" />

              <div className="relative mx-auto aspect-[5/3] w-full max-w-[360px]">
                <svg
                  viewBox="0 0 360 216"
                  className="absolute inset-0 h-full w-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="carBodyFill" x1="60" y1="60" x2="280" y2="176" gradientUnits="userSpaceOnUse">
                      <stop stopColor="rgba(255,255,255,0.18)" />
                      <stop offset="1" stopColor="rgba(255,255,255,0.05)" />
                    </linearGradient>
                    <linearGradient id="glassFill" x1="142" y1="70" x2="224" y2="126" gradientUnits="userSpaceOnUse">
                      <stop stopColor="rgba(255,255,255,0.22)" />
                      <stop offset="1" stopColor="rgba(255,255,255,0.05)" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M76 135C80 118 94 103 113 95L145 82C157 77 170 74 183 74H214C229 74 244 79 257 89L284 110C291 116 297 125 299 135L304 144C307 150 302 157 295 157H64C57 157 52 149 56 143L76 135Z"
                    fill="url(#carBodyFill)"
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M137 88H209C221 88 233 92 242 99L261 114H121L137 88Z"
                    fill="url(#glassFill)"
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <path d="M118 114H262" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeLinecap="round" />
                  <path d="M147 88L134 114" stroke="rgba(255,255,255,0.16)" strokeWidth="3" strokeLinecap="round" />
                  <path d="M213 88L223 114" stroke="rgba(255,255,255,0.16)" strokeWidth="3" strokeLinecap="round" />
                  <path d="M82 132H104" stroke="rgba(255,255,255,0.22)" strokeWidth="4" strokeLinecap="round" />
                  <path d="M261 132H284" stroke="rgba(255,255,255,0.22)" strokeWidth="4" strokeLinecap="round" />

                  <circle cx="116" cy="158" r="24" fill="#101827" />
                  <circle cx="116" cy="158" r="13" fill="rgba(226,232,240,0.92)" />
                  <circle cx="244" cy="158" r="24" fill="#101827" />
                  <circle cx="244" cy="158" r="13" fill="rgba(226,232,240,0.92)" />
                </svg>

                {systems.map((system) => (
                  <div key={system.key} className="absolute" style={system.markerStyle}>
                    <div className="relative flex h-4 w-4 items-center justify-center">
                      <div className={`absolute h-3.5 w-3.5 rounded-full ${system.toneClassName} opacity-90`} />
                      <div className="absolute h-7 w-7 rounded-full border border-white/16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {systems.map((system) => {
                const Icon = system.icon

                return (
                  <div
                    key={system.key}
                    className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-[rgba(9,20,34,0.34)] px-4 py-3 backdrop-blur-sm"
                  >
                    <div className="rounded-full bg-white/10 p-2.5">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{system.label}</p>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/60">
                          {system.state}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-white/68">{system.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
