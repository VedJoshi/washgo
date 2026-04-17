# WashGo Demo Script - 3 Minutes

## Setup
- App is open and logged in, sitting on Dashboard.
- Qwen API key and STT model are set in `.env`.
- Use the demo image shortcuts on Lens page.

---

## [0:00 - Dashboard]

> "Every morning, Qwen generates a personalized brief for this driver."

- Land on dashboard and point to greeting + alert cards.
- Say: "This is qwen-plus in JSON mode with structured output."
- Click a quick action to move into assistant context.

---

## [0:30 - Assistant + Voice]

> "The assistant is qwen-max with streaming, function calling, and now voice input via Qwen STT."

- Tap mic in chat input and speak: `Find me a Tasco garage for a battery diagnostic this weekend`.
- Show transcript inserted into input, then send.
- Watch tool chips: "Checking nearby services...", "Calculating quote...".
- Let response stream to completion.

---

## [1:10 - Vehicle]

> "The health score and recommendations are also Qwen-generated."

- Navigate to Vehicle.
- Point to score and recommendation cards.
- Say: "Change odometer/last-service seed and Qwen recalculates."

---

## [1:40 - Lens]

> "Now the vision moment: warning-light explanation and service record extraction."

- Navigate to Lens, click `Use engine warning`, then `Analyze warning light`.
- Explain urgency/action result.
- Switch to Service Book tab, click `Use sample receipt`, then `Extract service history`.
- Click `Add extracted entries to history`.

---

## [2:20 - Booking Intelligence]

> "Booking is now AI-guided, not static."

- Navigate to Booking.
- Point to booking brief card (why now, mechanic tip, recommended slot, duration).
- Point to nearby garages card (rating, call, directions).

---

## [2:40 - History]

> "Everything feeds into a persistent car health record."

- Navigate to History.
- Show the latest lens-extracted entry in timeline.
- Point to stats row and valuation insight.

---

## [2:55 - Close]

> "Four Qwen capabilities in one flow: structured reasoning, agent tools, vision, and voice. That is WashGo's daily engagement moat for Tasco drivers."

---

## Fallback Notes
- If Qwen is slow, deterministic fallbacks keep the demo unblocked.
- If streaming stalls, non-stream fallback still returns an answer.
- If STT fails or mic permission is denied, user can type immediately.
- Demo images are bundled in app; no external lookup needed for Lens shortcuts.
