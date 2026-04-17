import { NavLink } from 'react-router-dom'
import { CarFront, Camera, ClipboardList, LogOut, MessageSquareText, Wrench } from 'lucide-react'
import { useAuth } from '../../features/auth/auth-provider'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils/cn'
import { useSessionStore } from '../../store/session-store'
import { Button } from '../ui/button'

const navItems = [
  { to: '/', labelKey: 'nav_dashboard', icon: CarFront },
  { to: '/vehicle', labelKey: 'nav_vehicle', icon: Wrench },
  { to: '/lens', labelKey: 'nav_lens', icon: Camera },
  { to: '/history', labelKey: 'nav_history', icon: ClipboardList },
  { to: '/assistant', labelKey: 'nav_assistant', icon: MessageSquareText },
] as const

export function TopNav() {
  const driverProfile = useSessionStore((state) => state.user)
  const uiLanguage = useSessionStore((state) => state.uiLanguage)
  const setUiLanguage = useSessionStore((state) => state.setUiLanguage)
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
        <div className="flex items-center justify-between gap-4 lg:shrink-0">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink/45">Tasco Open Mobility</p>
            <p className="font-display text-[1.7rem] leading-none tracking-tight">WashGo Copilot</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-2 text-right shadow-sm lg:hidden">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">{t(uiLanguage, 'auth_signed_in')}</p>
              <p className="text-sm font-semibold text-ink">{displayName}</p>
            </div>
            <Button variant="ghost" className="px-3" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 lg:min-w-0">
          <div className="inline-flex items-center rounded-full border border-white/80 bg-white/80 p-1 shadow-sm lg:shrink-0">
            <button
              type="button"
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                uiLanguage === 'en' ? 'bg-ink text-white' : 'text-ink/65 hover:bg-sand',
              )}
              onClick={() => setUiLanguage('en')}
              aria-label="Switch language to English"
            >
              {t(uiLanguage, 'language_en')}
            </button>
            <button
              type="button"
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                uiLanguage === 'vi' ? 'bg-ink text-white' : 'text-ink/65 hover:bg-sand',
              )}
              onClick={() => setUiLanguage('vi')}
              aria-label="Switch language to Vietnamese"
            >
              {t(uiLanguage, 'language_vi')}
            </button>
          </div>
          <nav className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto rounded-full border border-white/80 bg-white/80 p-1.5 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map(({ to, labelKey, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold transition sm:px-4',
                    isActive
                      ? 'bg-ink text-white shadow-[0_10px_20px_rgba(20,33,61,0.18)]'
                      : 'text-ink/70 hover:bg-sand hover:text-ink',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{t(uiLanguage, labelKey)}</span>
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-2 shadow-sm lg:flex lg:shrink-0">
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">{t(uiLanguage, 'auth_signed_in')}</p>
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
