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
  X
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
  const [uploadMonth, setUploadMonth] = useState('');
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

      if (histData.length > 0) {
        const lastRecord = histData[histData.length - 1];
        const lastMonth = lastRecord.month;
        const [year, m] = lastMonth.split('-').map(Number);
        
        let nextYear = year;
        let nextMonth = m + 1;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear += 1;
        }
        const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;

        setUploadMonth(nextMonthStr);
        setUploadMld(String(lastRecord.mld_supplied));
        setUploadNrw(String(lastRecord.nrw_pct));
        setUploadTanker(String(lastRecord.tanker_count));
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

  const openUploadModal = () => {
    setUploadWarning('');
    setUploadSuccess('');
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadWarning('');
    setUploadSuccess('');
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
        setTimeout(() => {
          closeUploadModal();
        }, 1800);
      }

      await loadData();
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

  const recentTableRecords = [...history].reverse().slice(0, 4);

  return (
    <div className="animate-fade-in">
      {/* Back button & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
          <ArrowLeft size={18} /> Back to Overview
        </button>

        <button onClick={openUploadModal} className="btn btn-gold btn-gold-shimmer" style={{ gap: '0.5rem' }}>
          <Upload size={18} /> Upload This Month's Data
        </button>
      </div>

      {/* Zone Header Bar */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold-dark)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
        <div className="glass-card" style={{ padding: '1.75rem', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Historical Non-Revenue Water (NRW%) Trend
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Monthly loss percentages with 45% critical risk threshold
              </p>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} /> Red line = 45% Critical Alert Threshold
            </div>
          </div>

          {loading ? (
            <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Loading historical chart...
            </div>
          ) : (
            <div style={{ height: '320px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,27,42,0.08)" />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 60]} stroke="var(--text-secondary)" tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(13,27,42,0.15)',
                      border: '1px solid rgba(13,27,42,0.1)',
                      fontSize: '0.85rem'
                    }}
                  />
                  <ReferenceLine y={45} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '45% Threshold', fill: '#ef4444', fontSize: 12, position: 'top' }} />
                  <Line
                    type="monotone"
                    dataKey="nrw_pct"
                    name="NRW %"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#0284c7' }}
                    activeDot={{ r: 8, fill: '#c9a15f' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Side: Trend Projection & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Predictive Trend Card */}
          <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #0d1b2a 0%, #1e2d42 100%)', color: '#ffffff' }}>
            <div style={{ fontSize: '0.8rem', color: '#c9a15f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Linear Regression Forecast
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1rem', color: '#ffffff' }}>
              Next Month Projection
            </h3>

            {trend ? (
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#c9a15f', marginBottom: '0.25rem' }}>
                  {trend.predicted_next_month_nrw_pct}%
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  Calculated using least-squares linear regression (Slope: <strong>{trend.slope > 0 ? `+${trend.slope}` : trend.slope}</strong> / month)
                </div>

                <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', color: '#e2e8f0' }}>
                  <strong>Operational Outlook:</strong> {trend.predicted_next_month_nrw_pct > 45 ? 'High risk of exceeding critical loss threshold. Priority field action recommended.' : 'NRW levels projected within acceptable municipal range.'}
                </div>
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Computing trend...</div>
            )}
          </div>

          {/* Quick Metrics */}
          {history.length > 0 && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
                Latest Log Snapshot ({history[history.length - 1].month})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Water Supplied:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{history[history.length - 1].mld_supplied} MLD</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>NRW Loss:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{history[history.length - 1].nrw_pct}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Tanker Trips:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{history[history.length - 1].tanker_count} Dispatched</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Operational Summary Section */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(201, 161, 95, 0.15)', padding: '0.6rem', borderRadius: '10px' }}>
              <BrainCircuit size={22} color="#c9a15f" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Zone AI Operational Summary
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Gemini AI analysis of recent trends and recommended field worker interventions
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateAi}
            className="btn btn-ai"
            disabled={aiLoading}
            style={{ gap: '0.5rem' }}
          >
            <Sparkles size={16} />
            {aiLoading ? 'Generating AI Briefing...' : 'Generate Zone AI Briefing'}
          </button>
        </div>

        {aiSummary && (
          <div className="animate-fade-in" style={{
            background: 'rgba(13, 27, 42, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginTop: '1rem'
          }}>
            <div style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--text-primary)' }}>
              {aiSummary}
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Info size={13} /> Generated by: <strong>{aiSource}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Log History Table */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          Recent Monthly Records
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem' }}>Month</th>
                <th style={{ padding: '0.75rem' }}>Supplied (MLD)</th>
                <th style={{ padding: '0.75rem' }}>NRW %</th>
                <th style={{ padding: '0.75rem' }}>Tankers</th>
                <th style={{ padding: '0.75rem' }}>Data Provenance</th>
              </tr>
            </thead>
            <tbody>
              {recentTableRecords.map((r, i) => (
                <tr key={r._id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{r.month}</td>
                  <td style={{ padding: '0.75rem' }}>{r.mld_supplied} MLD</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: r.nrw_pct > 45 ? '#ef4444' : r.nrw_pct >= 30 ? '#f59e0b' : '#10b981' }}>
                    {r.nrw_pct}%
                  </td>
                  <td style={{ padding: '0.75rem' }}>{r.tanker_count}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <SyntheticBadge isSynthetic={r.is_synthetic} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal Dialog (Fixed Top Z-Index 9999) */}
      {showUploadModal && (
        <div
          onClick={closeUploadModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 7, 13, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.25rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel animate-fade-in"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '2.25rem',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 25px 60px rgba(13, 27, 42, 0.4), 0 0 30px rgba(201, 161, 95, 0.2)',
              border: '1px solid rgba(201, 161, 95, 0.3)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #c9a15f 0%, #a68142 100%)', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={20} color="#0d1b2a" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0d1b2a' }}>
                    Upload Monthly Log
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Zone: <strong>{zoneName}</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={closeUploadModal}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            {uploadWarning && (
              <div className="alert-warning-banner" style={{ marginBottom: '1.25rem' }}>
                <AlertTriangle size={22} style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                  <strong>20% Jump Validation Alert:</strong> {uploadWarning}
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="alert-warning-banner" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46', borderLeftColor: '#10b981', marginBottom: '1.25rem' }}>
                <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{uploadSuccess}</div>
              </div>
            )}

            <form onSubmit={handleUploadSubmit}>
              <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#0d1b2a', fontSize: '0.875rem' }}>
                  Target Month (YYYY-MM)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={uploadMonth}
                    onChange={(e) => setUploadMonth(e.target.value)}
                    placeholder="e.g. 2026-07"
                    required
                    style={{ paddingLeft: '2.5rem', fontWeight: 700 }}
                  />
                  <Calendar size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#c9a15f' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: '#0d1b2a', fontSize: '0.85rem' }}>
                    Water Supplied (MLD)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={uploadMld}
                      onChange={(e) => setUploadMld(e.target.value)}
                      placeholder="e.g. 225.5"
                      required
                      style={{ paddingLeft: '2.4rem' }}
                    />
                    <Droplets size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: '#0d1b2a', fontSize: '0.85rem' }}>
                    NRW Loss (%)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={uploadNrw}
                      onChange={(e) => setUploadNrw(e.target.value)}
                      placeholder="e.g. 48.5"
                      required
                      style={{ paddingLeft: '2.4rem' }}
                    />
                    <AlertTriangle size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }} />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#0d1b2a', fontSize: '0.85rem' }}>
                  Tanker Trips Dispatched
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    className="form-input"
                    value={uploadTanker}
                    onChange={(e) => setUploadTanker(e.target.value)}
                    placeholder="e.g. 15"
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Truck size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#0d9488' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-gold btn-gold-shimmer"
                  disabled={uploadLoading}
                >
                  {uploadLoading ? 'Saving Log...' : 'Submit & Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
