import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchZonesOverview, fetchCityAiSummary } from '../services/api';
import { SyntheticBadge } from '../components/SyntheticBadge';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  Droplets,
  Truck,
  Sparkles,
  ShieldAlert,
  BrainCircuit,
  Siren,
  ArrowUpRight
} from 'lucide-react';

export const OverviewPage = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // City-wide AI Briefing state
  const [citySummary, setCitySummary] = useState('');
  const [citySummarySource, setCitySummarySource] = useState('');
  const [cityLoading, setCityLoading] = useState(false);
  const [criticalList, setCriticalList] = useState([]);

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchZonesOverview();
      setZones(data);
    } catch (err) {
      console.error('Failed to load zones overview:', err);
      setError('Failed to connect to backend server. Make sure server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleGenerateCityAi = async () => {
    setCityLoading(true);
    setCitySummary('');
    try {
      const result = await fetchCityAiSummary();
      setCitySummary(result.summary);
      setCitySummarySource(result.source || 'gemini');
      setCriticalList(result.criticalZones || []);
    } catch (err) {
      console.error('Error generating city briefing:', err);
      setCitySummary('Unable to generate city-wide AI briefing. Please check network connection.');
    } finally {
      setCityLoading(false);
    }
  };

  const getStatusClass = (nrw) => {
    if (nrw > 45) return 'status-danger';
    if (nrw >= 30) return 'status-warning';
    return 'status-good';
  };

  const getStatusLabel = (nrw) => {
    if (nrw > 45) return 'High Loss (>45%)';
    if (nrw >= 30) return 'Moderate (30-45%)';
    return 'Optimal (<30%)';
  };

  // Metric stats
  const safeZones = Array.isArray(zones) ? zones : [];
  const totalZones = safeZones.length;
  const highRiskCount = safeZones.filter(z => z.latest_nrw_pct > 45).length;
  const avgNrw = totalZones > 0 
    ? (safeZones.reduce((acc, z) => acc + z.latest_nrw_pct, 0) / totalZones).toFixed(1)
    : 0;

  return (
    <div className="animate-fade-in">
      {/* Header Banner */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            NMC Zone Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Real-time Non-Revenue Water (NRW%) loss monitoring across Nagpur Municipal Corporation zones
          </p>
        </div>

        <button onClick={loadOverview} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
          <RefreshCw size={16} className={loading ? 'glow-pulse' : ''} /> Refresh Data
        </button>
      </div>

      {error && (
        <div className="alert-warning-banner" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
          <AlertTriangle size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* Executive City-Wide AI Briefing Card */}
      <div className="glass-panel" style={{
        padding: '1.75rem',
        marginBottom: '2rem',
        borderLeft: '4px solid #a855f7',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(13, 22, 42, 0.9) 0%, rgba(30, 27, 75, 0.5) 100%)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '0.6rem', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <Siren size={24} color="#c084fc" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                City-Wide Executive AI Briefing <span style={{ fontSize: '0.75rem', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>NMC Headquarters</span>
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                System-wide risk assessment, top priority zones needing urgent action, and emergency field measures
              </p>
            </div>
          </div>

          <button
            id="generate-city-ai-btn"
            onClick={handleGenerateCityAi}
            className="btn btn-ai"
            disabled={cityLoading}
            style={{ gap: '0.5rem', padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
          >
            <Sparkles size={18} />
            {cityLoading ? 'Generating City Briefing...' : 'Generate City AI Briefing'}
          </button>
        </div>

        {cityLoading && (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#c084fc' }}>
            <BrainCircuit size={28} className="glow-pulse" style={{ marginBottom: '0.5rem' }} />
            <div>Analyzing city-wide NRW% metrics across all 10 zones via Gemini AI...</div>
          </div>
        )}

        {citySummary && !cityLoading && (
          <div className="animate-fade-in" style={{
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginTop: '1rem'
          }}>
            <div style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#f3e8ff' }}>
              {citySummary}
            </div>

            {criticalList.length > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldAlert size={14} /> High-Priority Action Zones:
                </span>
                {criticalList.map((cz) => (
                  <button
                    key={cz.zone}
                    onClick={() => navigate(`/zone/${encodeURIComponent(cz.zone)}`)}
                    className="status-tag status-danger"
                    style={{ cursor: 'pointer', border: 'none', gap: '4px', fontSize: '0.8rem' }}
                  >
                    {cz.zone}: {cz.nrw_pct}% <ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
            )}

            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BrainCircuit size={12} /> Model: {citySummarySource}
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span>Total Zones Monitored</span>
            <Activity size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{totalZones}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>10 NMC Municipal Zones</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span>Average System NRW%</span>
            <TrendingUp size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{avgNrw}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>City-wide distribution loss</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span>High Risk Zones (&gt;45%)</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171' }}>{highRiskCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Requires immediate leak audit</div>
        </div>
      </div>

      {/* Zone Grid Section */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
        Select Zone for Deep Analytics & Uploads
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: '1rem' }}>Loading NMC Zone metrics...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {safeZones.map((zone) => {
            const statusClass = getStatusClass(zone.latest_nrw_pct);
            const statusLabel = getStatusLabel(zone.latest_nrw_pct);

            return (
              <div
                key={zone.zone}
                className="glass-card"
                style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                onClick={() => navigate(`/zone/${encodeURIComponent(zone.zone)}`)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {zone.zone}
                    </h3>
                    <SyntheticBadge isSynthetic={zone.is_synthetic} size="small" />
                  </div>

                  <div style={{ margin: '1rem 0' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                      Latest Month NRW% ({zone.latest_month || 'N/A'})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                      <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {zone.latest_nrw_pct}%
                      </span>
                      <span className={`status-tag ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Droplets size={14} color="#38bdf8" /> {zone.mld_supplied} MLD
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Truck size={14} color="#f59e0b" /> {zone.tanker_count} Tankers
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span>View Details & AI Summary</span>
                  <ChevronRight size={18} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
