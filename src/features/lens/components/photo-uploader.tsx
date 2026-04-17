import { Upload } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'

type PhotoUploaderProps = {
  file: File | null
  previewUrl: string | null
  onFileChange: (file: File | null) => void
}

export function PhotoUploader({ file, previewUrl, onFileChange }: PhotoUploaderProps) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45">Input</p>
        <p className="mt-2 font-display text-[1.9rem] leading-tight">Upload a photo</p>
        <p className="mt-2 text-sm leading-6 text-ink/68">
          Use a clear dashboard or service document image. Better lighting gives better extraction.
        </p>
      </div>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-ink/20 bg-sand/45 px-4 py-8 text-center">
        <Upload className="h-7 w-7 text-ink/45" />
        <p className="mt-3 text-sm font-semibold text-ink">Choose image</p>
        <p className="mt-1 text-xs text-ink/55">JPG, PNG, WEBP</p>
        <input
          className="hidden"
          type="file"
          accept="image/*"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
      </label>

      {file ? <p className="text-sm text-ink/75">Selected: {file.name}</p> : null}

      {previewUrl ? (
        <div className="overflow-hidden rounded-[22px] border border-ink/10">
          <img src={previewUrl} alt="Lens preview" className="h-auto w-full object-cover" />
        </div>
      ) : null}

      {file ? (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => onFileChange(null)}>
            Remove file
          </Button>
        </div>
      ) : null}
    </Card>
  )
}

