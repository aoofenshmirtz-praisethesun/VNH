# Nagpur data acquisition pack — public sources + OCWGIS APK scan
Date: 2026-08-15

## 1) OCWGIS APK scan
Uploaded package:
- OCWGIS_1.7_APKPure.xapk
- SHA256: c36fefa8d1708eaed4b167780f8ac3d6da13bdbc512faea6363300b24a42327d
- SHA1: b9dc1a367a1fea0710c0b7f7dd7d82655aa4972c
- Package inside XAPK: com.esriindia.ocwgis.apk
- APK reports package name com.esriindia.ocwgis and application assembly OCWESRIGIS.
- App is a .NET MAUI / ArcGIS Runtime application. The APK contains Esri ArcGIS Runtime components and OCWESRIGIS managed assemblies.
- Public app description says the app can search/select GIS layers, identify features, refresh features within a 300 m buffer, edit/save features, use basemaps, route, and geotag photos.
- Strings scan did NOT expose an obvious public FeatureServer/MapServer/ArcGIS REST URL in the distributed package. There are ArcGIS/Portal classes and a compiled OCWESRIGIS assembly, but the service endpoint was not recoverable from simple string extraction.
- The app binary contains a source/PDB path fragment "D:\OCWNEWPROJ\" and an OCWESRIGIS assembly; this is developer build metadata, not a public service URL.
- Safe next step: inspect runtime network calls from an installed copy of the app (or use Android emulator/proxy logging) while logged in normally. Do not bypass authentication.

## 2) High-value OCW public command-area PDFs
These are official OCW PDFs with command-area/locality/ESR/zone and estimated supply-hour information. Most are explicitly labelled "ESTIMATED SUPPLY: TILL MARCH 2023", so treat supply hours as historical/estimated, not current.

1. Laxmi Nagar New ESR
https://www.ocwindia.com/assets/pdf/Laxmi-Nagar-New-ESR.pdf
2. Laxmi Nagar Old ESR
https://www.ocwindia.com/assets/pdf/Laxmi-Nagar-Old-ESR.pdf
3. Omkar Nagar ESR-I
https://www.ocwindia.com/assets/pdf/Omkar-Nagar-ESR-I.pdf
4. Dighori ESR
https://www.ocwindia.com/assets/pdf/DIGHORI%20ESR.pdf
5. Killa Mahal ESR
https://www.ocwindia.com/assets/pdf/Killa_Mahal_ESR.pdf
6. Dhantoli ESR
https://www.ocwindia.com/assets/pdf/Dhantoli-ESR.pdf
7. Dharampeth Demo Zone
https://www.ocwindia.com/assets/pdf/Dharampeth-Demo-Zone.pdf

Useful extraction targets:
- Zone
- ESR/GSR names
- command-area/locality names
- estimated supply-hour category
- direct-supply / non-network labels where shown
- spatial relationships shown on map

## 3) OCW web pages
OCW areas of service:
https://ocwindia.com/Area_of_services

OCW water management:
https://ocwindia.com/Water_management

OCW news/current operational updates:
https://ocwindia.com/media/media_released/News

Key current items surfaced by the public news page:
- Jaitala ESR: OCW reports supply improvement from about 1 hour to about 4–4.5 hours after 80 m of 150 mm pipeline repair/reconstruction plus a 400x150 mm interconnection; ~1,500 customers reportedly benefit.
- Wanjri CA (Vinoba Bhave Nagar, Santosh Nagar, Kundanlal Gupta Nagar): OCW reports replacement of 3.5 km of old pipeline and a change from contaminated supply episodes during an earlier 1.5-hour window to clean supply with 2–2.5 hour duration.
- OCW says it introduced Digital Twin technology for the Nagpur water network, consolidating operational data for network visibility, leak detection, pressure/availability and water-quality monitoring.
- OCW says Hubgrade uses sensors, data analytics and remote monitoring.
These are operator-reported claims and should be labelled as such.

## 4) NMC / CSIR-NEERI Environment Status Report 2023-24
Official PDF:
https://nmcnagpur.gov.in/assets/300/2025/08/Public-Notices/ESR_Final_Report_2023-2024.pdf

Why it matters:
- Chapter 6 covers water environment.
- It reports data for Nag, Pilli and Pora rivers; ten lakes; and 12 groundwater sources.
- Includes physico-chemical, coliform/bacterial and biological water observations.
- The report is intended for NMC planning and citizens and can be mined for current(ish) locations, monitoring tables, coordinates and parameter values.

## 5) NMC monsoon / flood
Official 2023 monsoon preparedness PDF:
https://nmcnagpur.gov.in/assets/300/2025/02/mediafiles/Mansoon_Preparedness_Plan.pdf

Publicly indexed figures:
- 66 low-lying/flood areas
- 22 slum dwelling houses damaged due to water stagnation
- 85 houses in hollow areas adjacent to rivers/nallas
These are useful for a flood-risk layer, but they do not establish a rainfall-mm -> flood-depth threshold.

District Nagpur disaster management page:
https://nagpur.gov.in/disaster-management/
It currently links the District Disaster Management Plan (PDF 7.4 MB). Use the page to retrieve the current linked plan.

## 6) MPCB — river data / interventions
Nag River Basin Action Plan 2011:
https://mpcb.gov.in/sites/default/files/focus-area-reports-documents/Modified_Nag_River_Basin_Action_Plan_2011.pdf

The document identifies five monitoring stations and gives station-level water-quality information. It also documents Nag/Pili river pollution sources and historical action recommendations.

MPCB NRCD STP status:
https://mpcb.gov.in/index.php/en/nrcd-stp-project-status
As of September 2025, the public status page reports a total project cost estimate of Rs 1,926.99 crore for the Nag River project, with Rs 4.59 crore approved/received and Rs 0 utilized (status page updated Jan 21, 2026). This is a project-status record, not evidence of environmental improvement.

MPCB merged MPR Oct 2025:
https://www.mpcb.gov.in/sites/default/files/MPR_Merged_Oct_2025.pdf
Useful for STP inventory/results. Public search results show 345.3 MLD present treatment capacity, 174.7 MLD treatment gap, and five STPs totaling 58.2 MLD under construction; it also lists individual STPs such as Bhandewadi (130 MLD), Mankapur (5 MLD), Mokshadham (5 MLD), Kachimet (1 MLD), Sonegaon (0.3 MLD), with coordinates and operational/status fields.

## 7) Government project record
PIB, 2 Mar 2021:
https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1701984
Records approval of the Nag River Pollution Abatement Project at Rs 2,117.54 crore under the National River Conservation Plan.

PIB, Dec 2022 foundation record:
https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1882232
Records the planned/announced foundation stone and says the project would be operationalised at more than Rs 1,925 crore.

## 8) New academic source found in current web sweep
2026 Discover Environment paper:
https://link.springer.com/article/10.1007/s44274-026-00840-y
"Urban river pollution affects biodiversity ecosystem integrity and human health in the Nag and Pili Rivers of Nagpur India"
- 4 sampling locations: Wathoda, Chhindwara, Jawaharlal, Hudkeshwar
- parameters include Oil & Grease, Chloride, Sulfide, pH, TSS, TDS, DO, COD, BOD
- data generated/analyzed in the paper and supplementary information
Use as an additional independent river dataset.

## 9) Primary CGWB dataset already obtained in the conversation
Nagpur District AAP 2019-20:
- Annexure V: 263 shallow-aquifer sample rows with site name, latitude, longitude and chemistry.
- Annexure VI: deeper-aquifer rows with site name, longitude, latitude and chemistry.
- This is the primary mappable groundwater dataset and is no longer a data-gap.
