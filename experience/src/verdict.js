// Verdict engine — port of verdict_engine.py.
// HARD RULE: three states only, and none of them is "safe".
// Wording here IS the compliance. Do not paraphrase these strings.

export const PARAM_LABEL = {
  ph: 'pH', tds: 'Total Dissolved Solids', th: 'Total Hardness (as CaCO3)',
  ca: 'Calcium (as Ca)', mg: 'Magnesium (as Mg)', cl: 'Chloride (as Cl)',
  so4: 'Sulphate (as SO4)', no3: 'Nitrate (as NO3)', f: 'Fluoride (as F)',
  total_coliform_cfu100ml: 'Total Coliform',
  faecal_coliform_cfu100ml: 'E. coli / Thermotolerant coliform'
};

// What a resident should actually do. Public-health guidance, not medical advice.
// NOTE: boiling fixes coliform but CONCENTRATES nitrate and fluoride.
export const ACTION = {
  'Nitrate (as NO3)': {
    means: 'Risk is to bottle-fed infants under six months (methaemoglobinaemia).',
    doThis: 'Boiling does NOT help — it concentrates nitrate. Use a different source for making infant formula.',
    boil: false
  },
  'Fluoride (as F)': {
    means: 'Long-term exposure causes dental and skeletal fluorosis.',
    doThis: 'Boiling does not remove fluoride. Removal needs activated alumina or reverse osmosis.',
    boil: false
  },
  'Lead (as Pb)': {
    means: 'Lead accumulates; the risk is to children and to pregnancy.',
    doThis: 'Boiling does NOT remove lead — it concentrates it. Removal needs reverse osmosis or a certified lead filter.',
    boil: false
  },
  'Arsenic (as As)': {
    means: 'Long-term exposure is carcinogenic.',
    doThis: 'Boiling does not remove arsenic.',
    boil: false
  },
  'Total Coliform': {
    means: 'Indicates faecal contamination of the water.',
    doThis: 'Boiling is effective against bacteria. Bring to a rolling boil before drinking.',
    boil: true
  },
  'E. coli / Thermotolerant coliform': {
    means: 'Direct indicator of faecal contamination.',
    doThis: 'Boiling is effective against bacteria. Bring to a rolling boil before drinking.',
    boil: true
  },
  'Total Hardness (as CaCO3)': {
    means: 'Affects taste, scaling and appliances.',
    doThis: 'Not an acute health risk at these levels.', boil: null
  },
  'Total Dissolved Solids': {
    means: 'High mineral content — affects taste.',
    doThis: 'Not an acute health risk at these levels.', boil: null
  }
};

let LIMITS = null;
let METALS = null;
let CPCB_B = null;

export function loadStandards(std) {
  LIMITS = {};
  for (const r of std.is10500) {
    const lim = parseFloat(r.permissible_limit_no_alt_source);
    LIMITS[r.parameter] = { limit: isNaN(lim) ? null : lim, unit: r.unit };
  }
  
  METALS = {};
  if (std.is10500_metals) {
    for (const m of std.is10500_metals) {
      METALS[m.key] = { 
        limit: parseFloat(m.permissible_limit_no_alt_source), 
        label: m.parameter, 
        unit: m.unit 
      };
    }
  }

  if (std.cpcb_dbu && std.cpcb_dbu.B_outdoor_bathing) {
    CPCB_B = std.cpcb_dbu.B_outdoor_bathing;
  }
}

// Returns exactly one of: EXCEEDS | NO_EXCEEDANCE | NOT_TESTED
export function drinkingVerdict(values) {
  const tested = [], exceed = [];
  for (const [key, param] of Object.entries(PARAM_LABEL)) {
    const val = values[key];
    if (val === undefined || val === null || isNaN(val)) continue;
    const L = LIMITS[param];
    if (!L) continue;
    tested.push(param);
    if (param === 'pH') {
      if (val < 6.5 || val > 8.5)
        exceed.push({ param, value: val, limit: '6.5–8.5', unit: '' });
    } else if (L.limit !== null && val > L.limit) {
      exceed.push({ param, value: val, limit: L.limit, unit: L.unit });
    }
  }

  // Check heavy metals if present
  if (METALS) {
    for (const [key, meta] of Object.entries(METALS)) {
      const val = values[key];
      if (val === undefined || val === null || isNaN(val)) continue;
      tested.push(meta.label);
      if (val > meta.limit) {
        exceed.push({ param: meta.label, value: val, limit: meta.limit, unit: meta.unit });
      }
    }
  }

  const bacti = ['total_coliform_cfu100ml', 'faecal_coliform_cfu100ml']
    .some(k => values[k] !== undefined && values[k] !== null);

  if (!tested.length)
    return { state: 'NOT_TESTED', exceed: [], nTested: 0, bacti: false,
             statement: 'No measurement exists for this location.' };

  if (exceed.length)
    return { state: 'EXCEEDS', exceed, nTested: tested.length, bacti,
             statement: 'Exceeds the IS 10500 limit for: ' +
               exceed.map(e => `${e.param} = ${e.value} ${e.unit} (limit ${e.limit})`).join('; ') };

  return { state: 'NO_EXCEEDANCE', exceed: [], nTested: tested.length, bacti,
           statement: `No exceedance among the ${tested.length} parameters tested here.` +
                      (bacti ? '' : ' Not tested for bacteriological quality.') };
}

// CPCB Class B — outdoor bathing. DO >= 5.0, faecal coliform <= 2500, pH 6.5-8.5
export function lakeVerdict(values) {
  if (!CPCB_B) return { state: 'NOT_TESTED', checks: [], fails: [] };
  
  const checks = [], fails = [];
  const add = (label, ok, txt) => {
    if (ok === null) { checks.push(`${label}: not measured`); return; }
    checks.push(`${label}: ${ok ? 'pass' : 'FAIL'}`);
    if (!ok) fails.push(txt);
  };

  const ph = values.ph;
  add('pH', ph == null ? null : (ph >= 6.5 && ph <= 8.5), `pH ${ph} (allowed 6.5–8.5)`);
  
  const do_val = values.do_mgl;
  add('DO', do_val == null ? null : (do_val >= CPCB_B.do_min_mgl), `DO ${do_val} mg/L (min ${CPCB_B.do_min_mgl})`);
  
  const fc = values.faecal_coliform_cfu100ml;
  add('Faecal Coliform', fc == null ? null : (fc <= CPCB_B.faecal_coliform_max_cfu100ml), 
      `Faecal Coliform ${fc} CFU/100mL (max ${CPCB_B.faecal_coliform_max_cfu100ml})`);

  if (ph == null && do_val == null && fc == null) return { state: 'INSUFFICIENT', checks, fails };
  
  return { 
    state: fails.length ? 'EXCEEDS' : 'NO_EXCEEDANCE', 
    statement: fails.length ? `Fails CPCB Class B (bathing) standard: ${fails.join('; ')}` : 'Meets CPCB Class B bathing standard.',
    checks, fails 
  };
}

// CPCB Class E — irrigation. pH 6.0–8.5, EC < 2250 uS/cm, SAR < 26.
export function irrigationVerdict(v) {
  const checks = [], fails = [];
  const add = (label, ok, txt) => {
    if (ok === null) { checks.push(`${label}: not measured`); return; }
    checks.push(`${label}: ${ok ? 'pass' : 'FAIL'}`);
    if (!ok) fails.push(txt);
  };
  add('pH', v.ph == null ? null : (v.ph >= 6.0 && v.ph <= 8.5), `pH ${v.ph} (allowed 6.0–8.5)`);
  add('EC', v.ec == null ? null : v.ec < 2250, `EC ${v.ec} µS/cm (limit 2250)`);
  add('SAR', v.sar == null ? null : v.sar < 26, `SAR ${v.sar} (limit 26)`);
  if (v.ph == null && v.ec == null) return { state: 'INSUFFICIENT', checks, fails };
  return { state: fails.length ? 'FAIL' : 'PASS', checks, fails };
}

// FAO-29. Prefer direct ECw bands; fall back to ECe threshold + slope.
export function cropAdvice(ec,n){return[];}
export function cropLoss(ec_uscm, crop) {
  if (ec_uscm == null) return null;
  const ecw = ec_uscm / 1000;
  const b0 = parseFloat(crop.ecw_0pct_dsm), b10 = parseFloat(crop.ecw_10pct_dsm),
        b25 = parseFloat(crop.ecw_25pct_dsm), b50 = parseFloat(crop.ecw_50pct_dsm);
  if (!isNaN(b0)) {                                  // direct FAO ECw bands
    let loss;
    if (ecw <= b0) loss = 0;
    else if (ecw <= b10) loss = 10 * (ecw - b0) / (b10 - b0);
    else if (ecw <= b25) loss = 10 + 15 * (ecw - b10) / (b25 - b10);
    else if (ecw <= b50) loss = 25 + 25 * (ecw - b25) / (b50 - b25);
    else loss = Math.min(100, 50 + 25 * (ecw - b50) / Math.max(b50 - b25, 0.1));
    return { crop: crop.crop, ecw: +ecw.toFixed(2), loss: Math.round(loss),
             method: 'FAO-29 ECw bands (direct)' };
  }
  const thr = parseFloat(crop.ece_threshold_dsm), slope = parseFloat(crop.slope_pct_per_dsm);
  if (isNaN(thr)) return null;
  const ece = ecw * 1.5;                             // FAO-29, 15–20% leaching fraction
  return { crop: crop.crop, ecw: +ecw.toFixed(2),
           loss: Math.round(Math.max(0, Math.min(100, (ece - thr) * slope))),
           method: 'FAO-29 threshold + slope, ECe = 1.5 × ECw assumed' };
}

export function haversineKm(a, b, c, d) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (c - a) * r, dLon = (d - b) * r;
  const x = Math.sin(dLat / 2) ** 2 +
            Math.cos(a * r) * Math.cos(c * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
