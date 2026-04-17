import { Outlet } from 'react-router-dom'
import { TopNav } from './top-nav'

export function AppShell() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_32%),linear-gradient(180deg,_#fbf7f0_0%,_#f3ede3_100%)] text-ink">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
