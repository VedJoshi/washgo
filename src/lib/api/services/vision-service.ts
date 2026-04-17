import type { ServiceRecordExtraction, WarningLightResult } from '../../../types/domain'

export interface VisionService {
  analyzeWarningLight(input: { imageDataUrl: string; fileName?: string }): Promise<WarningLightResult>
  extractServiceBook(input: { imageDataUrl: string; fileName?: string }): Promise<ServiceRecordExtraction>
}

