import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  fetchZoneHistory,
  fetchZoneTrend,
  uploadMonthlyRecord,
  generateAiSummary
} from '../services/api';
import { SyntheticBadge } from '../components/SyntheticBadge';
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Upload,
  Calendar,
  Droplets,
  Truck,
  CheckCircle2,
  BrainCircuit,
  Info,
  Clock
} from 'lucide-react';

export const ZoneDetailPage = () => {
  const { zoneName } = useParams();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI summary states
  const [aiSummary, setAiSummary] = useState('');
  const [aiSource, setAiSource] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Upload Form states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMonth, setUploadMonth] = useState('2026-07');
  const [uploadMld, setUploadMld] = useState('');
  const [uploadNrw, setUploadNrw] = useState('');
  const [uploadTanker, setUploadTanker] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadWarning, setUploadWarning] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [histData, trendData] = await Promise.all([
        fetchZoneHistory(zoneName),
        fetchZoneTrend(zoneName)
      ]);
      setHistory(histData);
      setTrend(trendData);

      // Default upload month to next month after latest
      if (histData.length > 0) {
        const lastMonth = histData[histData.length - 1].month;
        const [year, m] = lastMonth.split('-').map(Number);
        const nextDate = new Date(year, m); // next month
        const nextYear = nextDate.getFullYear();
        const nextMonthNum = String(nextDate.getMonth() + 1).padStart(2, '0');
        setUploadMonth(`${nextYear}-${nextMonthNum}`);
        setUploadMld(String(histData[histData.length - 1].mld_supplied));
        setUploadNrw(String(histData[histData.length - 1].nrw_pct));
        setUploadTanker(String(histData[histData.length - 1].tanker_count));
      }
    } catch (err) {
      console.error('Error loading zone detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [zoneName]);

  const handleGenerateAi = async () => {
    setAiLoading(true);
    setAiSummary('');
    try {
      const result = await generateAiSummary(zoneName);
      setAiSummary(result.summary);
      setAiSource(result.source || 'gemini');
    } catch (err) {
      console.error('AI generation failed:', err);
      setAiSummary('Unable to generate AI summary. Please check token or network connection.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadWarning('');
    setUploadSuccess('');

    try {
      const result = await uploadMonthlyRecord(zoneName, {
        month: uploadMonth,
        mld_supplied: Number(uploadMld),
        nrw_pct: Number(uploadNrw),
        tanker_count: Number(uploadTanker)
      });

      if (result.warning) {
        setUploadWarning(result.warning);
      } else {
        setUploadSuccess(`Monthly record for ${uploadMonth} saved successfully!`);
      }

      await loadData(); // Reload chart & table
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadWarning(err.response?.data?.message || 'Failed to upload monthly record.');
    } finally {
      setUploadLoading(false);
    }
  };

  const getTrendBadge = (direction) => {
    if (direction === 'rising') {
      return (
        <span className="status-tag status-danger" style={{ fontSize: '0.85rem' }}>
          <TrendingUp size={16} /> Rising Loss (+&gt;0.5%/mo)
        </span>
      );
    }
    if (direction === 'improving') {
      return (
        <span className="status-tag status-good" style={{ fontSize: '0.85rem' }}>
          <TrendingDown size={16} /> Improving (-&gt;0.5%/mo)
        </span>
      );
    }
    return (
      <span className="status-tag status-warning" style={{ fontSize: '0.85rem' }}>
        <Minus size={16} /> Flat Rate
      </span>
    );
  };

  // Recent 3 months table slice
  const recentTableRecords = [...history].reverse().slice(0, 4);

  return (
    <div className="animate-fade-in">
      {/* Back button & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
          <ArrowLeft size={18} /> Back to Overview
        </button>

        <button onClick={() => setShowUploadModal(true)} className="btn btn-primary" style={{ gap: '0.5rem' }}>
          <Upload size={18} /> Upload This Month's Data
        </button>
      </div>

      {/* Zone Header Bar */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            NMC Municipal Zone Analytics
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            {zoneName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Historical NRW% performance, trend projections, and AI recommendations
          </p>
        </div>

        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {getTrendBadge(trend.direction)}
          </div>
        )}
      </div>

      {/* Grid Layout: Chart (Left) + Trend Prediction Card (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Line Chart Card */}
        <div className="glass-card" style={{ padding: '1.5rem', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                NRW% Trend Line History
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Non-Revenue Water loss percentage across recorded months
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', background: '#38bdf8', borderRadius: '50%' }}></span> Recorded NRW%
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%' }}></span> Critical Limit (45%)
              </span>
            </div>
          </div>

          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 70]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid var(--border-glow)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  formatter={(value, name) => [`${value}%`, 'NRW Loss']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <ReferenceLine y={45} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '45% High Loss', fill: '#ef4444', fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="nrw_pct"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#0284c7', stroke: '#38bdf8', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend & Linear Prediction Card */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.85rem' }}>
              <BrainCircuit size={20} /> Linear Regression Trend
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Predicted Next Month
            </h3>

            {trend ? (
              <div style={{ margin: '1.25rem 0' }}>
                <div style={{ fontSize: '2.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {trend.predicted_next_month_nrw_pct}%
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  {getTrendBadge(trend.direction)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                  Calculated slope: <strong style={{ color: '#fff' }}>{trend.slope > 0 ? `+${trend.slope}` : trend.slope}%/month</strong>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>Calculating trend...</div>
            )}
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.775rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <Info size={16} color="var(--accent-cyan)" style={{ shrink: 0, marginTop: '2px' }} />
            <span>Estimate based on recent linear least-squares trend, not a guarantee.</span>
          </div>
        </div>
      </div>

      {/* Gemini AI Summary Section */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={22} color="#a855f7" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Gemini AI Operational Summary
              </h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              AI analysis of last 3 months data, trend pattern, and actionable field recommendation
            </p>
          </div>

          <button
            id="generate-ai-btn"
            onClick={handleGenerateAi}
            className="btn btn-ai"
            disabled={aiLoading}
          >
            <Sparkles size={18} />
            {aiLoading ? 'Generating AI Summary...' : 'Generate AI Summary'}
          </button>
        </div>

        {aiLoading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--accent-cyan)' }}>
            <Sparkles size={28} className="glow-pulse" style={{ marginBottom: '0.5rem' }} />
            <div>Building prompt & analyzing 3-month dataset via Google Gemini API...</div>
          </div>
        )}

        {aiSummary && !aiLoading && (
          <div className="animate-fade-in" style={{
            background: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            position: 'relative'
          }}>
            <div style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#f3e8ff' }}>
              {aiSummary}
            </div>
            {aiSource && (
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BrainCircuit size={12} /> Powered by {aiSource} model
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Monthly Records Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Monthly Log Entries
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing latest recorded months with source provenance badges
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Month</th>
                <th style={{ padding: '0.75rem 1rem' }}>Water Supplied (MLD)</th>
                <th style={{ padding: '0.75rem 1rem' }}>NRW %</th>
                <th style={{ padding: '0.75rem 1rem' }}>Tankers Dispatched</th>
                <th style={{ padding: '0.75rem 1rem' }}>Uploaded By</th>
                <th style={{ padding: '0.75rem 1rem' }}>Data Origin</th>
              </tr>
            </thead>
            <tbody>
              {recentTableRecords.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <Calendar size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--accent-cyan)' }} />
                    {row.month}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)' }}>
                    {row.mld_supplied} MLD
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: row.nrw_pct > 45 ? '#f87171' : row.nrw_pct >= 30 ? '#fbbf24' : '#34d399' }}>
                    {row.nrw_pct}%
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)' }}>
                    {row.tanker_count} trips
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                    {row.uploaded_by}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <SyntheticBadge isSynthetic={row.is_synthetic} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal Dialog */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(6, 11, 24, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Upload Monthly Data ({zoneName})
              </h3>
              <button
                onClick={() => { setShowUploadModal(false); setUploadWarning(''); setUploadSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            {uploadWarning && (
              <div className="alert-warning-banner">
                <AlertTriangle size={24} style={{ shrink: 0 }} />
                <div style={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
                  <strong>Jump Validation Alert:</strong> {uploadWarning}
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="alert-warning-banner" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399', borderLeftColor: '#10b981' }}>
                <CheckCircle2 size={24} style={{ shrink: 0 }} />
                <div style={{ fontSize: '0.875rem' }}>{uploadSuccess}</div>
              </div>
            )}

            <form onSubmit={handleUploadSubmit}>
              <div className="form-group">
                <label className="form-label">Month (YYYY-MM)</label>
                <input
                  type="text"
                  className="form-input"
                  value={uploadMonth}
                  onChange={(e) => setUploadMonth(e.target.value)}
                  placeholder="e.g. 2026-07"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Water Supplied (MLD)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={uploadMld}
                  onChange={(e) => setUploadMld(e.target.value)}
                  placeholder="e.g. 225.5"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">NRW % (Non-Revenue Water Loss)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={uploadNrw}
                  onChange={(e) => setUploadNrw(e.target.value)}
                  placeholder="e.g. 48.5"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label">Tanker Trips Dispatched</label>
                <input
                  type="number"
                  className="form-input"
                  value={uploadTanker}
                  onChange={(e) => setUploadTanker(e.target.value)}
                  placeholder="e.g. 15"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploadLoading}
                >
                  {uploadLoading ? 'Saving...' : 'Submit & Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
