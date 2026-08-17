# DEM Terrain Viability Check — Nagpur

## Method
- 400 sample points across Nagpur city area (21.08-21.18°N, 79.04-79.14°E)
- Elevation data from Open Elevation API (SRTM-derived)
- Slope calculated from elevation differences between adjacent grid points

## Results

| Metric | Value |
|---|---|
| Elevation range | 282m – 353m (71m across city) |
| Mean elevation | 306.9m |
| Standard deviation | 12.9m |
| Mean slope | 0.76° |
| Median slope | 0.62° |
| Max slope | 3.71° |

## Verdict: TERRAIN IS TOO FLAT FOR FLOW MODELLING

With a standard deviation of only 12.9m across the entire city and mean slopes under 1°, pit-fill → flow direction → flow accumulation will produce **incoherent results** — sinks everywhere, no coherent channels, output that is noise dressed up as analysis.

### Recommendation
**Ship reported flood locations only.** Do NOT build a terrain-based flood susceptibility model (Task 5).

The 31 reported locations in `flood_reports.csv` are the primary and sufficient answer for Q2 (flooding). A terrain layer would add false confidence, not real information.

### What this means for the project
- **Task 5 (flood susceptibility model) is CANCELLED** — terrain doesn't support it
- This saves 4-6 hours of work that would produce unreliable output
- The flood feature uses observed reports only, which is the honest answer
- The pitch can honestly say: "Nagpur is flat enough that terrain models can't distinguish flood-prone from safe — only residents who've been there can tell you"
