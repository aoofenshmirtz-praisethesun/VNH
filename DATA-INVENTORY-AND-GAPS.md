# Data Inventory & Remaining Gaps
### After processing the ESR, CGWB and basin action plan

---

## ⚠️ First: two claims from earlier documents are now dead

The new data overturns them. Both would have been caught on stage.

### 1. "265 MLD flows untreated into the rivers" — **wrong, and badly out of date**

That was a 2011 figure. The NEERI Environmental Status Report 2023-24 lists **13 STPs, all operational, totalling 423.5 MLD of installed capacity**, each with coordinates:

Bhandewadi 130 + Bhandewadi 200 + Somalwada-1 20 + Somalwada-2 20 + Narsala 20 + Itabhatti 10 + Mokshdham 5 + Mankapur 5 + Dabha 5 + Hazaripahad 4 + Ambazari 3.2 + Kachimet 1 + Sonegaon 0.3

**Nagpur went from 100 MLD of treatment capacity in 2011 to 423.5 MLD in 2024.** Saying "265 MLD untreated" in front of a municipal jury would have been both wrong and insulting.

### 2. "The river doesn't arrive polluted — the city does that to it" — **not supported by the current data**

The 2023-24 coliform figures don't show that gradient. **Nag-1, the initial sampling point at Ambazari, is the *most* contaminated at 600,000 CFU/100mL total coliform.**

---

## ✅ But the real story is better, and it's in the new data

**Dissolved oxygen along the Nag, in order downstream:**

`3.67 → 3.63 → 3.88 → 3.81 → 1.90 → 1.20 → 1.02 → 1.10 → 1.20 → 0.48`

A textbook oxygen sag. And the collapse point is named in NEERI's own site description: **Nag-5 is "drain mix behind Yashwant Stadium."** The oxygen dies exactly where the drains join. Same pattern on the Pili (4.20 → 0.74) and the Pora (4.80 → 0.63).

**21 of 23 river sites fail CPCB Class D** (DO ≥ 4 mg/L — the minimum for fish and wildlife). By its end point the Nag is at 0.48 mg/L: biologically dead water.

> ### The narrative this supports — and it's far stronger than the old one
> **Nagpur more than quadrupled its sewage treatment capacity between 2011 and 2024. The rivers are still dead. Because the problem was never treatment capacity — it's that sewage enters the rivers before it ever reaches a plant. You can't treat water you never collected.**
>
> This gives the city full credit for what it built, and locates the actual failure precisely. That is a far better thing to say to a municipal jury than an accusation — and the DO curve proves it in one chart.

### And the single most striking finding in all of this

**All 12 city groundwater sources NEERI sampled show coliform contamination** — total coliform 46–164 CFU/100mL, thermotolerant faecal 10–80. IS 10500 requires **zero**.

> **Twelve out of twelve wells sampled inside Nagpur city fail the drinking water standard for faecal contamination.**

That's current, primary, government-commissioned, and it's the sharpest single sentence available to you.

---

## What you now have

| Dataset | Contents | Status |
|---|---|---|
| **CGWB district groundwater** | **347 samples** (263 shallow, 84 deep), coordinates, pH/EC/TDS/TH/Ca/Mg/Na/K/HCO₃/Cl/SO₄/NO₃/F/**SAR**/**RSC** | ✅ Extracted, verified against report statistics exactly |
| **NEERI rivers 2023-24** | **23 sites** (10 Nag, 8 Pili, 5 Pora), coordinates, full chemistry + **coliforms** + DO/COD/TKN/phosphate | ✅ Extracted |
| **NEERI city groundwater** | **12 wells**, coordinates, chemistry + **metals** + **coliforms** | ✅ Extracted |
| **NEERI lakes** | **10 lakes**, chemistry + nutrients + **coliforms** + plankton | ✅ Extracted |
| **STPs** | **13 plants**, coordinates, capacity, utilisation, technology, year | ✅ Extracted |
| **Non-revenue water** | Month-wise supply FY23-24: **257.6 MCM supplied vs 410 MLD billed** | ✅ Extracted |
| **Outfalls** | 9 Nag + 3 Pili, named locations | ✅ Named, need geocoding |
| **OSM waterways** | 89 drains, 135 streams, 54 rivers, 24 canals | ✅ Exported |
| **ESR command-area maps** | Per-reservoir maps with supply zones and **supply hours** | 🟡 Maps, not tables — see gaps |

**Delivered files:** `nagpur_groundwater_cgwb.csv` (347 rows, with IS 10500 and CPCB irrigation flags pre-computed) · `nagpur_neeri_2023-24.geojson` (48 mapped features) · `nagpur_neeri_tables.zip` (15 raw tables)

---

## What you're still missing — collect broadly, decide later

### Tier 1 — would materially improve the product

**1. ESR command-area boundaries as polygons.** You have the maps as PDFs. They show reservoir boundaries, supply zone numbers (SZ-8, SZ-9…) and **supply hours** — which is exactly the "24x7 vs intermittent" variable that the peer-reviewed Nagpur research links to contamination. But they're page images, not data. **Someone traces the boundaries by hand in geojson.io** — roughly 2 hours for the main ones. This unlocks F1 properly instead of the zone fallback.

**2. Download the rest of the ESR supply maps.** Your scraper targets the right page. There are more than the 8 you've pulled — get all of them, and note the supply-hours legend on each.

**3. Tap water quality with any spatial resolution.** Still the central gap, and still the thing your problem statement is *about*. OCW publishes only a city-wide fitness percentage. Worth one email on the 16th — and worth saying on stage that you asked.

**4. NMC ward and zone boundaries as GeoJSON.** Needed for the fallback in F1 and for any per-area aggregation. Check the Nagpur district site and any open-data portal.

### Tier 2 — strengthens specific features

**5. Historical NEERI reports (ESR 2022-23, 2021-22).** Same tables, earlier years → **trend**. One year is a snapshot; three years is a story about whether things are improving. This is the highest-value item in Tier 2 by a distance, and it's the same source you already know how to parse.

**6. Lake sampling locations with coordinates** — you have the lake chemistry, but the location table needs pulling out properly (Table 6.4).

**7. STP status from the MPCB NRCD page** you found. Cross-checks the STP list and may add under-construction plants.

**8. Nagpur district disaster management page** — flood-prone area lists, control room data, historical incident records. This is the honest source for Q2 seed data.

**9. Rainfall.** Open-Meteo for forecast, IMD for historical daily. Needed for any Q2 rainfall-response work.

**10. The two academic papers** — groundwater near the Nag river, and the 2026 surface water assessment. Both likely contain sampling tables that add points and, more usefully, independent corroboration of NEERI's findings.

### Tier 3 — nice to have, don't chase

**11. r/nagpur harvest** for flood and water complaint locations.
**12. Street View historical imagery** for before/after on works.
**13. Sentinel-1 flood extent** for Sept 2023.
**14. DEM** — only needed if Q2 goes ahead.

### Data you will not get, so stop looking

- **Per-outfall discharge volumes** — do not exist publicly. Attribution stays segment-level.
- **NMC's internal desilting schedule** — not public.
- **Reservoir-level quality results** — this absence *is* your problem statement.

---

## What changes in the build

**The bacteriological gap is now partly closed.** You have coliform counts for rivers, lakes and 12 city wells. So the verdict engine can assess IS 10500's bacteriological requirement **at those points** — including the finding that all 12 fail it.

**But the asymmetric verdict still stands.** You have coliforms for 45 specific points, not for anyone's tap. The three states remain — *exceeds limit* / *no exceedance in the parameters tested here* / *not tested* — and you still never say "safe."

**The irrigation feature is stronger than expected.** The CGWB data carries **SAR and RSC** alongside EC and pH, which is the full FAO-29 irrigation assessment rather than the partial one I'd assumed.

**A new candidate for your best visual:** the DO curve down each river, with the drain-confluence points marked. It's one chart, it's from a government report, it shows cause and effect, and it needs no explanation.
