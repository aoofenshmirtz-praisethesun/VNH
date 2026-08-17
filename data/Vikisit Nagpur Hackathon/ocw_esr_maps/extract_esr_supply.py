#!/usr/bin/env python3
"""
Extract supply-zone structure from the OCW ESR 'Estimated Supply' maps.

Run locally from inside the ocw_esr_maps folder:
    pip install pymupdf
    python extract_esr_supply.py

Outputs
  esr_supply_zones.csv   one row per supply zone, ready to complete by eye
  previews/<ESR>.png     rendered map for each ESR, for the eyeball pass

What is automatic and what is not
  AUTOMATIC (reliable):  NMC zone, ESR name, list of supply-zone codes,
                         and detection of BLUE (04-08 hrs) zones.
  MANUAL   (needed):     GREEN (18-24 hrs) vs YELLOW (02-04 hrs).
                         The satellite basemap under the tint is itself green
                         over vegetation, so these two cannot be separated
                         reliably by colour. Open the preview PNG and fill the
                         'supply_hrs' column where it says CHECK.
                         ~1 minute per map.
"""
import pymupdf, glob, re, os, csv, statistics as st

DPI = 90
BLUE_B = 0.352          # normalised blue threshold - well separated
GREEN_GR = 0.040        # g-r hint only, NOT authoritative

def analyse(path):
    doc = pymupdf.open(path)
    pg = doc[0]
    sc = DPI / 72
    pix = pg.get_pixmap(dpi=DPI)
    W, H, n, S = pix.width, pix.height, pix.n, pix.samples

    def px(x, y):
        x, y = int(x), int(y)
        if not (0 <= x < W and 0 <= y < H):
            return None
        i = (y * W + x) * n
        return (S[i], S[i + 1], S[i + 2])

    rows = []
    for w in pg.get_text("words"):
        code = w[4].strip()
        if not re.fullmatch(r'SZ-\d+', code):
            continue
        cx = ((w[0] + w[2]) / 2) * sc
        cy = ((w[1] + w[3]) / 2) * sc
        samp = []
        for dx in range(-55, 56, 3):
            for dy in range(-55, 56, 3):
                if abs(dx) < 18 and abs(dy) < 13:
                    continue                      # skip the label glyphs
                p = px(cx + dx, cy + dy)
                if p and sum(p) > 90 and not (p[0] > 248 and p[1] > 248 and p[2] > 248):
                    samp.append(p)
        if len(samp) < 40:
            continue
        samp.sort(key=sum, reverse=True)
        top = samp[:max(12, len(samp) // 5)]      # bright surfaces show tint best
        med = tuple(st.median([q[i] for q in top]) for i in range(3))
        s = sum(med) or 1
        r, g, b = [v / s for v in med]
        if b > BLUE_B:
            cls, conf = '04-08', 'auto'
        else:
            cls = 'CHECK:18-24?' if (g - r) > GREEN_GR else 'CHECK:02-04?'
            conf = 'manual'
        rows.append({'zone_code': code, 'supply_hrs': cls, 'confidence': conf,
                     'r': round(r, 3), 'g': round(g, 3), 'b': round(b, 3)})
    return rows, pg


def main():
    os.makedirs('previews', exist_ok=True)
    out = []
    for f in sorted(glob.glob('**/*.pdf', recursive=True)):
        esr = (os.path.basename(f)
               .replace('_Estimated_Supply__Dec_23', '')
               .replace('.pdf', '').replace('_', ' ').strip())
        nmc_zone = os.path.basename(os.path.dirname(f))
        try:
            rows, pg = analyse(f)
        except Exception as e:
            print('ERROR', f, e)
            continue
        pg.get_pixmap(dpi=110).save(f'previews/{nmc_zone}__{esr}.png'.replace(' ', '_'))
        for r in rows:
            out.append({'nmc_zone': nmc_zone, 'esr': esr, **r})
        auto = sum(1 for r in rows if r['confidence'] == 'auto')
        print(f'{nmc_zone:16s} {esr:36s} zones={len(rows):3d}  blue(auto)={auto}')

    with open('esr_supply_zones.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=['nmc_zone', 'esr', 'zone_code',
                                           'supply_hrs', 'confidence', 'r', 'g', 'b'])
        w.writeheader()
        w.writerows(out)

    print(f'\n{len(out)} supply zones across {len({r["esr"] for r in out})} ESRs.')
    print('Now open previews/ and fix every row marked CHECK. Legend on each map:')
    print('   green = 18 To 24 Hours   blue = 04 To 08 Hours   yellow = 02 To 04 Hours')


if __name__ == '__main__':
    main()
