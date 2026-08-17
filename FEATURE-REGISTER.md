# Feature Register & Status
### Checked against the repo at 12:00, 17 August

⏱ **22 hours of coding left. Freeze 04:00. Pitch 12:00 tomorrow.**

---

## 🔴 Two things to fix in the next ten minutes

**1. The root `AI-BUILD-CONTEXT.md` in the repo is the STALE version.**
It still says 423.5 MLD. The corrected copy is sitting in `data/.../\_claude_outputs/AI-BUILD-CONTEXT_1.md`. **Every AI session reads the root file** — so right now every teammate's assistant is being handed a retired number.

→ Replace root `AI-BUILD-CONTEXT.md` with the patched version, and copy `RECONCILIATION.md` to the repo root.

**2. There is no application code yet.**
Only my three data scripts are in the repo. Last commit 11:39. **Two hours in, nothing rendering.** Not fatal, but the map has to exist before anything else is discussed.

---

## The complete feature list

### TIER 1 — the project. Nothing else matters until these work.

| # | Feature | What the user does | Data | Status |
|---|---|---|---|---|
| **F1** | **Measurement map** | Sees every real water measurement in Nagpur; grey everywhere else | ✅ 395 points ready | ⬜ not started |
| **F2** | **Point detail** | Clicks a point → verdict, values, source, date | ✅ engine ready | ⬜ not started |
| **F3** | **Nearest measurement + distance** | Gives a location → nearest reading **and how far away it is** | ✅ ready | ⬜ not started |
| **F4** | **Crop / irrigation verdict** | Picks crop + location → CPCB pass/fail + yield-loss bars | ✅ merged FAO table | ⬜ not started |
| **F5** | **Add a reading** | Submits own EC/TDS → appears on map, grey resolves | ✅ no data needed | ⬜ not started |

**F1–F5 is a complete, defensible, winnable project.** If you ship only these, you have a real submission.

### TIER 2 — build only after all of Tier 1 works

| # | Feature | Data | Status |
|---|---|---|---|
| **F6** | **River DO profile chart** — dissolved oxygen down the Nag, CPCB Class D line marked, 21 of 23 sites below it | ✅ ready | ⬜ |
| **F7** | **Outfalls upstream of a point** — segment-level only, never per-outfall % | ⬜ needs `outfalls.csv` (Task 2) | ⬜ |
| **F8** | **Where your water comes from** — locality → zone → reservoir → supply hours | ⬜ needs ESR pass (Task 1) | ⬜ |
| **F9** | **Flood layer** — 66 official low-lying areas (observed) + reports | 🟡 66 areas indexed, need coords | ⬜ |

### TIER 3 — only if you are somehow ahead

| # | Feature | Note |
|---|---|---|
| **F10** | Terrain flood risk model | Ordinal only. Run the 20-min terrain check first. **Skip unless Tier 1+2 are done** |
| **F11** | Report an issue + 30-day "was it fixed?" | Most original idea, but undemonstrable live — consider making it one spoken sentence instead |
| **F12** | Ask-the-Twin natural language box | Only with fixed query templates |

---

## Honest read on where you are

**Good:** the data problem is fully solved. 395 verified points, standards encoded, a tested verdict engine, and reconciled figures. Most teams at hour 2 are still arguing about what to build. You have a spec, a dataset and an engine.

**Concerning:** nothing renders. At hour 2 of 24, with 5 people, the map should be appearing. **The single biggest risk now is that the data work continues while nobody ships a screen.**

**The call:** stop all data collection that isn't blocking Tier 1. Tasks 1, 2 and 3 (ESR supply hours, outfall geocoding, flood locations) feed **F7, F8, F9 — all Tier 2.** They are not blockers. One person can continue them in the background; everyone else builds.

---

## Suggested split for the next 6 hours

| Who | What | Done by |
|---|---|---|
| **1 + 2** | F1 map rendering all 395 points, then F2 click→panel | 16:00 |
| **3** | FastAPI wrapping `verdict_engine.py`; endpoints for nearest-point and crop verdict | 15:00 |
| **4** | F4 crop screen + yield-loss bar chart | 17:00 |
| **5** | Fix the repo context file; finish Task 2 (outfalls, 1 hr); then deck and demo script | ongoing |

**By 18:00 you want F1–F4 working end to end.** F5 by 22:00. Everything after that is Tier 2 and polish.

---

## What "done" looks like at 04:00

- Map loads offline with cached tiles, 395 points, mostly grey
- Any point click returns a real verdict from the engine
- A location returns nearest measurement **with distance**
- Belgaon preset shows orange ~91% vs cotton 0%
- Submitting a reading resolves a grey area
- The five demo clicks run in under 90 seconds without a network call

Anything beyond that is a bonus. Anything less than that and the pitch has a hole in it.
