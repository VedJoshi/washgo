import { Mic, SendHorizontal, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../../lib/utils/cn'
import { Textarea } from '../../../components/ui/textarea'
import { audioService } from '../../../lib/api/adapters/qwen-audio-service'
import { t } from '../../../lib/i18n'
import { useSessionStore } from '../../../store/session-store'

type BrowserSpeechRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

export function ChatInput({
  isSending,
  onSend,
}: {
  isSending: boolean
  onSend: (message: string) => void
}) {
  const [value, setValue] = useState('')
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'transcribing'>('idle')
  const [voiceHint, setVoiceHint] = useState<string | null>(null)
  const [liveSpeechPreview, setLiveSpeechPreview] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const localFinalSpeechRef = useRef('')
  const pendingAssistantVoiceCapture = useSessionStore((state) => state.pendingAssistantVoiceCapture)
  const uiLanguage = useSessionStore((state) => state.uiLanguage)
  const setPendingAssistantVoiceCapture = useSessionStore((state) => state.setPendingAssistantVoiceCapture)
  const hasValue = value.trim().length > 0
  const sttEnabled = Boolean(import.meta.env.VITE_QWEN_API_KEY)
  const isRecording = voiceState === 'recording'
  const isTranscribing = voiceState === 'transcribing'

  const submit = () => {
    if (!hasValue || isSending || isTranscribing) return
    onSend(value.trim())
    setValue('')
  }

  const cleanupRecorder = () => {
    recorderRef.current = null
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop()
      speechRecognitionRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    chunksRef.current = []
  }

  const startRecording = async () => {
    if (!sttEnabled || isTranscribing || isRecording) return
    setVoiceHint(null)

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceHint(t(uiLanguage, 'assistant_voice_unsupported'))
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(chunksRef.current, { type: mimeType })
        cleanupRecorder()
        setLiveSpeechPreview('')

        if (!audioBlob.size) {
          setVoiceState('idle')
          setVoiceHint(t(uiLanguage, 'assistant_voice_no_audio'))
          return
        }

        setVoiceState('transcribing')
        setVoiceHint(t(uiLanguage, 'assistant_voice_transcribing'))

        try {
          const language = navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en'
          const { text } = await audioService.transcribeAudio({
            blob: audioBlob,
            mimeType,
            language,
          })
          setValue((prev) => (prev.trim().length ? `${prev.trimEnd()} ${text}` : text))
          setVoiceHint(t(uiLanguage, 'assistant_voice_ready'))
        } catch (error) {
          const localFallback = localFinalSpeechRef.current.trim()
          if (localFallback) {
            setValue((prev) => (prev.trim().length ? `${prev.trimEnd()} ${localFallback}` : localFallback))
            setVoiceHint(t(uiLanguage, 'assistant_voice_fallback'))
            setVoiceState('idle')
            return
          }
          setVoiceHint(t(uiLanguage, 'assistant_voice_transcribe_error'))
        } finally {
          localFinalSpeechRef.current = ''
          setLiveSpeechPreview('')
          setVoiceState('idle')
        }
      }

      const SpeechRecognitionCtor =
        (window as unknown as { SpeechRecognition?: new () => BrowserSpeechRecognition }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => BrowserSpeechRecognition }).webkitSpeechRecognition

      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor()
        recognition.lang = navigator.language || 'en-US'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = (event) => {
          let interimText = ''
          let finalText = localFinalSpeechRef.current

          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const result = event.results[i]
            const transcript = result?.[0]?.transcript || ''
            if (result.isFinal) {
              finalText = `${finalText} ${transcript}`.trim()
            } else {
              interimText = `${interimText} ${transcript}`.trim()
            }
          }

          localFinalSpeechRef.current = finalText
          setLiveSpeechPreview(interimText || finalText)
        }
        recognition.onerror = () => {
          // Keep MediaRecorder path active even if browser speech preview fails.
        }
        recognition.start()
        speechRecognitionRef.current = recognition
      }

      recorder.start()
      setVoiceState('recording')
      setVoiceHint(t(uiLanguage, 'assistant_voice_recording'))
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'NotAllowedError'
          ? t(uiLanguage, 'assistant_voice_permission_denied')
          : t(uiLanguage, 'assistant_voice_start_error')
      setVoiceHint(message)
      setLiveSpeechPreview('')
      localFinalSpeechRef.current = ''
      cleanupRecorder()
      setVoiceState('idle')
    }
  }

  const stopRecording = () => {
    if (!isRecording) return
    speechRecognitionRef.current?.stop()
    recorderRef.current?.stop()
    setVoiceState('transcribing')
  }

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '0px'
    const nextHeight = Math.min(el.scrollHeight, 148)
    el.style.height = `${Math.max(nextHeight, 52)}px`
  }, [value])

  useEffect(
    () => () => {
      cleanupRecorder()
    },
    [],
  )

  useEffect(() => {
    if (!pendingAssistantVoiceCapture) return
    setPendingAssistantVoiceCapture(false)
    if (!sttEnabled || isRecording || isTranscribing) return
    void startRecording()
  }, [isRecording, isTranscribing, pendingAssistantVoiceCapture, setPendingAssistantVoiceCapture, sttEnabled])

  return (
    <div
      className={cn(
        'rounded-[22px] border bg-white/78 p-3 transition',
        hasValue ? 'border-ember/40 shadow-[0_10px_26px_rgba(249,115,22,0.08)]' : 'border-ink/8',
      )}
    >
      <Textarea
        ref={textareaRef}
        placeholder={t(uiLanguage, 'assistant_input_placeholder')}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
        rows={1}
        className="max-h-[148px] min-h-[52px] resize-none overflow-y-auto rounded-[16px] border-none bg-transparent px-3 py-3 text-[15px] leading-6 focus:border-none"
      />
      {isRecording && liveSpeechPreview ? (
        <p className="mt-1 px-3 text-sm italic text-ink/45">{liveSpeechPreview}</p>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="min-h-[20px] text-xs text-ink/58">
          {voiceHint ?? (sttEnabled ? t(uiLanguage, 'assistant_voice_tip') : null)}
        </div>
        <div className="flex items-center gap-2">
          {sttEnabled ? (
            <button
              type="button"
              onClick={isRecording ? stopRecording : () => void startRecording()}
              disabled={isTranscribing}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full border transition',
                isRecording
                  ? 'border-red-500/70 bg-red-500 text-white shadow-[0_8px_18px_rgba(239,68,68,0.28)]'
                  : 'border-ink/20 bg-white text-ink/55 hover:border-ember/45 hover:text-ember',
                isTranscribing && 'cursor-not-allowed opacity-60',
              )}
              aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
            >
              {isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={submit}
            disabled={!hasValue || isSending || isTranscribing}
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-full border transition',
              hasValue && !isSending && !isTranscribing
                ? 'border-ember/65 bg-white text-ember shadow-[0_8px_18px_rgba(249,115,22,0.22)] hover:bg-ember hover:text-white'
                : 'border-ink/20 bg-white text-ink/35',
            )}
            aria-label={isSending ? 'Sending message' : 'Send message'}
          >
            <SendHorizontal className={cn('h-4 w-4', (isSending || isTranscribing) && 'animate-pulse')} />
          </button>
        </div>
      </div>
    </div>
  )
}
