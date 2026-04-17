import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { useSessionStore } from '../../../store/session-store'
import { AnalysisResultCard } from './analysis-result-card'
import { LensActionBar } from './lens-action-bar'
import { PhotoUploader } from './photo-uploader'
import { useLensAnalysis } from '../hooks/use-lens-analysis'

const DEMO_IMAGE_URLS = {
  engineWarning: new URL('../../../lib/mocks/demo-images/enginewarnlight.jpeg', import.meta.url).href,
  tireWarning: new URL('../../../lib/mocks/demo-images/tirepressurewarn.jpeg', import.meta.url).href,
  receipt: new URL('../../../lib/mocks/demo-images/samplereceipt.jpeg', import.meta.url).href,
  serviceBook: new URL('../../../lib/mocks/demo-images/servicebook.jpeg', import.meta.url).href,
}

type LensMode = 'warning' | 'service_book'

async function urlToFile(url: string, fileName: string): Promise<File> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new File([blob], fileName, { type: blob.type || 'image/jpeg' })
}

export function LensPage() {
  const [mode, setMode] = useState<LensMode>('warning')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewObjectUrlRef = useRef<string | null>(null)
  const [entriesSaved, setEntriesSaved] = useState(false)
  const appendCarHealthRecordEntries = useSessionStore((state) => state.appendCarHealthRecordEntries)
  const {
    analyzeWarningLight,
    analyzeServiceBook,
    warningResult,
    serviceBookResult,
    warningError,
    serviceBookError,
    isAnalyzingWarning,
    isAnalyzingServiceBook,
  } = useLensAnalysis()

  const isAnalyzing = isAnalyzingWarning || isAnalyzingServiceBook
  const activeError = mode === 'warning' ? warningError : serviceBookError

  const handleFileChange = (file: File | null) => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }

    setSelectedFile(file)
    setEntriesSaved(false)
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    previewObjectUrlRef.current = objectUrl
    setPreviewUrl(objectUrl)
  }

  const handlePickDemo = async (demo: 'engine' | 'tire' | 'receipt' | 'servicebook') => {
    const selection = {
      engine: { url: DEMO_IMAGE_URLS.engineWarning, name: 'enginewarnlight.jpeg' },
      tire: { url: DEMO_IMAGE_URLS.tireWarning, name: 'tirepressurewarn.jpeg' },
      receipt: { url: DEMO_IMAGE_URLS.receipt, name: 'samplereceipt.jpeg' },
      servicebook: { url: DEMO_IMAGE_URLS.serviceBook, name: 'servicebook.jpeg' },
    }[demo]

    try {
      const file = await urlToFile(selection.url, selection.name)
      handleFileChange(file)
    } catch {
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return
    setEntriesSaved(false)

    if (mode === 'warning') {
      await analyzeWarningLight(selectedFile)
      return
    }
    await analyzeServiceBook(selectedFile)
  }

  const handleSaveEntries = () => {
    if (!serviceBookResult?.entries.length) return
    appendCarHealthRecordEntries(serviceBookResult.entries)
    setEntriesSaved(true)
  }

  const actionBar = useMemo(() => {
    if (mode === 'warning' && warningResult) {
      return (
        <LensActionBar
          assistantPrompt={`I scanned a warning light: ${warningResult.symbolName}. Please explain urgency and the safest next step for my Toyota Vios.`}
          suggestedServiceType={warningResult.suggestedServiceType}
        />
      )
    }

    if (mode === 'service_book' && serviceBookResult) {
      const extractedCount = serviceBookResult.entries.length
      return (
        <LensActionBar
          assistantPrompt={`I extracted ${extractedCount} service entries from my service book image. Summarize what this means and what service I should prioritize next.`}
          suggestedServiceType="car_repair"
        />
      )
    }

    return null
  }, [mode, serviceBookResult, warningResult])

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,_rgba(12,36,58,1)_0%,_rgba(21,57,90,1)_52%,_rgba(245,125,41,0.94)_100%)] text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/62">Dashboard Lens</p>
            <p className="mt-2 font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">Visual diagnostics and record extraction</p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/82">
              Upload a dashboard warning light or service document to get structured AI output with direct assistant and booking actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={mode === 'warning' ? 'secondary' : 'ghost'}
              className={mode === 'warning' ? '' : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}
              onClick={() => setMode('warning')}
            >
              Warning Light
            </Button>
            <Button
              variant={mode === 'service_book' ? 'secondary' : 'ghost'}
              className={mode === 'service_book' ? '' : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}
              onClick={() => setMode('service_book')}
            >
              Service Book
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">Demo image shortcuts</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => void handlePickDemo('engine')}>Use engine warning</Button>
          <Button variant="ghost" onClick={() => void handlePickDemo('tire')}>Use tire pressure warning</Button>
          <Button variant="ghost" onClick={() => void handlePickDemo('receipt')}>Use sample receipt</Button>
          <Button variant="ghost" onClick={() => void handlePickDemo('servicebook')}>Use service book</Button>
        </div>
      </Card>

      <PhotoUploader file={selectedFile} previewUrl={previewUrl} onFileChange={handleFileChange} />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void handleAnalyze()} disabled={!selectedFile || isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : mode === 'warning' ? 'Analyze warning light' : 'Extract service history'}
        </Button>
        {activeError ? <Badge tone="danger">Analysis failed, fallback used</Badge> : null}
      </div>

      {mode === 'warning' && warningResult ? (
        <AnalysisResultCard mode="warning" warningResult={warningResult} />
      ) : null}

      {mode === 'service_book' && serviceBookResult ? (
        <div className="space-y-3">
          <AnalysisResultCard mode="service_book" serviceBookResult={serviceBookResult} />
          <div className="flex items-center gap-2">
            <Button onClick={handleSaveEntries} disabled={!serviceBookResult.entries.length || entriesSaved}>
              {entriesSaved ? 'Saved to history' : 'Add extracted entries to history'}
            </Button>
            {entriesSaved ? <Badge tone="good">Entries appended</Badge> : null}
          </div>
        </div>
      ) : null}

      {actionBar}
    </div>
  )
}
