# dataset/ — canonical data for the build

**Do not re-extract anything. Do not use copies from `data/` — this folder is the ruling version.**

| File | Contents |
|---|---|
| `verdict_engine.py` | The verdict logic. Import it; never reimplement it. |
| `nagpur_groundwater_cgwb.csv` / `.geojson` | 347 CGWB groundwater points, full chemistry incl. SAR/RSC. `ec` in **µS/cm**. |
| `nagpur_neeri_2023-24.geojson` | 48 features: 23 river sites, 12 city wells, 13 STPs. ⚠ river `ec_mscm` is **mS/cm** — ×1000 to compare with CGWB. |
| `standards/is10500.csv` | Drinking water limits. |
| `standards/cpcb_designated_best_use.csv` | Classes A–E — what water is fit for. |
| `standards/fao29_crop_salt_tolerance.csv` | 35 crops. **Prefer the `ecw_*` band columns**; fall back to threshold+slope only where blank. |

Read `/AI-BUILD-CONTEXT.md` and `/RECONCILIATION.md` at the repo root before writing code.

**Figures: ~520 MLD sewage generated · ~345 MLD treated · ~175 MLD untreated.** Not 423.5.
