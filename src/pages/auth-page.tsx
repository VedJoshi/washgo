import type { FormEvent } from 'react'
import { useState } from 'react'
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAuth } from '../features/auth/auth-provider'

export function AuthPage() {
  const { signInWithMagicLink, isConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [didSendLink, setDidSendLink] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setDidSendLink(false)

    if (!email.trim()) {
      setErrorMessage('Enter an email address to receive the magic link.')
      return
    }

    setIsSubmitting(true)
    const result = await signInWithMagicLink(email.trim())
    setIsSubmitting(false)

    if (result.errorMessage) {
      setErrorMessage(result.errorMessage)
      return
    }

    setDidSendLink(true)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_30%),linear-gradient(180deg,_#fbf7f0_0%,_#f3ede3_100%)] px-4 py-6 text-ink sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden border-none bg-[linear-gradient(145deg,_rgba(13,34,57,1)_0%,_rgba(22,58,87,1)_60%,_rgba(236,114,34,0.92)_100%)] p-6 text-white sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Tasco Open Mobility</p>
          <h1 className="mt-4 max-w-xl font-display text-[2.8rem] leading-[0.95] sm:text-[4rem]">
            A daily driver copilot that feels signed in and real.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/78 sm:text-[15px]">
            Keep the same dashboard, vehicle diagnostic, booking, and assistant flow. Supabase Auth simply gives the MVP a credible product shell and a persistent signed-in state.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Flow</p>
              <p className="mt-2 font-display text-2xl">Magic link</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">State</p>
              <p className="mt-2 font-display text-2xl">Persistent</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Backend</p>
              <p className="mt-2 font-display text-2xl">Auth only</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">Welcome</p>
          <h2 className="mt-3 font-display text-[2.3rem] leading-tight">Sign in to open WashGo Copilot</h2>
          <p className="mt-3 text-sm leading-6 text-ink/68">
            Use a Supabase magic link for the fastest demo-friendly login flow. Once signed in, the current mock product experience stays exactly the same.
          </p>

          {!isConfigured ? (
            <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
              <p className="font-semibold">Supabase is not configured yet.</p>
              <p className="mt-1">
                Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to a `.env.local` file, then restart the Vite dev server.
              </p>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink/80">Email address</span>
                <Input
                  autoComplete="email"
                  placeholder="you@company.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <Button className="w-full gap-2" disabled={isSubmitting} type="submit">
                <Mail className="h-4 w-4" />
                {isSubmitting ? 'Sending link...' : 'Send magic link'}
              </Button>
            </form>
          )}

          {didSendLink ? (
            <div className="mt-4 flex gap-3 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" />
              <p>Magic link sent. Open it on this device to continue straight into the dashboard.</p>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-4 rounded-[22px] border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-900">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-6 rounded-[24px] border border-ink/8 bg-sand/60 px-4 py-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-ink/65" />
              <div className="text-sm leading-6 text-ink/70">
                <p className="font-semibold text-ink">Hackathon-friendly setup</p>
                <p className="mt-1">
                  Frontend uses only the public Supabase URL and anon key. Vehicle, booking, and assistant data remain mock-driven for the demo.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
