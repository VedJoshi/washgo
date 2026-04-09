import { NavLink } from 'react-router-dom'
import { CarFront, LogOut, MessageSquareText, Wrench } from 'lucide-react'
import { useAuth } from '../../features/auth/auth-provider'
import { cn } from '../../lib/utils/cn'
import { useSessionStore } from '../../store/session-store'
import { Button } from '../ui/button'

const navItems = [
  { to: '/', label: 'Dashboard', icon: CarFront },
  { to: '/vehicle', label: 'Vehicle', icon: Wrench },
  { to: '/assistant', label: 'Assistant', icon: MessageSquareText },
]

export function TopNav() {
  const driverProfile = useSessionStore((state) => state.user)
  const { user, signOut } = useAuth()
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    driverProfile.name
  const emailLabel = user?.email ?? `${driverProfile.name.toLowerCase()}@washgo.demo`

  return (
    <header className="sticky top-0 z-20 border-b border-white/50 bg-[rgba(247,241,232,0.84)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink/45">Tasco Open Mobility</p>
            <p className="font-display text-[1.7rem] leading-none tracking-tight">WashGo Copilot</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-2 text-right shadow-sm lg:hidden">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">Signed in</p>
              <p className="text-sm font-semibold text-ink">{displayName}</p>
            </div>
            <Button variant="ghost" className="px-3" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <nav className="flex flex-wrap gap-2 rounded-full border border-white/80 bg-white/80 p-1.5 shadow-sm">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-w-[104px] items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition',
                    isActive
                      ? 'bg-ink text-white shadow-[0_10px_20px_rgba(20,33,61,0.18)]'
                      : 'text-ink/70 hover:bg-sand hover:text-ink',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-2 shadow-sm lg:flex">
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">Signed in</p>
              <p className="text-sm font-semibold text-ink">{displayName}</p>
              <p className="text-xs text-ink/55">{emailLabel}</p>
            </div>
            <Button variant="ghost" className="px-3" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
