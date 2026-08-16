# NeerNetra — NMC Zone Water Monitoring App
## Master Build Prompt for Antigravity

Build a full MERN stack web application called **NeerNetra**. Below is the complete spec — build it end-to-end in one pass, then I will test and give feedback.

---

## 1. Tech Stack
- **Backend:** Node.js + Express
- **Database:** MongoDB (use Mongoose). Use a local MongoDB or MongoDB Atlas free tier connection string — set it in a `.env` file as `MONGO_URI`.
- **Frontend:** React (Vite), plain CSS or Tailwind — keep styling simple and clean, not a priority
- **Auth:** JWT-based login (bcrypt for password hashing, jsonwebtoken for tokens)
- **AI:** Google Gemini API (I will provide the API key in `.env` as `GEMINI_API_KEY`) — use the `gemini-1.5-flash` model via REST call for cost/speed
- **Charts:** any simple React chart library (e.g. `recharts`) for the NRW% trend line

---

## 2. Data Model

### `User` (NMC worker accounts)
```js
{
  username: String, required, unique,
  passwordHash: String, required,
  role: { type: String, default: "nmc_worker" }
}
```
Seed ONE demo worker account: username `nmcworker1`, password `password123` (hash it properly, don't store plaintext).

### `MonthlyRecord` (one row = one zone, one month)
```js
{
  zone: String,          // e.g. "ASHI NAGAR"
  month: String,         // e.g. "2026-06", format YYYY-MM
  mld_supplied: Number,  // water supplied that month, in MLD
  nrw_pct: Number,       // non-revenue water percentage
  tanker_count: Number,  // tankers dispatched that month
  uploaded_by: String,   // worker username or "seed_script"
  is_synthetic: Boolean  // true for demo-seeded rows, false for real worker uploads
}
```

### Data source for seeding
I will provide a file called **`monthly_records_seed.json`** — an array of ~100 objects matching the `MonthlyRecord` schema exactly (10 zones × 10 months each). Write a `seed.js` script that:
1. Connects to MongoDB
2. Clears the `monthlyrecords` collection
3. Reads `monthly_records_seed.json` and inserts every record as-is (all will have `is_synthetic: true`)
4. Logs how many records were inserted, grouped by zone

The 10 zones (use these exact names, nothing else):
`ASHI NAGAR, DHANTOLI, DHARAMPETH, GANDHIBAGH, HANUMAN NAGAR, LAKADGANJ, LaxmiNagar, MANGALWARI, NEHRU NAGAR, SATRANJIPURA`

---

## 3. Backend API Endpoints

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/login` | body `{username, password}` → returns `{token}` on success |
| GET | `/api/zones` | returns list of the 10 zone names + each zone's latest month's `nrw_pct` (for the overview list) |
| GET | `/api/zones/:zoneName/history` | returns that zone's full `MonthlyRecord` history, sorted by month ascending |
| GET | `/api/zones/:zoneName/trend` | computes a simple linear regression (least-squares slope) over the zone's `nrw_pct` values across all available months → returns `{slope, direction: "rising"|"flat"|"improving", predicted_next_month_nrw_pct}`. Use plain JS math, no ML library. "rising" = slope > 0.5, "improving" = slope < -0.5, else "flat". Predicted next month = last value + slope. |
| POST | `/api/zones/:zoneName/monthly-upload` | **protected route (requires valid JWT)**. Body: `{month, mld_supplied, nrw_pct, tanker_count}`. Saves a new `MonthlyRecord` with `is_synthetic: false` and `uploaded_by` = the logged-in worker's username. Validation: if `nrw_pct` differs from the zone's most recent recorded value by more than 20 points, still save it but return a `warning` field in the response flagging it as an unusual jump (do not block the save, just warn). |
| POST | `/api/zones/:zoneName/ai-summary` | **protected route**. Fetches that zone's last 3 months of `MonthlyRecord` data, builds a prompt (see section 5 below), calls the Gemini API, and returns the generated summary text. |

All protected routes should check for a valid JWT in the `Authorization: Bearer <token>` header and return 401 if missing/invalid.

---

## 4. Frontend Screens (React)

### Login Page
Simple username/password form. On success, store JWT in memory/localStorage, redirect to Zone Overview.

### Zone Overview (post-login landing page)
List of all 10 zones as clickable cards, each showing the zone name and its latest month's NRW%. Color-code lightly: red-ish if latest NRW% > 45, yellow if 30-45, green if < 30. Purely visual, not a hard rule.

### Zone Detail Page (on clicking a zone)
- Header: zone name
- A line chart (recharts) of that zone's NRW% across all available months (use `/api/zones/:zoneName/history`)
- A small table showing the last 2-3 months: month, mld_supplied, nrw_pct, tanker_count
- A "Predicted Next Month" card showing the trend direction (rising/flat/improving) and predicted NRW%, from `/api/zones/:zoneName/trend`. Clearly label this as "Estimate based on recent trend, not a guarantee."
- A "Generate AI Summary" button → calls `/api/zones/:zoneName/ai-summary`, shows a loading state, then displays the returned text in a card below
- An "Upload This Month's Data" form: inputs for month, mld_supplied, nrw_pct, tanker_count → submits to the upload endpoint. If the response includes a `warning`, show it clearly before/after saving (e.g. a yellow banner: "This NRW% is unusually different from last month's recorded value — please double check before confirming.")

### Small UI detail (important)
Anywhere synthetic data is displayed, show a small badge/label "Demo data" next to records where `is_synthetic: true`, and no badge for real worker-uploaded rows (`is_synthetic: false`). This distinction should be visible, not hidden.

---

## 5. Gemini AI Summary — Prompt Template

When calling the Gemini API for a zone's AI summary, use a prompt like this (fill in real values from that zone's last 3 months of data):

```
You are writing a short, plain-language summary for an NMC (Nagpur Municipal Corporation) 
water supply worker about zone "{ZONE_NAME}".

Here is the last 3 months of data for this zone:
{list each month: month, mld_supplied, nrw_pct, tanker_count}

Trend direction: {rising/flat/improving}, predicted next month NRW%: {predicted_value}

Write a 3-4 sentence summary that:
1. States what has changed over these months in plain language
2. Notes the trend direction and what it likely means operationally 
   (e.g. rising NRW% + rising tanker count = possible new leak or theft point)
3. Gives ONE concrete, practical recommendation for this zone
4. Do NOT invent numbers not given above. Do NOT claim certainty about causes - use words 
   like "likely" or "may indicate".

Keep it concise, non-technical, and actionable for a municipal worker, not a data scientist.
```

---

## 6. Build Order (do this sequentially, not all at once)
1. Scaffold the project: `/server` (Express) and `/client` (React/Vite), with a root `.env.example` listing `MONGO_URI` and `GEMINI_API_KEY`
2. Build the Mongoose models (`User`, `MonthlyRecord`)
3. Build `seed.js`, run it once I confirm `monthly_records_seed.json` is in place
4. Build auth (login endpoint + JWT middleware)
5. Build the zones/history/trend endpoints
6. Build the upload endpoint with the validation warning logic
7. Build the Gemini AI-summary endpoint
8. Build the React frontend screens in this order: Login → Zone Overview → Zone Detail (chart + table + trend card) → Upload form → AI summary button
9. Wire everything together, run it locally, and tell me the exact commands to start both server and client

---

## 7. What NOT to build (out of scope for this pass)
- No flood/rainfall prediction feature
- No citizen-facing complaint/logging feature
- No water-quality verdict engine (that's a separate feature, different dataset)
- No deployment/hosting setup — local run is fine for now
- No password reset, no multi-role permissions — just the one demo worker account is enough

---

## 8. File I will provide alongside this prompt
- `monthly_records_seed.json` — place this in `/server/data/` and use it exactly as-is in `seed.js`
