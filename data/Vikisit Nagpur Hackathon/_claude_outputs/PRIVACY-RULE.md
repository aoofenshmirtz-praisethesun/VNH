# Privacy rule for the build
### Found during a PII scan — treat this as a product requirement, not a cleanup note.

## What we found

CSIR-NEERI's published report identifies its 12 city groundwater sampling points by **owner name and plot number** — e.g. "Owner: [name], Plot No. [x], [colony]" — with coordinates to about 30 m.

**All 12 of those wells tested positive for faecal coliform.**

## Why that matters

Putting that on a searchable map would publish, for a named private individual: where they live, that their drinking water is faecally contaminated, and their plot number. They never agreed to that. It is a privacy harm, it has obvious property-value and reputational consequences, and it sits badly under the DPDP Act 2023.

The data is technically already public — it's in a government report. But a PDF annexure nobody opens and a searchable map are not the same thing. Making information dramatically easier to find is itself a meaningful act, and "it was already public" is not a defence anyone would accept if it were their name.

## What we did

All owner names and plot numbers are stripped from `gw_locations.csv` and the GeoJSON. Sampling points now carry **locality-level descriptors only** — "Reshimbagh", "OM Nagar", "Narmada Colony". Institutional locations (CSIR-NEERI campus, a temple) are kept, because they aren't private individuals.

## Rules for the build

1. **Never display a personal name against a water quality result.** Not in a tooltip, not in a popup, not in an export.
2. **Coarsen private-well locations on display.** Snap to a ~100 m grid or to the locality centroid. Full coordinates are fine for internal analysis; they should not be exposed in the UI.
3. **Institutions and public water bodies are different** — lakes, rivers, STPs, municipal reservoirs can be named precisely. They're public infrastructure.
4. **Citizen-submitted readings inherit the same rule.** If someone adds a reading from their own borewell, store no name, and display it at reduced precision.
5. **Say this on stage if quality of data comes up.** "We stripped the owner names out of the government's own dataset before mapping it" is a strong, unprompted signal that you thought about the people in the data, not just the numbers.

## Note on business names

Two sampling points were described by nearby business names. Those are now locality-only as well. A business named next to a contamination result reads as an accusation, whether or not it's meant that way.
