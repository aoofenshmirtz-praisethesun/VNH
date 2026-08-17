# SCOPE LOCK — v3
### Q1 is the project. Q2 and Q3 are built around it.

---

## The problem, in one paragraph

Nagpur's water **is** tested. OCW publishes sample fitness up to May 2026. CGWB samples groundwater across the district. MPCB monitors the rivers. But OCW publishes **one number for three million people**, CGWB's results sit in a PDF as scattered village points, and MPCB's stations are sparse and years old. None of it is joined to *the water that actually reaches you*.

> **"Is my water safe?" is unanswerable in Nagpur — not because nobody measures, but because nobody measures where you are.**

This framing matters: it doesn't accuse anyone of negligence, which is the right posture in front of a municipal jury. The gap is **granularity and connection**, not effort. And the fix is a reporting and joining problem — cheap, and genuinely deployable.

---

## Scope: the basin, not just the Nag

A person in Nagpur gets water from one of four places. The product covers all four.

| Source | Who depends on it | Data that exists |
|---|---|---|
| **NMC / OCW tap** | ~3M people, 68 reservoirs, 2000+ km pipeline | OCW fitness data — **city-wide only** |
| **Groundwater** (borewell, open well) | Peri-urban and rural households, farms | CGWB district report — **real, village-level points** |
| **River / nala** (Nag, Pili, Pohra) | Downstream irrigation; 31 villages Pardi→Agargaon | MPCB station data — **sparse, dated** |
| **Canal / Pench** | Command-area irrigation | Allocation figures published |

---

## Q1 — Is this water safe, and what for? *(the core)*

| # | Feature | Built from |
|---|---|---|
| 1 | **Where does your water come from?** Enter a location → source, treatment plant, reservoir, supply type (24x7 or intermittent) | OCW/NMC network info + zone mapping |
| 2 | **Usability verdict** — drinking / bathing / irrigation / industrial, against **IS 10500** and **CPCB Class A–E** | Standards tables + measured values |
| 3 | **Crop verdict** — EC and pH → FAO-29 salt tolerance → yield-loss estimate and what to grow or how to blend | FAO tables |
| 4 | **The map of what's actually known** — every real sampling point, with **unmeasured areas left grey** | CGWB + MPCB + OCW + your own field samples |
| 5 | **Why it's unsafe here** — outfalls and sewage load upstream of the point you asked about | MPCB: 9 nalla outfalls to the Nag, 3 to the Pili |
| 6 | **Citizen sample entry** — anyone with a ₹300 TDS meter adds a point | Your own field survey is the seed |

**Feature 4 is the sharpest thing in the project.** The grey isn't missing work — the grey *is the finding*. A map of how little of this city's water is actually measured makes the argument better than any slide.

**Feature 6 is what makes it scale.** Municipal monitoring will never be dense enough. Fifty thousand residents with ₹300 meters would be.

---

## Q2 — Which areas suffer, and how badly, for a given amount of rain?

Your reframe, and it's more honest than a binary forecast.

| # | Feature |
|---|---|
| 7 | **Rainfall-response profile per location** — "this junction starts holding water above ~40 mm in 2 hours" — built from reported history plus terrain |
| 8 | **Advance warning for *your* route** — the night before, not once you're standing in it |

> **The two-wheeler argument:** Maps can route you around water — but only after it's already there and traffic has stopped. Nobody tells you the night before that your usual route is the one that goes under.

---

## Q3 — Is anyone fixing it?

Crowdsourced, because NMC work data isn't public. Your design, and it's the right one.

| # | Feature |
|---|---|
| 9 | **Report status** — is work happening here? Public adds it |
| 10 | **The 30-day follow-up: "was it actually fixed?"** |
| 11 | **Raise a query** — routed to the right ward, with the water context attached |

**Feature 10 is the one nobody has.** Complaint systems record that you complained. Almost none record whether the fix worked. That single question turns an app into an accountability record.

---

## Cut

ML prediction · disease forecast · recharge siting · safe-route navigation · multi-utility coordination · IVR/WhatsApp/multi-channel · live second-city generation · Pench ledger as software *(keep it as an argument on the impact slide)*

---

## Credibility layer — not the pitch

- Standards, not invented scores: **IS 10500 · CPCB Class A–E · FAO-29**
- **Your own field measurements**, labelled as screening-grade, uncalibrated, n≈14
- Grey for unmeasured — never interpolate a measurement you don't have
- Explicit non-claims: no lab-grade values, no flood depths, no calibrated health forecast

---

## Data status

| Source | Status |
|---|---|
| CGWB Nagpur district groundwater | ✅ Real, village-level, verified |
| OCW fitness data to May 2026 | ✅ Real, city-wide only — **the gap is the point** |
| MPCB Nag basin: outfalls, BOD by station | ✅ Real, dated 2009–11 |
| OSM waterways, ~448 ways | ✅ Confirmed — natural network good, street drains unknown |
| Your field samples | ⬜ 16 August |
| r/nagpur reports | ⬜ 16 August |
| Zone → reservoir mapping | ❓ **Biggest open gap** — ask the civil contact |
| NMC desilting list | ❓ Probably not public |

---

## The three sentences

> **"Nagpur tests its water and publishes one number for three million people."**

> **"The same question — is this water safe, and what for — asked by a farmer and by a household, about the same basin. Same data, different standard at the end."**

> **"The grey areas on our map aren't missing work. They're the finding."**
