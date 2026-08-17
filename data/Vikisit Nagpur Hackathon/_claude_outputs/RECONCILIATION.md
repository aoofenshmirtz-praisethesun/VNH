# Data reconciliation — read before anyone quotes a number

Two independent extraction efforts have run against the same sources: this session's, and the `web_evidence/` work already in the repo. They mostly agree, which is a good sign. **Where they disagree, this file is the ruling.**

If someone puts a different figure on a slide than what's below, that's the bug.

---

## ⚠️ CONFLICT 1 — Sewage treatment capacity. RESOLVED.

| Source | Figure |
|---|---|
| This session, from NEERI ESR 2023-24 | **423.5 MLD** installed across 13 plants |
| Repo `MPCB_STP_status_summary.csv`, MPCB Oct 2025 MPR | **345.3 MLD** present capacity, 174.7 MLD gap, 58.2 MLD under construction |

**They reconcile exactly:**

```
NEERI 423.5  −  20.0 (Narsala, listed "WIP / trial run")  =  403.5
MPCB  345.3 operational  +  58.2 under construction        =  403.5   ✅
```

NEERI counted everything installed including plants not yet in service. MPCB counts operational and under-construction separately.

### ✅ The figures to use

| | |
|---|---|
| **Sewage generated** | **~520 MLD** (345.3 + 174.7, implied by MPCB) |
| **Treatment operational** | **~345 MLD** |
| **Still untreated** | **~175 MLD** |
| **Under construction** | **~58 MLD** |
| **For context** | ~100 MLD capacity in 2011 |

**Do NOT say "423.5 MLD".** It counts plants that aren't running.

**The narrative survives and gets better:** the city genuinely tripled its treatment capacity since 2011 — real credit, and true — *and* roughly 175 MLD still goes untreated. Both halves are now accurate.

⚠️ Also retire the old figure **"345 MLD generated"** from the 2011 basin plan. Current generation is ~520 MLD. Do not confuse it with the ~345 MLD *treated* figure — they're coincidentally similar numbers meaning opposite things, which is exactly how a pitch goes wrong.

---

## ⚠️ CONFLICT 2 — FAO crop salt tolerance. RESOLVED, and theirs was better.

Two different but equally valid FAO-29 presentations:

- **Repo version:** ECw bands at 0 / 10 / 25 / 50 % yield loss — direct FAO values, 13 field crops
- **This session's:** ECe threshold + slope, 32 crops incl. fruit and vegetables — but requires assuming `ECe = 1.5 × ECw`

**The repo version is better where it overlaps**, because it's already in ECw and needs no conversion — which removes the single attack surface I'd flagged on the crop feature. But it has no citrus, and orange is Nagpur's signature crop.

### ✅ Resolution: merged, in `standards/fao29_crop_salt_tolerance.csv`

35 crops. 13 carry **direct FAO ECw bands**; 22 carry the derived threshold. Every row has a `method` column stating which. Prefer the direct bands. State the conversion assumption only for the derived ones.

Sanity check on the merge — cotton no-loss to **ECw 4.5**, soybean **2.5**, paddy **2.2**, orange **~1.13 (derived)**. Cotton tolerating roughly four times what orange does is the contrast the demo rests on, and it holds under both methods.

---

## ⚠️ CAUTION — Year-on-year river trend. Do not claim a trend yet.

Comparing `NMC_2022_23_river_organic_nutrients_indexed.csv` with the 2023-24 data:

| Site | DO 2022-23 | DO 2023-24 |
|---|---|---|
| Nag-1 | 5.01 | 3.67 |
| Nag-2 | 5.45 | 3.63 |
| Nag-3 | **0.41** | **3.88** |
| Nag-4 | **0.78** | **3.81** |

Nag-1 and Nag-2 got worse; Nag-3 and Nag-4 improved by an order of magnitude. **That pattern is too strange to be a real one-year change.**

Most likely: sampling points aren't identical between years, or the samples were taken in different seasons or flow conditions. **Do not put a year-on-year improvement or decline on a slide until someone confirms the 2022-23 site list matches the 2023-24 one.** A professor will ask about seasonality immediately.

The **within-year** DO profile down the river is safe to use and remains the strongest chart we have — it's one sampling campaign, one season, internally consistent.

---

## ✅ New sources the repo work found that this session did not

Genuinely valuable, worth using:

| Source | Why it matters |
|---|---|
| **NMC Monsoon Preparedness Plan 2023** — 66 low-lying flood areas, 22 slum houses affected by stagnation, 85 houses in hollow areas adjacent to rivers/nallas | **An official flood-prone location list.** Far better than r/nagpur for Q2 — this is the city's own document |
| **OCW intervention events** — Jaitala ESR went ~1 h/day → ~4–4.5 h/day after 80 m of pipeline work, ~1500 customers; Wanjri got 3.5 km replaced after contamination episodes | **Real before/after evidence for Q3.** Documented interventions with outcomes — exactly the "was it fixed?" material |
| **MPCB Oct 2025 MPR** | Current STP status, ₹1,926.99 crore Nag River project cost |
| **2026 Nag & Pili research paper** (Springer, July 2026) | Independent corroboration, newer than NEERI |

**Task 3 changes:** start from the NMC Monsoon Preparedness Plan's 66 areas, then supplement with r/nagpur. An official list beats crowdsourced anecdote, and it's citable.

---

## ✅ Where the two efforts independently agree

Both arrived separately at: don't say "safe" · no interpolation · segment-level outfall attribution only (no per-outfall volumes exist) · TDS meters can't detect nitrate/fluoride/coliform · no defensible rainfall-mm→depth threshold · don't bypass OCWGIS authentication.

Two independent analyses converging on the same constraints is meaningful. **These are settled.**

---

## Action

1. Replace the STP figures everywhere with the ✅ block above
2. Use the merged FAO table — nothing else
3. No year-on-year river claims until the site lists are verified
4. Point Task 3 at the Monsoon Preparedness Plan first
5. Add the OCW intervention events to Q3 as real worked examples
