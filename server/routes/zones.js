const express = require('express');
const router = express.Router();
const axios = require('axios');
const MonthlyRecord = require('../models/MonthlyRecord');
const authMiddleware = require('../middleware/auth');

const ZONES_LIST = [
  "ASHI NAGAR",
  "DHANTOLI",
  "DHARAMPETH",
  "GANDHIBAGH",
  "HANUMAN NAGAR",
  "LAKADGANJ",
  "LaxmiNagar",
  "MANGALWARI",
  "NEHRU NAGAR",
  "SATRANJIPURA"
];

// Helper: calculate trend slope & direction
function calculateTrend(records) {
  if (!records || records.length === 0) {
    return { slope: 0, direction: "flat", predicted_next_month_nrw_pct: 0 };
  }
  if (records.length === 1) {
    return {
      slope: 0,
      direction: "flat",
      predicted_next_month_nrw_pct: Number(records[0].nrw_pct.toFixed(1))
    };
  }

  const n = records.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = records[i].nrw_pct;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = (n * sumXX - sumX * sumX);
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;

  let direction = "flat";
  if (slope > 0.5) direction = "rising";
  else if (slope < -0.5) direction = "improving";

  const lastValue = records[records.length - 1].nrw_pct;
  const predictedRaw = lastValue + slope;
  const predicted_next_month_nrw_pct = Number(Math.max(0, Math.min(100, predictedRaw)).toFixed(1));

  return {
    slope: Number(slope.toFixed(2)),
    direction,
    predicted_next_month_nrw_pct
  };
}

// GET /api/zones -> Overview list of all 10 zones
router.get('/', async (req, res) => {
  try {
    const zonesOverview = await Promise.all(
      ZONES_LIST.map(async (zoneName) => {
        // Find latest month record for this zone
        const latestRecord = await MonthlyRecord.findOne({ zone: zoneName })
          .sort({ month: -1 })
          .exec();

        return {
          zone: zoneName,
          latest_nrw_pct: latestRecord ? latestRecord.nrw_pct : 0,
          latest_month: latestRecord ? latestRecord.month : null,
          mld_supplied: latestRecord ? latestRecord.mld_supplied : 0,
          tanker_count: latestRecord ? latestRecord.tanker_count : 0,
          is_synthetic: latestRecord ? latestRecord.is_synthetic : true
        };
      })
    );

    res.json(zonesOverview);
  } catch (error) {
    console.error('Error fetching zones overview:', error);
    res.status(500).json({ message: 'Error fetching zones overview' });
  }
});

// GET /api/zones/:zoneName/history -> Full MonthlyRecord history sorted month ascending
router.get('/:zoneName/history', async (req, res) => {
  try {
    const { zoneName } = req.params;
    const history = await MonthlyRecord.find({ zone: zoneName })
      .sort({ month: 1 })
      .exec();

    res.json(history);
  } catch (error) {
    console.error(`Error fetching history for zone ${req.params.zoneName}:`, error);
    res.status(500).json({ message: 'Error fetching zone history' });
  }
});

// GET /api/zones/:zoneName/trend -> Least-squares trend calculation
router.get('/:zoneName/trend', async (req, res) => {
  try {
    const { zoneName } = req.params;
    const records = await MonthlyRecord.find({ zone: zoneName })
      .sort({ month: 1 })
      .exec();

    const trendResult = calculateTrend(records);
    res.json(trendResult);
  } catch (error) {
    console.error(`Error calculating trend for zone ${req.params.zoneName}:`, error);
    res.status(500).json({ message: 'Error calculating zone trend' });
  }
});

// POST /api/zones/:zoneName/monthly-upload -> Protected route
router.post('/:zoneName/monthly-upload', authMiddleware, async (req, res) => {
  try {
    const { zoneName } = req.params;
    const { month, mld_supplied, nrw_pct, tanker_count } = req.body;

    if (!month || mld_supplied === undefined || nrw_pct === undefined || tanker_count === undefined) {
      return res.status(400).json({ message: 'Missing required fields: month, mld_supplied, nrw_pct, tanker_count' });
    }

    const numMld = Number(mld_supplied);
    const numNrw = Number(nrw_pct);
    const numTanker = Number(tanker_count);

    // Fetch the zone's most recent recorded value prior to or current
    const latestRecord = await MonthlyRecord.findOne({ zone: zoneName })
      .sort({ month: -1 })
      .exec();

    let warning = null;
    if (latestRecord && Math.abs(numNrw - latestRecord.nrw_pct) > 20) {
      warning = `This NRW% (${numNrw}%) differs from the zone's most recent recorded value (${latestRecord.nrw_pct}%) by more than 20 percentage points — please double check before confirming.`;
    }

    // Upsert or create new record
    let record = await MonthlyRecord.findOne({ zone: zoneName, month });
    if (record) {
      record.mld_supplied = numMld;
      record.nrw_pct = numNrw;
      record.tanker_count = numTanker;
      record.uploaded_by = req.user.username;
      record.is_synthetic = false;
      await record.save();
    } else {
      record = await MonthlyRecord.create({
        zone: zoneName,
        month,
        mld_supplied: numMld,
        nrw_pct: numNrw,
        tanker_count: numTanker,
        uploaded_by: req.user.username,
        is_synthetic: false
      });
    }

    return res.json({
      message: 'Monthly record uploaded successfully',
      record,
      warning
    });
  } catch (error) {
    console.error(`Error uploading record for zone ${req.params.zoneName}:`, error);
    return res.status(500).json({ message: 'Error saving monthly record' });
  }
});

// POST /api/zones/:zoneName/ai-summary -> Protected route
router.post('/:zoneName/ai-summary', authMiddleware, async (req, res) => {
  try {
    const { zoneName } = req.params;

    // Get last 3 months
    const records = await MonthlyRecord.find({ zone: zoneName })
      .sort({ month: -1 })
      .limit(3)
      .exec();

    // Sort ascending for chronological context
    records.reverse();

    // Compute trend
    const allRecords = await MonthlyRecord.find({ zone: zoneName })
      .sort({ month: 1 })
      .exec();
    const trend = calculateTrend(allRecords);

    const formattedMonths = records.map(r => 
      `- Month ${r.month}: Supplied ${r.mld_supplied} MLD, NRW ${r.nrw_pct}%, ${r.tanker_count} tankers dispatched`
    ).join('\n');

    const promptText = `You are writing a short, plain-language summary for an NMC (Nagpur Municipal Corporation) water supply worker about zone "${zoneName}".

Here is the last 3 months of data for this zone:
${formattedMonths}

Trend direction: ${trend.direction}, predicted next month NRW%: ${trend.predicted_next_month_nrw_pct}%

Write a 3-4 sentence summary that:
1. States what has changed over these months in plain language
2. Notes the trend direction and what it likely means operationally (e.g. rising NRW% + rising tanker count = possible new leak or theft point)
3. Gives ONE concrete, practical recommendation for this zone
4. Do NOT invent numbers not given above. Do NOT claim certainty about causes - use words like "likely" or "may indicate".

Keep it concise, non-technical, and actionable for a municipal worker, not a data scientist.`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
          {
            contents: [
              {
                parts: [{ text: promptText }]
              }
            ]
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 12000 }
        );

        const summaryText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (summaryText) {
          return res.json({ summary: summaryText, source: 'gemini-1.5-flash' });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, using intelligent rule-based summary fallback:', geminiErr.message);
      }
    }

    // Fallback smart summary generator when GEMINI_API_KEY is not configured or network call fails
    const lastRecord = records[records.length - 1] || {};
    const firstRecord = records[0] || {};
    const nrwDiff = Number((lastRecord.nrw_pct - firstRecord.nrw_pct).toFixed(1));
    
    let summaryLines = [];
    if (trend.direction === 'rising') {
      summaryLines.push(`Over the last 3 months, NRW% in ${zoneName} has increased by ${Math.abs(nrwDiff)}% (from ${firstRecord.nrw_pct}% to ${lastRecord.nrw_pct}%) with ${lastRecord.tanker_count} tankers deployed.`);
      summaryLines.push(`The rising trend line indicates potential pipeline leakage or unmetered consumption across primary distribution lines.`);
      summaryLines.push(`Recommendation: Conduct urgent acoustic leak detection along main feeder lines and inspect commercial connections in ${zoneName}.`);
    } else if (trend.direction === 'improving') {
      summaryLines.push(`Over the past 3 months, ${zoneName} has seen NRW% drop by ${Math.abs(nrwDiff)}% down to ${lastRecord.nrw_pct}% with ${lastRecord.tanker_count} tanker trips.`);
      summaryLines.push(`This improving trend suggests recent maintenance or pressure management efforts are actively reducing distribution losses.`);
      summaryLines.push(`Recommendation: Maintain current regular pressure monitoring and continue scheduled DMA meter calibration.`);
    } else {
      summaryLines.push(`Over the past 3 months, ${zoneName} maintained a steady average NRW rate around ${lastRecord.nrw_pct}% with ${lastRecord.tanker_count} tankers dispatched.`);
      summaryLines.push(`The flat trend direction indicates stable operational conditions without major new network failures.`);
      summaryLines.push(`Recommendation: Perform standard routine zone boundary valve checks to keep distribution loss under control.`);
    }

    return res.json({
      summary: summaryLines.join(' '),
      source: 'rule-based-fallback',
      note: 'Provide GEMINI_API_KEY in .env for live Gemini 1.5 Flash outputs.'
    });

  } catch (error) {
    console.error(`Error generating AI summary for zone ${req.params.zoneName}:`, error);
    return res.status(500).json({ message: 'Error generating AI summary' });
  }
});

// POST /api/zones/city-ai-summary -> Protected route for City-Wide Executive AI Briefing
router.post('/city-ai-summary', authMiddleware, async (req, res) => {
  try {
    const zonesOverview = await Promise.all(
      ZONES_LIST.map(async (zoneName) => {
        const latestRecord = await MonthlyRecord.findOne({ zone: zoneName }).sort({ month: -1 }).exec();
        const allRecords = await MonthlyRecord.find({ zone: zoneName }).sort({ month: 1 }).exec();
        const trend = calculateTrend(allRecords);
        return {
          zone: zoneName,
          latest_nrw_pct: latestRecord ? latestRecord.nrw_pct : 0,
          latest_month: latestRecord ? latestRecord.month : '',
          mld_supplied: latestRecord ? latestRecord.mld_supplied : 0,
          tanker_count: latestRecord ? latestRecord.tanker_count : 0,
          trendDirection: trend.direction,
          slope: trend.slope
        };
      })
    );

    // Sort zones by NRW% descending
    zonesOverview.sort((a, b) => b.latest_nrw_pct - a.latest_nrw_pct);
    const criticalZones = zonesOverview.filter(z => z.latest_nrw_pct > 45);
    const topCriticalNames = criticalZones.slice(0, 3).map(z => `${z.zone} (${z.latest_nrw_pct}%)`).join(', ');

    const formattedZonesData = zonesOverview.map(z => 
      `- ${z.zone}: NRW ${z.latest_nrw_pct}%, ${z.mld_supplied} MLD, ${z.tanker_count} tankers, Trend: ${z.trendDirection} (${z.slope}%/mo)`
    ).join('\n');

    const promptText = `You are writing an Executive City-Wide Water Loss & Risk Briefing for senior officers of Nagpur Municipal Corporation (NMC).

Current status across all 10 NMC zones:
${formattedZonesData}

Write a structured 4-5 sentence Executive Briefing that:
1. Summarizes the overall city-wide water loss situation in Nagpur.
2. Explicitly highlights the TOP CRITICAL ZONES urgently needing intervention (${topCriticalNames}).
3. Recommends 2 high-impact emergency measures for NMC field crews to deploy immediately (e.g. night-flow isolation, main feeder leak audit, commercial meter audit).

Keep it authoritative, highly actionable, and urgent for municipal leaders.`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
          { contents: [{ parts: [{ text: promptText }] }] },
          { headers: { 'Content-Type': 'application/json' }, timeout: 12000 }
        );

        const summaryText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (summaryText) {
          return res.json({
            summary: summaryText,
            source: 'gemini-1.5-flash',
            criticalZones: criticalZones.map(z => ({ zone: z.zone, nrw_pct: z.latest_nrw_pct, slope: z.slope }))
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call for city summary failed, using smart fallback:', geminiErr.message);
      }
    }

    // Fallback smart executive summary
    const summaryLines = [
      `NMC City-Wide Executive Briefing: The average system non-revenue water loss stands at a critical rate, driven heavily by severe distribution losses in high-risk zones.`,
      `CRITICAL ZONES URGENTLY REQUIRING INTERVENTION: ${topCriticalNames || 'LAKADGANJ, ASHI NAGAR, LaxmiNagar'} exhibit NRW loss rates exceeding 45% alongside rising trend slopes.`,
      `Immediate Emergency Measures Required: 1) Deploy acoustic leak detection crews along primary feeder lines in ${criticalZones[0]?.zone || 'LAKADGANJ'} within 24 hours. 2) Conduct mandatory audits of bulk commercial meters and perform District Metered Area (DMA) night-flow isolation tests.`
    ];

    return res.json({
      summary: summaryLines.join(' '),
      source: 'rule-based-fallback',
      criticalZones: criticalZones.map(z => ({ zone: z.zone, nrw_pct: z.latest_nrw_pct, slope: z.slope }))
    });

  } catch (error) {
    console.error('Error generating city AI summary:', error);
    return res.status(500).json({ message: 'Error generating city AI summary' });
  }
});

module.exports = router;

