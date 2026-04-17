import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { useSessionStore } from '../../../store/session-store'

type LensActionBarProps = {
  assistantPrompt: string
  suggestedServiceType: string
}

function mapServiceFinderType(serviceType: string): 'car_wash' | 'car_repair' {
  return serviceType === 'car_wash' ? 'car_wash' : 'car_repair'
}

export function LensActionBar({ assistantPrompt, suggestedServiceType }: LensActionBarProps) {
  const navigate = useNavigate()
  const setPendingAssistantPrompt = useSessionStore((state) => state.setPendingAssistantPrompt)
  const setServiceFinderServiceType = useSessionStore((state) => state.setServiceFinderServiceType)

  const handleAskAssistant = () => {
    setPendingAssistantPrompt(assistantPrompt)
    navigate('/assistant')
  }

  const handleBookService = () => {
    setServiceFinderServiceType(mapServiceFinderType(suggestedServiceType))
    navigate('/booking')
  }

  return (
    <Card className="border-none bg-[linear-gradient(180deg,_rgba(23,58,91,1)_0%,_rgba(18,46,72,1)_100%)] text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Next action</p>
          <p className="mt-2 font-display text-[1.9rem] leading-tight">Continue from Lens</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={handleAskAssistant}>
            Ask assistant about this
          </Button>
          <Button className="bg-white text-ink hover:bg-sand" onClick={handleBookService}>
            Book a service
          </Button>
        </div>
      </div>
    </Card>
  )
}

