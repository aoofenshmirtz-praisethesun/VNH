# SCOPE LOCK — v2
### Supersedes v1 and the feature lists in the earlier documents.

**What changed from v1:** v1 had drifted into a municipal capital-planning tool and lost the ordinary person, which was the point of the original idea. The engineering is unchanged — it has moved underneath, where it belongs, as the reason the answers can be trusted rather than as the pitch itself.

---

## The product, in the user's words

> **Three questions nobody in Nagpur can currently get an answer to:**
>
> **1. Is this water safe to use — and for what?**
> **2. Will my area flood?**
> **3. Is anyone actually fixing it?**

One model answers all three, because they're the same knowledge asked from three directions.

**The seasonal frame it restores:** *prior* to the monsoon → is it being fixed. *During* → will I flood. *After* → is the water safe, through irrigation season.

---

## Why this is not an app that already exists

| | Google / existing apps | Municipal dashboards | This |
|---|---|---|---|
| Warns you it's flooding | ✅ (after it starts) | ❌ | ✅ (before) |
| Tells you **why** | ❌ | ✅ | ✅ |
| Tells you **if it's being fixed** | ❌ | ❌ | ✅ |
| Tells you if the water is usable | ❌ | ❌ | ✅ |

**The loop back to the affected person is the moat.** Everyone stops at the warning. Nobody says *"your street floods because Drain 47 is at 39% deficit, it's #12 in this year's desilting queue, work is scheduled for 3 June."*

---

## What you build, grouped by the question it answers

### Q1 · Is this water safe to use?

| # | Feature | Notes |
|---|---|---|
| 1 | **Usability verdict** — drinking / bathing / irrigation / industrial, per CPCB Class A–E and IS 10500 | Statutory basis, not an invented score |
| 2 | **Crop verdict** — FAO-29 salt tolerance → yield-loss estimate and what to grow instead | Your most distinctive output. Serves the farmer directly |
| 3 | **Outfall map + source attribution** on monitored reaches | Real MPCB data: 9 nalla outfalls into the Nag, 3 into the Pili. Unmonitored reaches stay **grey** |

### Q2 · Will my area flood?

| # | Feature | Notes |
|---|---|---|
| 4 | **The drainage network**, generated from open terrain and map data | The unlock — no city has this digitised |
| 5 | **Risk ranking** — rainfall forecast routed through the network, capacity screening with robustness ranking | IMD predicts the rain; you predict what it does |
| 6 | **Alert to the person in that area**, in Marathi | Your original "at least warnings" |

### Q3 · Is anyone fixing it?

| # | Feature | Notes |
|---|---|---|
| 7 | **Your drain's status** — complaint linked to the asset that caused it, its place in the queue, scheduled date | Nobody does this. It is the moat |
| 8 | **The fix decision** — desilting priority with silt return rate, sediment source, disposal constraint; cost against damage avoided | Chitale-committee-backed nuance. This is what makes Q3 answerable at all |
| 9 | **The "why this road is dug up" card**, auto-generated | Free — the justification already exists inside the work order |

**One interface across all three:** *Ask the Twin*, restricted to fixed question templates so it cannot invent a number.

---

## The engineering — credibility, not headline

These are how you survive the technical panel. They are **not** what you lead with.

- Physics, not ML — Rational Method per sub-catchment, Manning capacity, aggregated with lag
- **Sensitivity analysis** — report which drains stay top-ranked across the uncertain parameter range
- **Hindcast validation** against 24 Sep 2023, blind, with false positives reported
- Field-measured cross-sections from 16 August
- Explicit non-claims: no hydraulic simulation, no flood depths, no lab-grade quality at unmonitored points

Full detail in `engineering-claims-and-honest-limits.md`.

---

## Cut

| Cut | Reason |
|---|---|
| ML prediction | No labelled data; training on simulated data is circular |
| Disease risk forecast | Not calibrated to Nagpur |
| Recharge siting | Soil maps ~1:250,000 — can't site anything |
| Safe-route navigation | Google does it better; invites the comparison |
| Vulnerability overlay *as a feature* | It's a **weight** in the ranking, not a screen |
| Multi-utility "dig once" platform | Different domain, unobtainable data. Keep only the one-line conflict flag |
| Pench ledger *as software* | **Keep as an argument on the impact slide** — it's a fact, it doesn't need code |
| Live second-city generation | Pre-generate one, show a screenshot |
| IVR / WhatsApp / multi-channel | One alert channel proves the mechanism |

Good ideas that cost more attention than they return in three minutes. They belong on a roadmap slide — which doubles as your prepared answer when a judge asks "what about X."

---

## The 3-minute demo

| Time | Beat |
|---|---|
| 0:00–0:25 | The three questions. State them as questions a resident asks. |
| 0:25–0:45 | *"To answer any of them you need a map of the city's drainage that doesn't exist. NDMA mandated it in 2010; it stalled on survey cost. We generate it from free data."* |
| 0:45–1:20 | **Q2 live** — tonight's forecast → this junction is at risk → the alert |
| 1:20–1:50 | **Q3 live** — why: Drain 47, 39% deficit. Where it sits in the queue. Change one thing, re-run, cost against damage avoided |
| 1:50–2:15 | **Q1 live** — the farmer downstream: usable for irrigation? which crop? which outfall caused it? |
| 2:15–2:40 | **Validation** — 2023 hindcast, blind. Numbers including false positives |
| 2:40–3:00 | Deployment: layer inside the existing ICCC, budgets that already exist |

---

## The sentences that hold it together

> **"Is this water safe? Will my street flood? Is anyone fixing it? Nobody in this city can answer those three questions today."**

> **"We're not predicting the weather — IMD does that, free. We're predicting what the forecast rain does to a drainage network nobody has ever digitised."**

> **"Everyone stops at the warning. We're the first to tell the person why it happens and whether anyone is fixing it."**
