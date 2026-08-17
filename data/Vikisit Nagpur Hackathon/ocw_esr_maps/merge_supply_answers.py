#!/usr/bin/env python3
"""
Merge vision-AI answers into esr_supply_zones.csv and QA them.

Layout expected (run from inside ocw_esr_maps):
    esr_supply_zones.csv          <- from extract_esr_supply.py
    previews/<NMCZONE>__<ESR>.png <- from extract_esr_supply.py
    answers/<NMCZONE>__<ESR>.txt  <- one AI reply per map, lines like "SZ-1,18-24"

Output:
    esr_supply_zones_final.csv
    plus a QA report printed to the terminal.

QA logic: blue (04-08) zones were detected from pixels, independently of the AI.
Any map where the AI disagrees on a known-blue zone is flagged - re-check that map.
"""
import csv, os, glob, re, collections

VALID = {'18-24', '04-08', '02-04', 'UNSURE'}


def load_answers():
    ans = {}
    for f in glob.glob('answers/*.txt'):
        key = os.path.basename(f)[:-4]
        d = {}
        for line in open(f, encoding='utf-8'):
            line = line.strip().strip('`').replace(' ', '')
            m = re.match(r'^(SZ-\d+),([0-9\-]+|UNSURE)$', line, re.I)
            if m:
                code, band = m.group(1).upper(), m.group(2).upper()
                if band in VALID:
                    d[code] = band
        ans[key] = d
    return ans


def main():
    rows = list(csv.DictReader(open('esr_supply_zones.csv', encoding='utf-8')))
    ans = load_answers()
    if not ans:
        print('No answers/*.txt found. Do step 2 first.')
        return

    stats = collections.defaultdict(lambda: {'blue_ok': 0, 'blue_bad': 0,
                                             'filled': 0, 'missing': 0, 'unsure': 0})
    for r in rows:
        key = f"{r['nmc_zone']}__{r['esr']}".replace(' ', '_')
        a = ans.get(key)
        r['ai_answer'] = ''
        r['flag'] = ''
        if a is None:
            r['final_supply_hrs'] = r['supply_hrs']
            r['flag'] = 'NO_ANSWER_FILE'
            continue
        got = a.get(r['zone_code'])
        r['ai_answer'] = got or ''
        s = stats[key]

        if r['confidence'] == 'auto':                  # pixel-confirmed blue
            r['final_supply_hrs'] = '04-08'
            if got == '04-08':
                s['blue_ok'] += 1
            elif got:
                s['blue_bad'] += 1
                r['flag'] = f'AI_DISAGREES_ON_BLUE({got})'
        else:
            if not got:
                r['final_supply_hrs'] = ''
                r['flag'] = 'MISSING_FROM_AI'
                s['missing'] += 1
            elif got == 'UNSURE':
                r['final_supply_hrs'] = ''
                r['flag'] = 'AI_UNSURE'
                s['unsure'] += 1
            else:
                r['final_supply_hrs'] = got
                s['filled'] += 1

    fields = list(rows[0].keys())
    with open('esr_supply_zones_final.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

    print(f'{"MAP":48s} {"BLUE-CHECK":>12s}  filled  missing  unsure')
    bad_maps = []
    for k, s in sorted(stats.items()):
        tot = s['blue_ok'] + s['blue_bad']
        score = f"{s['blue_ok']}/{tot}" if tot else 'n/a'
        mark = ''
        if s['blue_bad'] or s['missing']:
            mark = '  <-- RECHECK'
            bad_maps.append(k)
        print(f'{k[:48]:48s} {score:>12s}  {s["filled"]:6d}  {s["missing"]:7d}  {s["unsure"]:6d}{mark}')

    done = sum(1 for r in rows if r['final_supply_hrs'])
    print(f'\n{done} of {len(rows)} zones resolved.')
    if bad_maps:
        print(f'\nRe-run these {len(bad_maps)} map(s) through the AI:')
        for m in bad_maps:
            print('   ', m)
    else:
        print('\nAll maps passed the blue-zone cross-check.')


if __name__ == '__main__':
    main()
