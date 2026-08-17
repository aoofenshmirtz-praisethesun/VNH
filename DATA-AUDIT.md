# Data Audit
### No feature enters scope until its data is named and its logic verified.

**Rule:** every claim below is traced to a specific source. If the data isn't there, the feature is cut or degraded — not promised and hoped for.

**Status key:** 🟢 data confirmed, claim safe · 🟡 data exists but constrains the claim · 🔴 data missing, needs fallback

---

## Q1 · F1 — "Where does your water come from?"

| | |
|---|---|
| **Needs** | Mapping from a location → supply zone → reservoir → treatment plant → supply type (24x7 or intermittent) |
| **Exists** | City-level only: sources are Pench/Kanhan/Gorewada; OCW operates WTPs at Gorewada and Kanhan; 68 reservoirs, 2000+ km network, 3M+ consumers. **The area→reservoir mapping is not published anywhere we can find.** |
| **Can claim** | Which broad source system feeds the city; the network's structure |
| **Cannot claim** | "Your specific reservoir is X" — we do not have it |
| **Fallback** | Degrade to NMC's administrative zones. Say *"your zone"*, labelled approximate. **Hard cutoff: if the reservoir command areas aren't in hand by hour 2 of the build, ship zones and move on.** Do not spend hackathon hours hunting a PDF. |
| **Status** | 🔴 → 🟡 with fallback |

---

## Q1 · F2 — Usability verdict

| | |
|---|---|
| **Needs** | Measured parameters at a location, judged against a standard |
| **Exists** | CGWB district sampling: **263 shallow + 84 deep** points, with **nitrate, fluoride, EC, pH, hardness, chloride**. MPCB: BOD/DO at **5 river stations**. OCW: sample fitness, **city-wide aggregate only**. |
| **Critical gap** | **No bacteriological data anywhere in our sources.** IS 10500 requires absence of E. coli and total coliforms for potability. |
| **Can claim** | *"Exceeds the IS 10500 limit for [named parameter], measured [date], [distance] from your location"* |
| **Cannot claim** | **"Safe to drink."** Ever. Not at any point, not with any caveat. |
| **The verdict has three states, and none of them is "safe"** | ① Exceeds limit for [parameter] · ② No exceedance among the [n] parameters tested here — **not tested for bacteriological quality** · ③ Not tested |
| **Why this is better** | It removes the liability exposure, it matches our own integrity slide, and refusing to say "safe" when we can't is the credibility move the whole project rests on |
| **Status** | 🟡 — solid, but only with the asymmetric verdict |

---

## Q1 · F3 — Crop verdict *(strongest feature)*

| | |
|---|---|
| **Needs** | Water EC and pH + published crop salt-tolerance relationships |
| **Exists** | EC and pH from CGWB points. **FAO-29** publishes, per crop, a threshold EC and a percent yield-loss slope above it. These are standard tables used by ICAR and state agriculture departments. |
| **Technical caveat a professor may probe** | FAO tables are given in both ECe (soil saturation extract) and ECw (irrigation water). **Use the ECw column and state the assumed leaching fraction.** Don't silently mix the two — that's the one place this feature can be attacked. |
| **Standards split** | **CPCB Class E** (EC < 2250 µS/cm) for the statutory pass/fail verdict; **FAO-29** for the crop-specific yield estimate. Two standards, two different jobs — say which is doing which. |
| **Can claim** | *"At this measured EC, FAO-29 puts [crop] at [x]% yield reduction"* — computed from the published table |
| **Cannot claim** | Yield predictions for a specific farm. Salinity is one of many factors |
| **⚠️ Read the actual FAO-29 table for the threshold and slope of each crop. Do not use any percentage I quoted in earlier documents — I did not verify those against the source.** The qualitative contrast (citrus sensitive, cotton tolerant) is large and robust; the exact numbers must come from the table |
| **Status** | 🟢 |

---

## Q1 · F4 — Map of what is actually known

| | |
|---|---|
| **Exists** | ~347 CGWB points, 5 MPCB stations, OCW aggregate, plus anything we add |
| **Can claim** | Every real measurement, shown as a point, with its date and distance from the user |
| **Must not do** | Draw a smooth colour surface. With this density, interpolation invents knowledge — and it's the exact sin we accuse OCW of |
| **The trap** | Our own answer for most residents is "grey / we don't know." A judge will ask what we actually *add* over OCW's single number |
| **The answer** | **Don't pitch the map — pitch the instrument.** On stage, enter a reading and watch a grey cell resolve into a verdict. The map is the *before*. The demo has to show the *after*. And reframe the line: **"the grey isn't the finding, it's the worklist — and here's what it costs to fill one cell."** |
| **Status** | 🟢 with the demo fix |

---

## Q1 · F5 — Which outfalls are upstream of you

| | |
|---|---|
| **Needs** | Outfall locations + river topology + monitoring values |
| **Exists — confirmed today** | **All 12 outfalls have identifiable place names** and can be geocoded by hand: |
| *Nag (9)* | Dande Hospital/Ravi Nagar Chowk · Bore Nalla behind Naivadyam · Untkhana Bridge · Jagnade Chowk (Nandanvan) · Super Store, Jagnade Chowk · St. Xavier School (Vyankatesh Nagar) · Hasanbagh nr Vyankatesh Nagar · Hudkeshwar Nalla nr bridge · Gandhi Nagar behind LAD College |
| *Pili (3)* | Chambhar Nalla, Sharda Ispat–Kalamna bridge (Indora) · Nagpur–Koradi railway crossing · Zingabai Takli nr St. Vincent Pallati School |
| *Stations (5)* | Ambazari · Bhandewadi Bridge · Asoli Bridge (Bhandara Rd) — Nag · Wanjra Layout (Kamptee Rd) · Mankapur (Koradi Rd) — Pili |
| **Hard constraint found today** | **No discharge volume is published for any individual outfall.** And with only 3 stations on the Nag, multiple outfalls sit between any two stations |
| **Can claim** | *"These 3 outfalls lie upstream of your point"*, and *"BOD rises from 4–13 at Ambazari to an average of 57 at Bhandewadi — these are the outfalls in that segment"* |
| **Cannot claim** | **Attribution to any single outfall.** No "outfall 3 contributes 40%." That number does not exist and I should not have used it as an illustration earlier |
| **Correct framing** | **Segment-level attribution, not outfall-level** |
| **Status** | 🟡 — real, but bounded |

---

## Q1 · F6 — Citizen sample entry

| | |
|---|---|
| **The error** | A TDS meter is a conductivity probe. It **cannot** measure nitrate, fluoride, coliforms or metals — i.e. it cannot measure any contaminant we lead with. It measures salinity, which our own data shows is the *less* common problem (5.3% of shallow samples) |
| **What it legitimately does** | ① **Irrigation screening** — FAO irrigation limits are largely EC-based, so the crop verdict genuinely runs on a TDS meter. ② **Change detection** — *"your borewell's TDS jumped 40% since last reading, get it lab-tested."* A trend from a cheap instrument is real information |
| **Optional second tier** | Nitrate and fluoride field strips run roughly ₹5–15 per test |
| **Rule** | Citizen readings **never** produce a potability verdict. They produce an irrigation verdict, a trend, or a "get this tested" flag |
| **Must appear on the entry screen** | What this instrument can and cannot detect. Same honesty move as the grey map, applied where it costs us something |
| **Status** | 🟡 — valid once rescoped |

---

## Q2 · Rainfall response

| | |
|---|---|
| **Needs** | Per-location flood behaviour |
| **Exists** | 30 m DEM · OSM: 89 drains, 135 streams, 54 rivers, 24 canals (only 9 have a width tag) · reported locations from r/nagpur, Google, personal knowledge · Open-Meteo rainfall |
| **The contradiction we nearly shipped** | *"This junction floods above 40 mm"* is precisely the labelled dataset we said doesn't exist. The number would be invented or self-generated — both of which we declared indefensible in the same document |
| **Can claim** | **An ordinal rank.** *"This junction is in the top 5% of the city for ponding risk, given catchment area, drain density and sink depth."* That is exactly the "screening, not design discharge" language we already committed to, and the DEM + OSM network supports it |
| **Cannot claim** | Any numeric rainfall threshold. Any depth |
| **Second contradiction** | We rejected safe-route navigation because it invites the Google comparison — then led Q2 with the Google comparison. **Never put "route" next to "Maps."** Our defensible claim is timing: *we warn before, not during* |
| **Status** | 🟡 — ordinal only |

---

## Q3 · Is anyone fixing it

| | |
|---|---|
| **Exists at start** | Nothing. Entirely crowdsourced |
| **The problem** | It's our most original idea, it's scheduled last, and a 30-day loop **cannot be demonstrated in a 3-minute pitch** — highest differentiation, lowest chance of existing, zero demo surface |
| **Decide before the 17th — pick one** | **(a)** Don't build it. Give it one spoken sentence: *"and the version-two hook is the question nobody asks — thirty days later, did it work?"* Eight seconds, buys the originality credit, zero build risk. **(b)** Build only the follow-up mechanic against seeded data with shifted timestamps, demo as a time-travel view |
| **Do not** | Leave it as "then Q3." That's how it becomes a screenshot of our best idea, which reads as vapour |
| **Status** | 🔴 until decided |

---

## Claims withdrawn from earlier documents

| Withdrawn | Reason |
|---|---|
| "Deep aquifer is worse — the opposite of what everyone assumes" | 13.3% vs 20.2%, unpaired, n=263 vs 84 → **z ≈ 1.55, p ≈ 0.12**. CIs overlap heavily. Survives only as *"in this dataset deep samples exceeded more often — unpaired, so a question worth asking, not a conclusion"* |
| "345 − 100 = 265 MLD untreated" | Reconcile it properly: **345 generated · 100 MLD capacity running at 80% → ~80 treated → ~265 untreated.** Anyone can do the subtraction otherwise. Also 2011 data — **assign a named person to verify current capacity on 16 Aug or drop it from the spoken pitch** |
| "Outfall 3 contributes 40% of BOD load" | No per-outfall volumes exist. Fabricated illustration. Deleted |
| "~30% orange yield loss at EC 3.1" | Not verified against the FAO-29 table. Recompute from source |
| "Nobody measures where you are" | Unpublished ≠ non-existent — and the person who can refute it may be on the panel. Reframe to **"no resident can reach it"** and pre-load the refutation as an ask: *"if that data exists, we'd take the feed tomorrow"* |
| "Two hours of compute for any city" | Never benchmarked |

---

## Still missing — one slide, not a feature

**Architecture and the ask.** Nothing anywhere answers *"what was technically hard about this build?"* — which is the question the professors are actually scoring. Have one sentence each on the three non-trivial pieces: the **upstream-outfall spatial join along the river network**, the **multi-standard verdict engine** reconciling IS 10500 / CPCB / FAO, and **DEM-based sink delineation** for Q2.

And for the municipal half: who owns it after, what it costs to run, how citizen submissions are moderated, and **what we are asking NMC for** — a zone-level feed from OCW, and read access to works data. **End the pitch on the ask.** Officials respond to being asked for something concrete far better than to being shown a map.
