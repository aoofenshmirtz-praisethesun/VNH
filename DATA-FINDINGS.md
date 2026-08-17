# Data findings — what the repo was already carrying and wasn't using

The NEERI tables committed in `data/Vikisit Nagpur Hackathon/` had **24 parameters per city well**.
`points.json` was carrying **two** of them. That gap is now closed, and closing it produced the
strongest evidence in the project.

| | before | after |
|---|---:|---:|
| points | 395 | **405** |
| city-well parameters | 2 (coliform only) | **16 physico-chemical + up to 10 metals** |
| lakes with measurements | 0 | **10** |
| water-body polygons | 0 | **243** (20 named) |

Files rebuilt: `points.json`, `standards.json`, `waterbodies.json` — drop them into both
`experience/public/data/` and `web/data/`.

---

## 1 · Lead in four of the twelve wells inside the city

The twelve NGW wells are the **only measurements physically inside Nagpur** — the 347 CGWB points
sit at a median 35 km from the centre, with six inside 5 km. So these twelve carry the entire
in-city evidence base, and until now the app showed two numbers for each.

| Well | Locality | Pb mg/L | IS 10500 limit |
|---|---|---:|---:|
| NGW-1 | Shivangaon, Nagpur–Wardha highway | 0.014 | 0.010 |
| NGW-6 | CSIR-NEERI campus | 0.011 | 0.010 |
| NGW-7 | Narmada Colony | 0.014 | 0.010 |
| NGW-12 | Kadimbagh | 0.016 | 0.010 |

**Say it exactly like this, and never more strongly:**

> Four of the twelve wells NEERI sampled inside Nagpur exceed the IS 10500 limit for lead. The
> values are 0.011 to 0.016 mg/L against a limit of 0.010. The same report states a detection
> limit of 0.009 mg/L for lead, so these exceedances sit between 1.2 and 1.8 times the method's
> own sensitivity. They are real as published, and the margin is narrow. Lead is not removed by
> boiling.

That last clause matters and `verdict.js` doesn't know it yet. Add to `ACTION`:

```js
'Lead (as Pb)': {
  means: 'Lead accumulates; the risk is to children and to pregnancy.',
  doThis: 'Boiling does NOT remove lead — it concentrates it. Removal needs reverse osmosis or a certified lead filter.',
  boil: false },
'Arsenic (as As)': {
  means: 'Long-term exposure is carcinogenic.',
  doThis: 'Boiling does not remove arsenic.', boil: false },
```

The narrow margin is a strength, not a weakness, if you volunteer it before a judge asks. A team
that says "1.4× the limit but only 1.6× the detection limit, so we report it and flag the
uncertainty" is doing measurement science. A team that says "LEAD CONTAMINATION FOUND" is not.

**Every one of the twelve** also has detectable total coliform (46–164 CFU/100 mL) against a
standard of *shall not be detectable in any 100 mL sample*. NGW-9 (Bharatwada) additionally
exceeds on total hardness, 620 against 600 mg/L. Six of twelve are at or above 1.0 mg/L fluoride;
none exceeds the 1.5 limit — the highest is 1.4 at Reshimbagh.

### ⚠ One verification blocks a headline

`gw_physchem.csv` labels its column simply **"Nitrate"** and does not state the basis. The lake
table in the same report says **"Nitrate as N"** explicitly.

- If the well figures are **as NO₃**: range 2.4–37.4, limit 45 → **no exceedance.**
- If they are **as N**: ×4.4268 → 10.6–165.6, limit 45 → **six of twelve exceed, two by 3×.**

That single word flips the most consequential result in the dataset. Every affected point carries
`meta.no3_basis = "UNSTATED IN SOURCE — assumed as NO3"` and the conservative reading is in force.
**Someone should open `ESR_Final_Report_2023-2024.pdf`, find the groundwater physico-chemical
table, and read the column header.** Ten minutes. Do it before the pitch — if it says "as N", it
is the single biggest finding you have, and nitrate is the one parameter where boiling actively
makes things worse.

Also flag: the metals rows for NGW-1 and NGW-2 were OCR-scrambled in the committed CSV and were
transcribed by hand (`meta.metals_qa` records this). NGW-1's Pb value of 0.014 comes from a
repaired row. Verify those two rows against the PDF at the same time.

---

## 2 · All ten lakes fail the bathing standard

Ten lakes now carry pH, EC, TDS, alkalinity, hardness, Ca, Mg, Na, K, F, Cl, SO₄, nitrate, **DO,
COD, TKN, phosphate**, and both coliform counts. Eight were matched to their OSM polygon by
nearest-centroid and inherit the real name.

**Assessed against CPCB Designated Best Use Class B (outdoor bathing), never against IS 10500.**
A lake is not a drinking source; applying a drinking standard to one is the sort of error that
loses a technical round.

| Lake | DO mg/L | Faecal coliform | vs Class B |
|---|---:|---:|---|
| Gandhi Sagar | 7.03 | 40,000 | 16× the limit |
| Gorewada | 7.13 | 10,000 | 4× |
| Sonegaon | 6.90 | 20,000 | 8× |
| Sakkardara | 6.31 | 20,000 | 8× |
| Pandrapodi | 6.53 | 10,000 | 4× |
| Futala | 5.39 | 20,000 | 8× |
| **Ambazari** | **4.90** | 20,000 | DO below 5.0, 8×, pH 8.82 out of range |
| Lendi Talav *(code NK)* | 4.87 | 100,000 | DO below 5.0, **40×** |
| Lake BK *(unmatched)* | **1.28** | 60,000 | DO 1.28, 24×, pH 8.69 out of range |

Class B is DO ≥ 5.0 mg/L, faecal coliform ≤ 2500 CFU/100 mL, pH 6.5–8.5. **Every lake fails, by
4× to 40× on faecal coliform.** Three fail on dissolved oxygen as well. Lake BK at 1.28 mg/L is
approaching anoxic.

Two caveats to carry: `BK` matched at 1.5 km and `PLT` at 3.7 km, both beyond the 1.2 km
acceptance threshold, so they keep their sample codes rather than a guessed name. `NK` matched
*Lendi Talav* at 0.38 km — plausible, but "NK" reads like Naik Talao, and the two are close
together in north Nagpur. **Have someone with local knowledge confirm NK before it goes on
screen.** `meta.osm_name_match` and `meta.match_dist_km` are on every lake so the provenance of
the name is auditable.

---

## 3 · The chain that makes the argument

Everything above is now one continuous, fully-sourced story along a single watercourse:

```
Ambazari Lake            DO 4.90    the Nag rises here
   ↓
Nag-1, Ambazari outlet   DO 3.67    already below the bathing standard at the source
   ↓                     3.63 · 3.88 · 3.81
Nag-5, mid-city          DO 1.90    a 50% collapse in four sampling points
   ↓                     1.20 · 1.02 · 1.10 · 1.20
Nag-10, downstream       DO 0.48    effectively anoxic
```

One river, ten sampling points, one agency, one sampling period, no modelling, no interpolation.
This is the spine of the pitch and every number in it is published.

Two lines worth having ready:

> The Nag does not become polluted somewhere in the city. It leaves its source lake already
> failing the bathing standard, and loses 87% of its remaining oxygen over ten sampling points.

> Nagpur's water *is* tested — by CGWB, by NEERI and by MPCB. It is published as a percentage, a
> 295-page PDF and 37 separate map files. Not one resident can find out about the water where
> they actually live. We didn't collect this data. We connected it to the person it affects.

---

## 4 · What is still missing, stated plainly

| | |
|---|---|
| Deep-vs-shallow nitrate difference | z ≈ 1.55, p ≈ 0.12, confidence intervals overlap. **A question worth asking, not a conclusion.** Do not present it as a finding. |
| Per-outfall BOD attribution | No per-outfall volumes are published anywhere. Attribution is segment-level only. Do not claim otherwise. |
| Sewage balance | ~520 MLD generated, ~345 treated, ~175 untreated. The "265 MLD" figure in older documents is from 2011 — do not use it. |
| ESR supply hours | 37 map files, needs a vision pass. Not blocking. |
| Sewage outfalls | 12, need geocoding. Not blocking. |
| Flood-prone areas | 66 in the NMC Monsoon Preparedness Plan, not extracted. Not blocking. |

Nothing here is a hard blocker. Every one is time or a manual step.
