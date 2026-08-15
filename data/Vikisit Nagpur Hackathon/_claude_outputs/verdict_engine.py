#!/usr/bin/env python3
"""
Water usability verdict engine.

Three verdicts, none of which is ever the word "safe":
    EXCEEDS      - a named parameter breaches a named statutory limit
    NO_EXCEEDANCE- nothing breached among the parameters actually tested here
    NOT_TESTED   - no measurement exists for this location

Standards used (all statutory or international - nothing invented):
    IS 10500:2012                     drinking water
    CPCB Designated Best Use A-E      what the water is fit for
    FAO-29 (Ayers & Westcot 1985)     crop salt tolerance

Requires the CSVs in ./standards/
"""
import csv, os, math

STD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'standards')


def _load(name):
    with open(os.path.join(STD, name), encoding='utf-8') as f:
        return list(csv.DictReader(f))


IS10500 = _load('is10500.csv')
CPCB = _load('cpcb_designated_best_use.csv')
CROPS = {r['crop']: r for r in _load('fao29_crop_salt_tolerance.csv')}

# maps our column names -> IS 10500 parameter names
PARAM_MAP = {
    'ph': 'pH', 'tds': 'Total Dissolved Solids', 'th': 'Total Hardness (as CaCO3)',
    'ca': 'Calcium (as Ca)', 'mg': 'Magnesium (as Mg)', 'cl': 'Chloride (as Cl)',
    'so4': 'Sulphate (as SO4)', 'no3': 'Nitrate (as NO3)', 'f': 'Fluoride (as F)',
    'total_coliform_cfu100ml': 'Total Coliform',
    'faecal_coliform_cfu100ml': 'E. coli / Thermotolerant coliform',
}


def _num(v):
    try:
        x = float(v)
        return None if math.isnan(x) else x
    except (TypeError, ValueError):
        return None


def drinking_verdict(sample: dict) -> dict:
    """sample: {'ph':7.4,'no3':52,...}. Returns the asymmetric verdict."""
    tested, exceed = [], []
    for key, param in PARAM_MAP.items():
        val = _num(sample.get(key))
        if val is None:
            continue
        row = next((r for r in IS10500 if r['parameter'] == param), None)
        if not row:
            continue
        tested.append(param)
        lim = _num(row['permissible_limit_no_alt_source'])
        if lim is None:
            continue
        if param == 'pH':
            if not (6.5 <= val <= 8.5):
                exceed.append(f'{param} = {val} (limit 6.5-8.5)')
        elif val > lim:
            exceed.append(f'{param} = {val} {row["unit"]} (limit {lim})')

    bacti = any(k in sample and _num(sample.get(k)) is not None
                for k in ('total_coliform_cfu100ml', 'faecal_coliform_cfu100ml'))

    if not tested:
        return {'verdict': 'NOT_TESTED', 'exceedances': [],
                'n_parameters_tested': 0, 'bacteriological_tested': False,
                'statement': 'No measurement exists for this location.'}
    if exceed:
        return {'verdict': 'EXCEEDS', 'exceedances': exceed,
                'n_parameters_tested': len(tested), 'bacteriological_tested': bacti,
                'statement': 'Exceeds the IS 10500 limit for: ' + '; '.join(exceed)}
    note = '' if bacti else ' Not tested for bacteriological quality.'
    return {'verdict': 'NO_EXCEEDANCE', 'exceedances': [],
            'n_parameters_tested': len(tested), 'bacteriological_tested': bacti,
            'statement': f'No exceedance among the {len(tested)} parameters tested here.' + note}


def cpcb_class(sample: dict) -> dict:
    """Highest (most demanding) CPCB class this water satisfies."""
    ph, do = _num(sample.get('ph')), _num(sample.get('do_mgl'))
    bod, tc = _num(sample.get('bod_mgl')), _num(sample.get('total_coliform_cfu100ml'))
    ec, sar = _num(sample.get('ec')), _num(sample.get('sar'))
    results = {}
    for r in CPCB:
        checks, ok = [], True
        def chk(val, cond, label):
            nonlocal ok
            if val is None:
                checks.append(f'{label}: not measured'); return
            if not cond: ok = False; checks.append(f'{label}: FAIL')
            else: checks.append(f'{label}: pass')
        if r['ph_min']:
            chk(ph, ph is not None and float(r['ph_min']) <= ph <= float(r['ph_max']), 'pH')
        if r['do_min_mgl']:
            chk(do, do is not None and do >= float(r['do_min_mgl']), 'DO')
        if r['bod_max_mgl']:
            chk(bod, bod is not None and bod <= float(r['bod_max_mgl']), 'BOD')
        if r['total_coliform_max_mpn_100ml']:
            chk(tc, tc is not None and tc <= float(r['total_coliform_max_mpn_100ml']), 'coliform')
        if r['ec_max_uscm']:
            chk(ec, ec is not None and ec <= float(r['ec_max_uscm']), 'EC')
        if r['sar_max']:
            chk(sar, sar is not None and sar <= float(r['sar_max']), 'SAR')
        results[r['class']] = {'use': r['designated_best_use'], 'passes': ok, 'checks': checks}
    return results


def crop_yield_loss(ec_uscm: float, crop: str) -> dict:
    """FAO-29 linear model. ECe ~ 1.5 x ECw at a 15-20% leaching fraction."""
    c = CROPS.get(crop)
    if not c or ec_uscm is None:
        return None
    ecw = ec_uscm / 1000.0
    ece = ecw * 1.5
    thr, slope = float(c['ece_threshold_dsm']), float(c['slope_pct_per_dsm'])
    loss = max(0.0, min(100.0, (ece - thr) * slope))
    return {'crop': crop, 'ecw_dsm': round(ecw, 2), 'ece_assumed_dsm': round(ece, 2),
            'threshold_ece_dsm': thr, 'slope_pct_per_dsm': slope,
            'yield_loss_pct': round(loss, 1),
            'assumption': 'ECe = 1.5 x ECw (FAO-29, 15-20% leaching fraction)'}


def crop_advice(ec_uscm: float, top_n: int = 6) -> list:
    """Which crops tolerate this water. Sorted best-first."""
    out = [crop_yield_loss(ec_uscm, c) for c in CROPS]
    out = [o for o in out if o]
    out.sort(key=lambda o: o['yield_loss_pct'])
    return out[:top_n]


if __name__ == '__main__':
    print('--- Belgaon, Umred: EC 4920 uS/cm, NO3 8.7, F 0.5, pH 8.2 ---')
    s = {'ph': 8.2, 'ec': 4920, 'no3': 8.7, 'f': 0.5, 'tds': 3200, 'th': 720}
    v = drinking_verdict(s)
    print('DRINKING :', v['statement'])
    print('IRRIGATION (CPCB Class E):', 'pass' if cpcb_class(s)['E']['passes'] else 'FAIL',
          cpcb_class(s)['E']['checks'])
    print('ORANGE   :', crop_yield_loss(4920, 'Orange (santra / sweet orange)')['yield_loss_pct'], '% yield loss')
    print('BEST CROPS:', [(c['crop'], c['yield_loss_pct']) for c in crop_advice(4920, 4)])
