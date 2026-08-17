import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchZonesOverview, fetchCityAiSummary } from '../services/api';
import { SyntheticBadge } from '../components/SyntheticBadge';
import { VantaHeroBackground } from '../components/VantaHeroBackground';
import { NagpurZoneMap } from '../components/NagpurZoneMap';
import { ParchmentBackground } from '../components/ParchmentBackground';
import { AnimatedCountUp } from '../components/AnimatedCountUp';
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Droplets,
  Truck,
  Sparkles,
  ShieldAlert,
  BrainCircuit,
  Siren,
  ArrowUpRight,
  Building2,
  MapPin,
  Grid
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

  const getCardRiskClass = (nrw) => {
    if (nrw > 45) return 'card-risk-danger';
    if (nrw >= 30) return 'card-risk-warning';
    return 'card-risk-good';
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
    ? (safeZones.reduce((acc, z) => acc + z.latest_nrw_pct, 0) / totalZones)
    : 0;

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      {/* TASK 1 — Topographic Contour Lines & Ambient Blobs Parchment Background */}
      <ParchmentBackground />

      {/* Vanta BIRDS Hero Section (Deep Dark Navy Band) */}
      <VantaHeroBackground enableVantaBirds={true} style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(201, 161, 95, 0.15)', border: '1px solid rgba(201, 161, 95, 0.3)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.775rem', color: '#c9a15f', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
              <Building2 size={14} color="#c9a15f" /> Civic Water Infrastructure Dashboard
            </div>
            <h1 style={{ fontSize: '2.35rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.5rem', lineHeight: 1.2 }}>
              Nagpur Municipal Zone Overview
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '680px' }}>
              Real-time Non-Revenue Water (NRW%) loss monitoring, predictive linear trend analysis, and automated field recommendations across all 10 Nagpur municipal zones.
            </p>
          </div>

          <button onClick={loadOverview} className="btn btn-gold" style={{ gap: '0.5rem', padding: '0.7rem 1.4rem' }}>
            <RefreshCw size={16} className={loading ? 'glow-pulse' : ''} /> Refresh Metrics
          </button>
        </div>

        {/* Executive City-Wide AI Briefing Panel */}
        <div className="glass-panel" style={{
          padding: '1.75rem',
          borderLeft: '4px solid #c9a15f',
          background: 'rgba(13, 27, 42, 0.85)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ background: 'rgba(201, 161, 95, 0.15)', padding: '0.7rem', borderRadius: '12px', border: '1px solid rgba(201, 161, 95, 0.3)' }}>
                <Siren size={24} color="#c9a15f" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Executive City-Wide AI Briefing <span style={{ fontSize: '0.725rem', background: 'rgba(201, 161, 95, 0.2)', color: '#c9a15f', border: '1px solid rgba(201, 161, 95, 0.4)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>Municipal Overview</span>
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  System-wide risk assessment, top priority zones needing urgent action, and emergency field measures
                </p>
              </div>
            </div>

            <button
              id="generate-city-ai-btn"
              onClick={handleGenerateCityAi}
              className="btn btn-ai"
              disabled={cityLoading}
              style={{ gap: '0.5rem', padding: '0.75rem 1.4rem', fontSize: '0.9rem' }}
            >
              <Sparkles size={18} />
              {cityLoading ? 'Generating City Briefing...' : 'Generate City AI Briefing'}
            </button>
          </div>

          {cityLoading && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#c9a15f' }}>
              <BrainCircuit size={28} className="glow-pulse" style={{ marginBottom: '0.5rem' }} />
              <div>Analyzing city-wide NRW% metrics across all 10 zones via Gemini AI...</div>
            </div>
          )}

          {citySummary && !cityLoading && (
            <div className="animate-fade-in" style={{
              background: 'rgba(201, 161, 95, 0.08)',
              border: '1px solid rgba(201, 161, 95, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginTop: '1rem'
            }}>
              <div style={{ fontSize: '0.95rem', lineHeight: 1.65, color: '#f8fafc' }}>
                {citySummary}
              </div>

              {criticalList.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(201, 161, 95, 0.2)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
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

              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#c9a15f', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BrainCircuit size={12} /> Engine: {citySummarySource}
              </div>
            </div>
          )}
        </div>
      </VantaHeroBackground>

      {error && (
        <div className="alert-warning-banner">
          <AlertTriangle size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* TASK 3 — Summary KPI Cards with Animated Count-Up & Micro-Animations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* KPI Card 1: Total Zones */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.65rem', fontSize: '0.875rem', fontWeight: 600 }}>
            <span>Total Zones Monitored</span>
            <Activity size={18} color="var(--accent-navy)" />
          </div>
          <div style={{ fontSize: '2.35rem', fontWeight: 800, color: 'var(--accent-navy)' }}>
            <AnimatedCountUp value={totalZones} decimals={0} />
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>10 Nagpur Municipal Zones</div>
        </div>

        {/* KPI Card 2: Average NRW% */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.65rem', fontSize: '0.875rem', fontWeight: 600 }}>
            <span>Average System NRW%</span>
            <Droplets size={18} color="var(--accent-cyan)" className="bobbing-icon" />
          </div>
          <div style={{ fontSize: '2.35rem', fontWeight: 800, color: 'var(--accent-gold-dark)' }}>
            <AnimatedCountUp value={avgNrw} decimals={1} suffix="%" />
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>City-wide distribution loss</div>
        </div>

        {/* KPI Card 3: High Risk Zones */}
        <div className="glass-card card-risk-danger" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.65rem', fontSize: '0.875rem', fontWeight: 600 }}>
            <span>High Risk Zones (&gt;45%)</span>
            <AlertTriangle size={18} color="#ef4444" className={highRiskCount > 0 ? "pulsing-icon" : ""} />
          </div>
          <div style={{ fontSize: '2.35rem', fontWeight: 800, color: '#ef4444' }}>
            <AnimatedCountUp value={highRiskCount} decimals={0} />
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Requires immediate leak audit</div>
        </div>
      </div>

      {/* TASK 2 — Interactive Nagpur Zone Leaflet Map Section */}
      <NagpurZoneMap zones={safeZones} />

      {/* Municipal Zone Grid Section Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Municipal Zone Analytics & Logs
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Select any zone to view historical trend charts, least-squares regression predictions, and submit monthly logs
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: '1rem' }}>Loading zone metrics...</div>
        </div>
      ) : (
        /* TASK 3 — Zone Cards Grid with Risk Fills, Count-Up, and Staggered Entrance */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {safeZones.map((zone, idx) => {
            const statusClass = getStatusClass(zone.latest_nrw_pct);
            const cardRiskClass = getCardRiskClass(zone.latest_nrw_pct);
            const statusLabel = getStatusLabel(zone.latest_nrw_pct);

            return (
              <div
                key={zone.zone}
                className={`glass-card ${cardRiskClass} animate-fade-in`}
                style={{
                  padding: '1.65rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  animationDelay: `${idx * 60}ms`
                }}
                onClick={() => navigate(`/zone/${encodeURIComponent(zone.zone)}`)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {zone.zone}
                    </h3>
                    <SyntheticBadge isSynthetic={zone.is_synthetic} size="small" />
                  </div>

                  <div style={{ margin: '1.15rem 0' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', fontWeight: 600 }}>
                      Latest Month NRW% ({zone.latest_month || 'N/A'})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                      <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        <AnimatedCountUp value={zone.latest_nrw_pct} decimals={1} suffix="%" />
                      </span>
                      <span className={`status-tag ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', padding: '0.75rem 0.95rem', background: 'rgba(13, 27, 42, 0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Droplets size={15} color="var(--accent-cyan)" /> {zone.mld_supplied} MLD
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Truck size={15} color="var(--accent-teal)" /> {zone.tanker_count} Tankers
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--accent-navy)', fontSize: '0.875rem', fontWeight: 700 }}>
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
