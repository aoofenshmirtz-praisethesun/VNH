#!/usr/bin/env python3
"""Generate answer files from the color-classified CSV."""
import csv, os

answers_dir = 'answers'
os.makedirs(answers_dir, exist_ok=True)

rows = list(csv.DictReader(open('esr_supply_zones_classified.csv', encoding='utf-8')))

# Group by map
maps = {}
for r in rows:
    key = f"{r['nmc_zone']}__{r['esr']}".replace(' ', '_')
    if key not in maps:
        maps[key] = {}
    maps[key][r['zone_code']] = r['supply_hrs']

# Write answer files
for map_key, zones in sorted(maps.items()):
    path = os.path.join(answers_dir, f'{map_key}.txt')
    with open(path, 'w') as f:
        for zone_code in sorted(zones.keys(), key=lambda x: int(x.split('-')[1])):
            f.write(f'{zone_code},{zones[zone_code]}\n')
    print(f'{map_key}: {len(zones)} zones')

print(f'\nGenerated {len(maps)} answer files in {answers_dir}/')
