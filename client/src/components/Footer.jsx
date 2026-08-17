import React from 'react';
import { ThreeWaterFooter } from './ThreeWaterFooter';
import { ThreeWaterDivider } from './ThreeWaterDivider';
import { Droplet, Building2, ShieldCheck, ExternalLink, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{ position: 'relative', width: '100%', marginTop: 'auto' }}>
      {/* Subtle Animated Water Section Divider Strip */}
      <ThreeWaterDivider />

      {/* Main Footer Container with Full-Bleed Animated Three.js Water Surface */}
      <div style={{
        position: 'relative',
        background: '#0d1b2a',
        color: '#ffffff',
        padding: '3.5rem 1.75rem 2.5rem 1.75rem',
        overflow: 'hidden'
      }}>
        {/* Three.js Water Shader Background Layer */}
        <ThreeWaterFooter />

        {/* Foreground Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1280px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem'
          }}>
            {/* Column 1: Brand & Logo */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #c9a15f 0%, #a68142 100%)',
                  padding: '0.5rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(201, 161, 95, 0.3)'
                }}>
                  <Droplet size={22} color="#0d1b2a" fill="#0d1b2a" />
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  NeerNetra <span style={{ fontSize: '0.7rem', color: '#c9a15f', border: '1px solid rgba(201, 161, 95, 0.4)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>PREMIUM</span>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: '320px' }}>
                Executive Non-Revenue Water (NRW%) loss monitoring, predictive linear forecasting, and Gemini AI operations system for Nagpur Municipal Corporation.
              </p>
            </div>

            {/* Column 2: Quick System Navigation */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#c9a15f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.1rem' }}>
                Municipal Infrastructure
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <li><a href="/" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Nagpur 10-Zone Spatial Map</a></li>
                <li><a href="/" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>City-Wide Gemini AI Executive Briefing</a></li>
                <li><a href="/login" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Field Worker Authentication</a></li>
              </ul>
            </div>

            {/* Column 3: NMC Governance & Provenance */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#c9a15f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.1rem' }}>
                Governance & Compliance
              </h4>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '1rem',
                borderRadius: '12px',
                fontSize: '0.825rem',
                color: '#94a3b8',
                lineHeight: 1.5
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <Building2 size={16} color="#c9a15f" /> Civic Data Provenance
                </div>
                Automated 20% jump validation guards active field worker monthly submissions against anomaly entries.
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Status Line */}
          <div style={{
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexWrap: 'wrap',
            justify: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.8rem',
            color: '#64748b'
          }}>
            <div>
              © 2026 NeerNetra Water Monitoring System. Nagpur Municipal Corporation (NMC).
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c9a15f', fontWeight: 600 }}>
                <ShieldCheck size={14} /> 10 Zones Active
              </span>
              <span>•</span>
              <span>Three.js Water Engine v0.170.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
