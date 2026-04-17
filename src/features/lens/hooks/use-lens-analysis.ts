import { useMutation } from '@tanstack/react-query'
import type { ServiceRecordExtraction, WarningLightResult } from '../../../types/domain'
import { visionService } from '../../../lib/api/adapters/qwen-vision-service'

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

export function useLensAnalysis() {
  const warningMutation = useMutation({
    mutationFn: async (file: File): Promise<WarningLightResult> => {
      const imageDataUrl = await fileToDataUrl(file)
      return visionService.analyzeWarningLight({ imageDataUrl, fileName: file.name })
    },
  })

  const serviceBookMutation = useMutation({
    mutationFn: async (file: File): Promise<ServiceRecordExtraction> => {
      const imageDataUrl = await fileToDataUrl(file)
      return visionService.extractServiceBook({ imageDataUrl, fileName: file.name })
    },
  })

  return {
    analyzeWarningLight: warningMutation.mutateAsync,
    analyzeServiceBook: serviceBookMutation.mutateAsync,
    warningResult: warningMutation.data,
    serviceBookResult: serviceBookMutation.data,
    warningError: warningMutation.error,
    serviceBookError: serviceBookMutation.error,
    isAnalyzingWarning: warningMutation.isPending,
    isAnalyzingServiceBook: serviceBookMutation.isPending,
  }
}

