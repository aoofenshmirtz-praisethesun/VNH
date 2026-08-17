# `feature/neernetra-water-monitoring` — read this before it goes in front of a judge

You asked whether the legacy site needs updating with the new data. It doesn't, and the reason is
worth knowing before the pitch rather than during the Q&A.

---

## It is not a legacy version of this project. It is a different project.

| | experience site | this branch |
|---|---|---|
| subject | water **quality** at 405 real locations | **non-revenue water %** for 10 admin zones |
| data | CGWB · CSIR-NEERI · MPCB, published | 100 records, **every one `is_synthetic: true`** |
| provenance | `source_agency` + `sample_period` on every point | neither field exists |
| verdict | EXCEEDS / NO_EXCEEDANCE / NOT_TESTED | "High Loss" / "Moderate" / **"Optimal (<30%)"** in **green** |

`git grep` across the whole branch for `pH|TDS|nitrate|fluoride|arsenic|coliform|turbidity|IS 10500|CGWB|MPCB`
returns **zero hits**. There is no water-quality data in it to update. The three canonical files
have nothing to attach to: no join key exists between ten zone names and 405 point IDs, and
`MonthlyRecord` has no field any canonical field maps onto.

Feeding it the new data means rewriting the model, the seed, both seed paths, the routes, the API
client and both pages. That is the whole backend and both screens. **Not before the deadline, and
not worth it — the experience site already is the data-first product.**

---

## The actual risk

The jury includes municipal officials and VNIT faculty. If one of them opens this branch:

1. **`server/data/monthly_records_seed.json` — all 100 rows carry `is_synthetic: true`.** The UI
   labels them "Demo data", which is honest, but the dashboard around them presents forecasts and
   recommendations as if they were operational.
2. **Green `#10b981` badges reading "Optimal (<30%)"** on a water dashboard. Your entire project
   rests on the discipline of never issuing an all-clear about water. A judge does not read the
   axis label before they read the green badge.
3. **A least-squares extrapolation** (`calculateTrend`, `server/routes/zones.js:22-71`) fitted to
   ten synthetic monthly points, rendered as a forecast with a 45% reference line.
4. **Gemini `gemini-1.5-flash` output rendered verbatim** to users, from two endpoints, prompted to
   be *"authoritative, highly actionable, and urgent"*, with no output filter. Nothing prevents the
   model from emitting "safe" or "potable" on a screen in your own demo. Fallback strings already
   include *"NRW levels projected within acceptable municipal range"* and *"Maintain current
   regular pressure monitoring"* — operational advice derived from invented numbers.
5. `nmcworker1 / password123` and a hardcoded JWT secret committed in five places, with the
   credentials **rendered on the login screen**. Not a data-privacy breach — there are no personal
   names anywhere, which I did check — but it is the first thing a security-minded judge notices.

The failure mode isn't that this branch scores badly. It's that fabricated numbers presented with
confidence next to your real work make a judge wonder which parts of the real work are also
fabricated. You spent this whole project earning the right to say *"every number is published and
sourced."* Don't hand back that advantage for a second screen.

---

## Two options. Pick one now, not at 3 a.m.

### A — Don't present it *(recommended, 0 min)*

The experience site is the product. One polished thing beats two, and the second one is on a
branch nobody has to merge.

### B — Make it defensible *(≈40 min, if someone is free and wants the second screen)*

In this order; stop when the time runs out — each step is independently worth doing.

1. **Kill green.** Delete `--status-good: #10b981` (`client/src/index.css:24`), `.status-good`
   (:426), `.card-risk-good` (:262), the inline ternary at `ZoneDetailPage.jsx:385`, `#10b981` at
   `NagpurZoneMap.jsx:103` and the legend at :179, and the `#ecfdf5` success banner at
   `ZoneDetailPage.jsx:464`. Replace with the project palette — `#b23a26` for high loss,
   `#6b655c` for everything else.
2. **Delete the word "Optimal."** `OverviewPage.jsx:87`, `NagpurZoneMap.jsx:104` and :179. Use the
   band, not a judgement: `"below 30%"`. Also remove *"NRW levels projected within acceptable
   municipal range"* (`ZoneDetailPage.jsx:285`).
3. **Disable both Gemini endpoints.** `server/routes/zones.js:178-380`. An unfiltered LLM writing
   operational recommendations onto a screen with your name on it is the single largest
   uncontrolled risk in the repo. Remove the buttons in `OverviewPage.jsx` and `ZoneDetailPage.jsx`.
4. **Remove the forecast.** `calculateTrend` and the projection card. Ten synthetic points do not
   support extrapolation, and a VNIT examiner will ask what the residual variance is.
5. **Label the whole thing.** A persistent bar on every page, not a per-row badge:
   *"Illustrative dataset. Every figure on this screen is synthetic and models the NRW reporting
   workflow, not measured conditions in Nagpur."*
6. Move the demo credentials out of the login screen and into the README.

Then it stops being a liability and becomes a fair claim: **a working municipal reporting
workflow, demonstrated on synthetic data, ready to receive real NMC returns.** That is a
legitimate and even attractive thing to show — it's the operations half of the story, and it is
honest, because you said so out loud before anyone asked.

---

## If a judge asks about it anyway

> That's the utility-operations module — the workflow an NMC zone officer would use to file
> monthly returns. Every figure on it is synthetic and labelled, because NMC's operational returns
> aren't public data. The quality side, which is the part we're pitching, uses only published
> measurements from CGWB, NEERI and MPCB, and every point on it carries its agency and its
> sampling period.

Volunteering the limitation is what makes the rest credible.
