import { Badge } from '../../../components/ui/badge'
import { Card } from '../../../components/ui/card'
import type { ServiceRecordExtraction, WarningLightResult } from '../../../types/domain'

function urgencyTone(urgency: WarningLightResult['urgency']): 'danger' | 'warn' | 'neutral' {
  if (urgency === 'immediate') return 'danger'
  if (urgency === 'soon') return 'warn'
  return 'neutral'
}

function confidenceTone(confidence: ServiceRecordExtraction['confidence']): 'good' | 'warn' | 'danger' {
  if (confidence === 'high') return 'good'
  if (confidence === 'medium') return 'warn'
  return 'danger'
}

type AnalysisResultCardProps =
  | { mode: 'warning'; warningResult: WarningLightResult; serviceBookResult?: never }
  | { mode: 'service_book'; warningResult?: never; serviceBookResult: ServiceRecordExtraction }

export function AnalysisResultCard(props: AnalysisResultCardProps) {
  if (props.mode === 'warning') {
    const result = props.warningResult

    return (
      <Card className="space-y-4 border-none bg-[linear-gradient(135deg,_rgba(18,46,72,1)_0%,_rgba(26,69,106,1)_70%,_rgba(244,130,48,0.95)_100%)] text-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-[2rem] leading-tight">Warning light result</p>
          <Badge tone={urgencyTone(result.urgency)}>{result.urgency}</Badge>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/65">Detected symbol</p>
          <p className="mt-2 text-lg font-semibold">{result.symbolName}</p>
        </div>
        <p className="text-sm leading-6 text-white/85">{result.explanation}</p>
        <div className="rounded-[18px] border border-white/15 bg-white/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/65">Recommended action</p>
          <p className="mt-2 text-sm leading-6 text-white/92">{result.recommendedAction}</p>
        </div>
      </Card>
    )
  }

  const result = props.serviceBookResult

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-[2rem] leading-tight text-ink">Extraction result</p>
        <Badge tone={confidenceTone(result.confidence)}>{result.confidence} confidence</Badge>
      </div>

      <p className="text-sm leading-6 text-ink/75">{result.notes}</p>

      {result.entries.length ? (
        <div className="space-y-3">
          {result.entries.slice(0, 3).map((entry) => (
            <div key={entry.id} className="rounded-[18px] border border-ink/10 bg-white/75 p-4">
              <p className="text-sm font-semibold text-ink">{entry.serviceType.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
              <p className="mt-1 text-sm text-ink/70">{entry.date} - {entry.garageName}</p>
              <p className="mt-1 text-sm text-ink/62">
                {entry.costVnd > 0 ? `${entry.costVnd.toLocaleString('vi-VN')} VND` : 'Cost unknown'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink/65">No entries extracted from this image.</p>
      )}
    </Card>
  )
}
