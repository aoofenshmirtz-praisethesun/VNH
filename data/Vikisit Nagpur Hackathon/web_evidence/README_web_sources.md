# Web-only evidence and URLs

Date: 2026-08-15 (IST)

This folder contains structured extracts created from public web sources discovered during the data acquisition sweep. The full source documents are not all downloadable from the runtime environment; where a binary could not be downloaded, the exact public URL is preserved here and a structured extract is included when the indexed source exposed the relevant table text.

## Important provenance rules
- Treat uploaded CGWB/Nagpur PDFs as primary source files.
- Treat OCW intervention claims as operator-reported.
- Treat historical OCW supply-hour PDFs as historical/estimated, not current supply guarantees.
- Do not silently correct source coordinate oddities. The CGWB normalized files contain a coordinate-note column.
- NMC/NEERI tables are primary city monitoring data and are stronger for contemporary bacteria/metal context than the older CGWB survey.
- Web extracts are not substitutes for the original source PDFs when the source offers a full table.

## Exact public source URLs

### OCW
- https://www.ocwindia.com/assets/pdf/Laxmi-Nagar-New-ESR.pdf
- https://www.ocwindia.com/assets/pdf/Laxmi-Nagar-Old-ESR.pdf
- https://www.ocwindia.com/assets/pdf/Omkar-Nagar-ESR-I.pdf
- https://www.ocwindia.com/assets/pdf/DIGHORI%20ESR.pdf
- https://www.ocwindia.com/assets/pdf/Killa_Mahal_ESR.pdf
- https://www.ocwindia.com/assets/pdf/Dhantoli-ESR.pdf
- https://www.ocwindia.com/assets/pdf/Dharampeth-Demo-Zone.pdf
- https://www.ocwindia.com/Area_of_services
- https://www.ocwindia.com/Water_management
- https://www.ocwindia.com/media/media_released/News

### NMC/NEERI
- https://nmcnagpur.gov.in/assets/300/2025/08/Public-Notices/ESR_Final_Report_2023-2024.pdf
- https://www.nmcnagpur.gov.in/assets/300/2025/08/Public-Notices/ESR_final_Report_2022-2023.pdf
- https://nmcnagpur.gov.in/assets/300/2025/02/mediafiles/Mansoon_Preparedness_Plan.pdf
- https://nagpur.gov.in/disaster-management/

### MPCB / Government
- https://mpcb.gov.in/sites/default/files/focus-area-reports-documents/Modified_Nag_River_Basin_Action_Plan_2011.pdf
- https://www.mpcb.gov.in/sites/default/files/MPR_Merged_Oct_2025.pdf
- https://mpcb.gov.in/index.php/en/nrcd-stp-project-status
- https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1701984

### Research / FAO
- https://link.springer.com/article/10.1007/s13201-025-02737-2
- https://link.springer.com/article/10.1007/s44274-026-00840-y
- https://www.fao.org/4/x5870e/x5870e07.htm

## Key verified extracts

### CGWB Nagpur AAP 2019-20
- The report says 263 shallow-aquifer samples and 84 deeper-aquifer samples were used for groundwater quality and that the detailed chemical analysis is in Annexures V and VI.
- Annexure V has 263 individual sample rows. Annexure VI has 84 individual sample rows.
- Reconstructed shallow table reproduces the report's headline validation counts: 35 samples have nitrate >45 mg/L and 6 samples have fluoride >1.5 mg/L.
- Reconstructed deeper table reproduces 17 samples with nitrate >45 mg/L and 4 with fluoride >1.5 mg/L.

### NMC/NEERI 2023-24
- Chapter 6 contains 3 rivers, 10 lakes and 12 groundwater sources.
- 12 groundwater sources include 11 dug wells and 1 bore well.
- Groundwater physico-chemical, metals, levels and river/lake bacteriology are tabulated.
- River sampling locations: 10 Nag + 8 Pilli + 5 Pora.
- River bacteriology table contains total coliform and thermotolerant faecal coliform for all 23 river stations.
- Lake bacteriology table contains total and thermotolerant faecal coliform for 10 named lakes.

### NMC/NEERI 2022-23
- 12 groundwater locations have exact DMS coordinates and location descriptions.
- 12 groundwater samples were analyzed for physico-chemical, metals and bacteriological parameters.
- River organic/nutrient table indexed values for Nag-1..Nag-9, Pilli-1..Pilli-8 and Pora-1..Pora-4; a CSV is provided from the indexed text.
- River bacteriology was above the cited desirable level of 500 CFU/100 mL at sampled sites.

### OCW
- Public ESR/command-area PDFs show locality lists, zones and ESR/GSR infrastructure and are labelled estimated supply till March 2023.
- OCW's public news archive contains intervention events for Jaitala and Wanjri and a Digital Twin announcement.

### Flood
- NMC's 2023 monsoon preparedness plan exposes aggregate counts for low-lying/flood areas, water-stagnation house damage and hollow areas adjacent to rivers/nallas.
- The District Nagpur disaster page was updated in 2026 and links a current District Disaster Management Plan, but the PDF binary was not retrieved in this runtime.

### FAO crop salinity
- The FAO crop tolerance table provides ECw thresholds for 0%, 10%, 25% and 50% yield decrement. Use ECw for irrigation-water screening and keep ECe separate.

### 2026 Nag/Pili research
- Meshram & Shelke (published 7 July 2026) uses four sites: Wathoda, Chhindwara, Jawaharlal and Hudkeshwar, with BOD, COD, DO, TDS, TSS, oil/grease, sulphide, chloride and pH. It is explicitly a screening-level framework.
