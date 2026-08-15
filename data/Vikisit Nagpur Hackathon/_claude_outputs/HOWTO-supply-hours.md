# How to build the supply-hours dataset
### 3 steps. ~1 hour total, most of it the AI doing the looking.

---

## Step 1 — Run the script (5 min)

Put `extract_esr_supply.py` **inside the `ocw_esr_maps` folder** (the one with the ASHI NAGAR / DHANTOLI / … subfolders), then:

```
pip install pymupdf
python extract_esr_supply.py
```

**You get:**

- `previews/` — one PNG per ESR, named `NMCZONE__ESR_NAME.png` (37 images)
- `esr_supply_zones.csv` — one row per supply zone, with:
  - `supply_hrs` = `04-08` where it's already confirmed blue (**trust these**)
  - `supply_hrs` = `CHECK:...?` where the AI needs to look

---

## Step 2 — Hand the previews to the vision AI

**One image at a time.** Do not batch them — accuracy drops badly on dense maps.

Paste this prompt with each image:

> This is a water supply map of one reservoir's command area in Nagpur. It is divided into numbered supply zones labelled SZ-1, SZ-2, SZ-3 and so on. Each zone is shaded with a semi-transparent colour wash over satellite imagery, indicating daily water supply hours.
>
> The legend (bottom right) defines exactly three colours:
> - **green** = 18 To 24 Hours
> - **blue** = 04 To 08 Hours
> - **yellow / pale cream** = 02 To 04 Hours
>
> Compare each zone against the legend swatches, not against your general idea of the colours. The satellite basemap underneath is itself green over parks and vegetation, so judge by the *overall wash* across the whole zone rather than by individual green patches inside it.
>
> List **every** SZ label visible on the map, in numerical order, with its colour band. Output nothing else — no commentary, no explanation. Use exactly this format, one per line:
>
> ```
> SZ-1,18-24
> SZ-2,02-04
> SZ-3,04-08
> ```
>
> If you genuinely cannot tell a zone's colour, write `SZ-n,UNSURE` rather than guessing.

Save each reply as `answers/<same name as the PNG>.txt`.

---

## Step 3 — Merge and QA (10 min)

Run `merge_supply_answers.py` (attached) in the same folder. It merges the AI's answers into the CSV and — importantly — **checks them.**

### The built-in accuracy check

The script already knows which zones are blue, detected from the pixels and independently of the AI. So:

> **If the AI disagrees on a zone the script confirmed as blue, its other answers on that map are suspect.**

The script reports a per-map agreement score on the blue zones. Any map scoring below 100% on blue, re-run through the AI or check by eye yourself. This costs nothing and it turns "an AI looked at it" into "an AI looked at it and we verified it against an independent signal."

That check is also worth one line in your pitch if anyone asks how the dataset was built.

---

## What you end up with

`esr_supply_zones_final.csv` — roughly **500+ supply zones across 37 reservoirs and 10 NMC zones**, each with its daily supply-hours band.

A dataset of water supply inequality in Nagpur, at sub-zone resolution, that currently exists only as 37 separate pictures on a utility website.
