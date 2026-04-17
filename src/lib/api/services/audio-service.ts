export interface AudioTranscriptionResult {
  text: string
  confidence?: number
}

export interface AudioService {
  transcribeAudio(input: {
    blob: Blob
    mimeType: string
    language?: 'en' | 'vi'
  }): Promise<AudioTranscriptionResult>
}

