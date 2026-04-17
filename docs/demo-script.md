# WashGo Demo Script — 3 Minutes

## Setup
- App is open and logged in, sitting on the Dashboard
- Qwen API key is set in `.env`
- Use the demo image shortcuts on the Lens page (no need to find real photos)

---

## [0:00 — Dashboard]

> *"Every morning, Qwen generates a personalised brief for this driver."*

- Land on dashboard. Point to the greeting and alert cards.
- *"This is qwen-plus in JSON mode — structured output, not a chatbot."*
- Click **"Ask why"** → goes to assistant with pre-filled context.

---

## [0:30 — Assistant]

> *"The assistant is Qwen-max with streaming and live tool calls."*

- Type: `Find me a Tasco garage for a battery diagnostic this weekend`
- Watch the tool-call chips appear: *"Checking nearby services… Fetching quote…"*
- *"Every chip is a real function call — the model is reasoning over distance, price, and availability."*
- Let the response stream fully.

---

## [1:20 — Vehicle]

> *"The health score and all recommendations are also Qwen-generated."*

- Navigate to Vehicle. Point to health score and recommendation cards.
- *"Change the mock odometer and Qwen recalculates — it's not a lookup table."*

---

## [1:50 — Lens]

> *"Now for the vision demo — this is what no other team has."*

- Navigate to Lens. Click **"Use engine warning"** shortcut.
- Hit **"Analyze warning light"**.
- When result appears: *"Qwen-VL identified the symbol, assessed urgency, and recommended an action. One photo, one API call."*
- Switch to **Service Book** tab. Click **"Use sample receipt"**.
- Hit **"Extract service history"**, then **"Add extracted entries to history"**.
- *"Paper records digitised in seconds — this is the data moat."*

---

## [2:30 — History]

> *"Everything feeds into the car health record."*

- Navigate to History. Show the full timeline — point to the just-extracted "Lens" badge entry at the top.
- Point to the stats row: services count, total VND spent, next due date.
- Wait for valuation insight to load: *"Qwen generates a resale value insight from the full record."*

---

## [2:50 — Close]

> *"The assistant now has the full history in its context. Ask it anything and it references real data — not hardcoded answers."*

- *"Tasco's 4.1M drivers, daily engagement, one Qwen-powered copilot. That's the pitch."*

---

## Fallback Notes
- If Qwen API is slow: all pages have deterministic fallbacks — the demo never breaks
- If streaming stalls: the non-streaming fallback fires automatically after timeout
- Demo images are bundled in the app — no internet needed for Lens shortcuts
