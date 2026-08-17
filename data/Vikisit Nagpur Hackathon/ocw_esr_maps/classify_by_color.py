#!/usr/bin/env python3
"""
Classify ESR supply zones by RGB colour analysis.

Legend:
  green  = 18 to 24 Hours  (high g relative to r)
  blue   = 04 to 08 Hours  (high b, already auto-detected)
  yellow = 02 to 04 Hours  (high r relative to g, warm tones)

The auto-detection already catches blue. This script separates green from yellow
among the remaining CHECK zones using the g-r ratio and overall warmth.
"""
import csv, os

# Thresholds derived from the RGB values in the CSV
# Green zones: g-r > threshold AND lower warmth (lower r contribution)
# Yellow zones: g-r < threshold OR higher warmth (higher r contribution)

def classify_zone(row):
    """Classify a single zone based on its RGB values."""
    r, g, b = float(row['r']), float(row['g']), float(row['b'])
    
    # Already auto-detected as blue
    if row['confidence'] == 'auto':
        return '04-08'
    
    # Blue detection (redundant but safe)
    if b > 0.352:
        return '04-08'
    
    # Green vs Yellow classification
    # Green: g is notably higher than r (greenish tint)
    # Yellow: r is higher than or close to g (warm/yellowish tint)
    gr_diff = g - r
    
    # From the CSV data patterns:
    # CHECK:18-24? zones have gr_diff around 0.04-0.07 (green > red)
    # CHECK:02-04? zones have gr_diff around -0.08 to -0.03 (red > green)
    # But there's overlap, so we use a middle threshold
    
    if gr_diff > 0.02:
        return '18-24'  # Green
    else:
        return '02-04'  # Yellow


def main():
    rows = list(csv.DictReader(open('esr_supply_zones.csv', encoding='utf-8')))
    
    classified = 0
    reclassified = 0
    
    for r in rows:
        old_val = r['supply_hrs']
        if not old_val.startswith('CHECK'):
            continue
        
        new_val = classify_zone(r)
        r['supply_hrs'] = new_val
        r['confidence'] = 'color_classified'
        classified += 1
        
        # Track if we changed the script's initial guess
        if old_val.startswith('CHECK:18-24') and new_val == '02-04':
            reclassified += 1
        elif old_val.startswith('CHECK:02-04') and new_val == '18-24':
            reclassified += 1
    
    # Write the classified CSV
    fields = list(rows[0].keys())
    with open('esr_supply_zones_classified.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    
    # Stats
    counts = {}
    for r in rows:
        v = r['supply_hrs']
        counts[v] = counts.get(v, 0) + 1
    
    print(f'Classified {classified} CHECK zones.')
    print(f'Reclassified from initial guess: {reclassified}')
    print(f'\nFinal distribution:')
    for k, v in sorted(counts.items()):
        print(f'  {k}: {v}')
    
    # Show some examples of each class
    print(f'\nSample green (18-24) zones:')
    shown = 0
    for r in rows:
        if r['supply_hrs'] == '18-24' and shown < 5:
            print(f"  {r['nmc_zone']}/{r['esr']}/{r['zone_code']}: r={r['r']}, g={r['g']}, b={r['b']}, gr_diff={float(r['g'])-float(r['r']):.3f}")
            shown += 1
    
    print(f'\nSample yellow (02-04) zones:')
    shown = 0
    for r in rows:
        if r['supply_hrs'] == '02-04' and shown < 5:
            print(f"  {r['nmc_zone']}/{r['esr']}/{r['zone_code']}: r={r['r']}, g={r['g']}, b={r['b']}, gr_diff={float(r['g'])-float(r['r']):.3f}")
            shown += 1


if __name__ == '__main__':
    main()
