#!/usr/bin/env python3
"""Render each ESR map PDF as a small thumbnail for AI vision classification."""
import pymupdf, glob, os, csv

THUMB_DIR = 'thumbnails'
os.makedirs(THUMB_DIR, exist_ok=True)

# Read CSV to know which zones need checking per map
zones_by_map = {}
for r in csv.DictReader(open('esr_supply_zones.csv', encoding='utf-8')):
    key = f"{r['nmc_zone']}__{r['esr']}".replace(' ', '_')
    if key not in zones_by_map:
        zones_by_map[key] = {'auto_blue': [], 'check': []}
    if r['confidence'] == 'auto':
        zones_by_map[key]['auto_blue'].append(r['zone_code'])
    else:
        zones_by_map[key]['check'].append(r['zone_code'])

for f in sorted(glob.glob('**/*.pdf', recursive=True)):
    esr = (os.path.basename(f)
           .replace('_Estimated_Supply__Dec_23', '')
           .replace('.pdf', '').replace('_', ' ').strip())
    nmc_zone = os.path.basename(os.path.dirname(f))
    key = f"{nmc_zone}__{esr}".replace(' ', '_')
    
    doc = pymupdf.open(f)
    pg = doc[0]
    # Render at low DPI for thumbnail
    mat = pymupdf.Matrix(0.5, 0.5)  # 50% scale
    pix = pg.get_pixmap(matrix=mat)
    thumb_path = os.path.join(THUMB_DIR, f'{key}.png')
    pix.save(thumb_path)
    
    info = zones_by_map.get(key, {'auto_blue': [], 'check': []})
    print(f'{key}: {len(info["auto_blue"])} auto-blue, {len(info["check"])} need check, saved {thumb_path}')

print(f'\nDone. Thumbnails in {THUMB_DIR}/')
