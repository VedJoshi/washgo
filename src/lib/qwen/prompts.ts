import type {
  Vehicle,
  VehicleHealth,
  CarHealthRecord,
  ETCWallet,
  TelemetryReading,
} from '../../types/domain'

export function buildVehicleHealthPrompt(
  vehicle: Vehicle,
  healthRecord: CarHealthRecord,
): string {
  return `You are an expert automotive diagnostic assistant. Analyze the following vehicle data and generate a structured health assessment.

Vehicle:
- Make: ${vehicle.make}
- Model: ${vehicle.model}
- Year: ${vehicle.year}
- Plate: ${vehicle.plateNumber}
- Odometer: ${vehicle.currentOdometerKm.toLocaleString()} km
- Last service: ${vehicle.lastServiceDate}
- Next service due at: ${vehicle.nextServiceDueKm.toLocaleString()} km

Service History (${healthRecord.entries.length} entries):
${healthRecord.entries.map((e) => `- ${e.date}: ${e.serviceType} at ${e.garageName} (${e.odometerKm.toLocaleString()} km) - ${e.costVnd.toLocaleString()} VND`).join('\n')}

Total spent on maintenance: ${healthRecord.totalSpentVnd.toLocaleString()} VND

Return a JSON object matching this exact schema:
{
  "vehicleId": "${vehicle.id}",
  "score": number (0-100),
  "status": "good" | "watch" | "needs_service",
  "issues": string[],
  "recommendations": [
    {
      "id": "rec-1",
      "category": "oil" | "tires" | "battery" | "inspection" | "cleaning",
      "title": string,
      "description": string,
      "issue": string,
      "impact": string,
      "actionLabel": string,
      "urgency": "low" | "medium" | "high",
      "estimatedPriceRange": string,
      "recommendedWithinDays": number
    }
  ]
}

Provide 2-4 actionable recommendations with realistic VND pricing for the Vietnamese market. Be specific about what needs attention based on the odometer, service history, and time since last service.`
}

export function buildAssistantSystemPrompt(
  vehicle: Vehicle,
  health: VehicleHealth | null,
  healthRecord: CarHealthRecord,
  etcWallet: ETCWallet | null,
  simulatedDate: string,
  location: string,
): string {
  const healthContext = health
    ? `Current Health Score: ${health.score}/100 (${health.status})
Top issues: ${health.issues.join('; ')}
Top recommendation: ${health.recommendations[0]?.title || 'None'}`
    : 'No current health assessment available.'

  const etcContext = etcWallet
    ? `VETC Wallet Balance: ${etcWallet.balanceVnd.toLocaleString()} VND
Recent toll activity: ${etcWallet.recentActivity.length} transactions this week`
    : 'VETC wallet information not available.'

  return `You are WashGo, an AI car copilot for Vietnamese car owners. You are helpful, knowledgeable, and trustworthy.

VEHICLE CONTEXT:
- Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}
- Plate: ${vehicle.plateNumber}
- Odometer: ${vehicle.currentOdometerKm.toLocaleString()} km
- Fuel type: ${vehicle.fuelType}

HEALTH:
${healthContext}

SERVICE HISTORY (last ${healthRecord.entries.length} entries):
${healthRecord.entries.map((e) => `- ${e.date}: ${e.serviceType} at ${e.garageName} - ${e.costVnd.toLocaleString()} VND`).join('\n')}

ECOSYSTEM:
${etcContext}

CURRENT CONTEXT:
- Date: ${simulatedDate}
- Location: ${location}

INSTRUCTIONS:
- Answer car-related questions helpfully and accurately
- Reference the user's specific vehicle data when relevant
- If the user writes in Vietnamese, respond in Vietnamese
- If the user writes in English, respond in English
- Be concise but thorough
- When recommending services, suggest realistic VND price ranges
- If you don't know something specific, say so honestly
- You can help with: maintenance advice, service booking, garage recommendations, cost estimates, warning light explanations, and general car care`
}

export function buildMorningBriefPrompt(
  date: string,
  dayOfWeek: string,
  vehicle: Vehicle,
  health: VehicleHealth | null,
  etcWallet: ETCWallet | null,
  nextServiceDue: string | null,
): string {
  return `You are writing a personalized morning brief for a car owner. Make it warm, practical, and actionable.

Today: ${dayOfWeek}, ${date}
Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})
Odometer: ${vehicle.currentOdometerKm.toLocaleString()} km
${health ? `Health Score: ${health.score}/100 (${health.status})` : ''}
${health && health.issues.length > 0 ? `Top concern: ${health.issues[0]}` : ''}
${etcWallet ? `VETC Balance: ${etcWallet.balanceVnd.toLocaleString()} VND (${etcWallet.recentActivity.length} tolls this week)` : ''}
${nextServiceDue ? `Next service due: ${nextServiceDue}` : ''}

Return a JSON object matching this exact schema:
{
  "greeting": string (warm, personalized, 1 sentence),
  "summary": string (2 sentences max, covering the day's car priorities),
  "alerts": [
    {
      "id": "alert-1",
      "type": "maintenance" | "traffic" | "parking" | "toll",
      "title": string,
      "message": string,
      "severity": "low" | "medium" | "high"
    }
  ],
  "suggestedActions": [
    {
      "id": "qa-1",
      "label": string,
      "href": "/" | "/vehicle" | "/booking" | "/assistant" | "/lens" | "/history" | "/telemetry"
    }
  ]
}

Generate 2-3 alerts and 2-3 suggested actions. Make the alerts specific to the vehicle's current state.`
}

export function buildWarningLightPrompt(): string {
  return `Analyze this dashboard warning light photo. Return a JSON object matching this exact schema:
{
  "symbolName": string (name of the warning symbol),
  "explanation": string (2-3 sentences in plain English explaining what it means),
  "urgency": "immediate" | "soon" | "monitor",
  "recommendedAction": string (specific action the driver should take),
  "suggestedServiceType": string (maps to: oil_change, battery, tire_rotation, diagnostic, brake_service, car_wash, car_repair)
}

If the image is unclear or you cannot identify the symbol, return:
{
  "symbolName": "Unknown",
  "explanation": "The image is not clear enough to identify a specific warning light. Please try again with a clearer photo.",
  "urgency": "monitor",
  "recommendedAction": "Take a clearer photo of the dashboard with good lighting.",
  "suggestedServiceType": "diagnostic"
}`
}

export function buildServiceBookExtractionPrompt(): string {
  return `Extract all service history entries visible in this service book or receipt photo. Return a JSON object matching this exact schema:
{
  "entries": [
    {
      "id": "extracted-1",
      "date": string (YYYY-MM-DD format, or "unknown" if not readable),
      "odometerKm": number (or 0 if not readable),
      "serviceType": string,
      "garageId": "unknown",
      "garageName": string (or "Unknown garage" if not readable),
      "costVnd": number (or 0 if not readable),
      "partsReplaced": string[],
      "warrantyExpiryDate": string | null,
      "notes": string,
      "source": "lens_extracted"
    }
  ],
  "confidence": "high" | "medium" | "low",
  "notes": string (e.g., "Partially legible — 2 of 4 entries extracted")
}

Extract as many entries as you can read. Set confidence based on image clarity. Use "lens_extracted" as the source for all entries.`
}

export function buildTelemetryAnalysisPrompt(
  vehicle: Vehicle,
  healthRecord: CarHealthRecord,
  reading: TelemetryReading,
): string {
  return `Analyze this vehicle telemetry reading and provide structured insights.

Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}
Odometer: ${vehicle.currentOdometerKm.toLocaleString()} km

Service History:
${healthRecord.entries.map((e) => `- ${e.date}: ${e.serviceType} (${e.odometerKm.toLocaleString()} km)`).join('\n')}

Current Reading:
- Fuel level: ${reading.fuelLevelPct !== null ? `${reading.fuelLevelPct}%` : 'Not provided'}
- Tyre pressure: FL=${reading.tyrePressurePsi.frontLeft ?? 'N/A'} PSI, FR=${reading.tyrePressurePsi.frontRight ?? 'N/A'} PSI, RL=${reading.tyrePressurePsi.rearLeft ?? 'N/A'} PSI, RR=${reading.tyrePressurePsi.rearRight ?? 'N/A'} PSI
- Oil level: ${reading.oilLevelPct !== null ? `${reading.oilLevelPct}%` : 'Not provided'}
- Coolant level: ${reading.coolantLevelPct !== null ? `${reading.coolantLevelPct}%` : 'Not provided'}
- Battery voltage: ${reading.batteryVoltage !== null ? `${reading.batteryVoltage}V` : 'Not provided'}
- Notes: ${reading.notes || 'None'}

Return a JSON object matching this exact schema:
{
  "summary": string (1-2 sentences summarizing the overall state),
  "predictions": [
    { "label": string, "detail": string }
  ],
  "alerts": [
    { "metric": string, "message": string, "severity": "low" | "medium" | "high" }
  ],
  "bookingCta": {
    "show": boolean,
    "serviceType": string,
    "reason": string
  }
}

Provide 1-3 predictions, 0-3 alerts based on readings, and recommend a booking CTA only if something is concerning. Use realistic thresholds (battery < 12.2V is concerning, tyre pressure outside 28-35 PSI for a Vios is flagged, etc.).`
}
