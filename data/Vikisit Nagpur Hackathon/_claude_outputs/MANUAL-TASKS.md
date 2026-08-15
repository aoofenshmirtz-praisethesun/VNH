# Manual tasks — do these on 16 August
### Ordered by value. Task 1 is worth more than everything else combined.

---

## 1. Measure water yourself. ~₹1,200 and one afternoon.

**This is the single highest-value thing your team can do before the hackathon.**

Buy from any local shop or Amazon:

| Item | Approx cost | Measures |
|---|---|---|
| TDS/EC meter (2 units, in case one fails) | ₹300–500 each | **EC** — the primary irrigation suitability parameter |
| pH strips or a cheap pH pen | ₹150–400 | **pH** — CPCB Class E criterion |
| Nitrate test strips (aquarium/water test kit) | ₹300–500 | **Nitrate** — the exact contaminant CGWB flagged in Nagpur |

### Why this matters more than it looks

Two of the four CPCB Class E irrigation criteria are **pH (6.0–8.5)** and **EC (< 2250 µS/cm)**. You can measure both with consumer instruments. And nitrate is the contaminant CGWB found exceeding limits in **35 of 263 shallow groundwater samples** in this district. So with ₹1,200 you can measure the three parameters that carry the most of your argument.

**A team that walked around Nagpur and measured the water will beat a team that didn't. Every time.**

### Sample these 12–15 points

- Tap water from **4–5 different areas** of the city (ideally a mix of 24x7 and intermittent supply zones — ask around, people know)
- **2–3 borewells** — a home, a farm, a peri-urban area
- **The Nag river at 3 points**: near Ambazari (origin), somewhere mid-city, and downstream past Bhandewadi
- **1–2 canal or irrigation sources** if reachable
- **1 tanker** if you can find one

### For each sample record

GPS coordinates · date and time · source type · EC (µS/cm) · pH · nitrate · a photo of the sample and the meter reading · anything you smell or see

### Two rules

**Safety:** don't wade into the Nag — it's carrying untreated sewage. Sample from the bank with a bottle on a string. Gloves if you have them, wash hands after, never taste anything.

**Honesty:** label it exactly as what it is — *"screening-grade field measurements, consumer instruments, uncalibrated, n=14, 16 August 2026."* Never present it as lab data. Stated that way it's completely defensible and the honesty is part of what impresses.

### What it gives you

- Your own primary dataset — nobody else at the hackathon will have one
- A live demonstration of the citizen-science model your app proposes
- A validation check against CGWB and MPCB published values
- Photographs for the deck that aren't stock images

---

## 2. Pull the OCW water quality numbers

Go to **ocwindia.com → Media → Annual Water Quality Report**. It's an on-page table covering FY 2011-12 through May 2026: total samples, unfit samples, percentages. Copy it into a spreadsheet.

**What to notice while you copy it:** the numbers are **city-wide only**. There's no breakdown by zone, reservoir or sampling point. That absence is your problem statement — 99.6% fit across three million people cannot tell any individual whether their water is safe. Have the actual table ready to show; it's much stronger than describing it.

---

## 3. Harvest r/nagpur — your idea, and it's a good one

Search the subreddit for: water supply, dirty water, water smell, borewell, waterlogging, flooding, drainage, tanker, no water.

**Collect 25–40 posts with: date · locality mentioned · what the complaint was · any photo.**

This gives you three things:
- Seed data for the app's report layer
- Evidence for the claim that *citizens already know this and nobody is collecting it*
- Real locality names for your demo instead of invented ones

Sort by "top" of the past year and the monsoon months will surface on their own.

---

## 4. Check what OSM actually contains

Run the four tag-specific queries (drain / stream / river / canal) and write down the counts. Export the result as GeoJSON from Overpass Turbo — Export → GeoJSON — and keep the file. Five minutes.

---

## 5. Ask your civil engineering contact exactly three questions

You said keep it minimal, so make it count:

1. *"For screening drain capacity in an Indian city, is Rational Method plus Manning acceptable as a first-pass triage, and what would you object to?"*
2. *"Where does Nagpur's tap water actually come from for different parts of the city — is there a zone-to-reservoir map anywhere?"*
3. *"Is there any public record of NMC's pre-monsoon desilting list?"*

Question 2 is the one you most need answered and least likely to find online.

---

## 6. Download and keep locally

- CGWB Nagpur District aquifer report — `cgwb.gov.in/sites/default/files/2022-11/6_nagpur_district.pdf`
- MPCB Modified Nag River Basin Action Plan
- NDMA Urban Flooding Guidelines 2010
- Any NMC ward/zone boundary map you can find

Have them on disk, not in a browser tab. Venue wifi is not your friend.

---

## 7. Photograph 4–6 real locations

The spots you already know clog. Wide shot, plus anything visible — a choked drain mouth, silt level, an outfall, standing water.

Real photographs of real places in Nagpur, taken by you, do more for a local jury than any diagram.
