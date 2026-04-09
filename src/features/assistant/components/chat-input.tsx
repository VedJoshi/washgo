import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/textarea'

export function ChatInput({
  isSending,
  onSend,
}: {
  isSending: boolean
  onSend: (message: string) => void
}) {
  const [value, setValue] = useState('')

  return (
    <div className="space-y-3 rounded-[26px] border border-ink/8 bg-white/75 p-4">
      <Textarea
        placeholder="Ask about a warning light, maintenance timing, or the recommendation."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-24 border-none bg-transparent px-0 py-0 focus:border-none"
      />
      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (!value.trim()) return
            onSend(value.trim())
            setValue('')
          }}
          disabled={isSending}
        >
          {isSending ? 'Sending...' : 'Send message'}
        </Button>
      </div>
    </div>
  )
}
