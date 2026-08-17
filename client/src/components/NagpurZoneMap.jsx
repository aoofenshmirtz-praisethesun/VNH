import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Droplet, ArrowUpRight } from 'lucide-react';

const NAGPUR_COORDINATES = {
  "ASHI NAGAR": [21.1850, 79.1100],
  "DHANTOLI": [21.1320, 79.0820],
  "DHARAMPETH": [21.1400, 79.0550],
  "GANDHIBAGH": [21.1500, 79.0950],
  "HANUMAN NAGAR": [21.1150, 79.0950],
  "LAKADGANJ": [21.1550, 79.1300],
  "LaxmiNagar": [21.1180, 79.0630],
  "MANGALWARI": [21.1800, 79.0700],
  "NEHRU NAGAR": [21.1250, 79.1200],
  "SATRANJIPURA": [21.1650, 79.1050]
};

export const NagpurZoneMap = ({ zones = [] }) => {
  const mapRef = useRef(null);
  const leafletInstance = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadLeafletAssets = () => {
      return new Promise((resolve) => {
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (window.L) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    };

    loadLeafletAssets().then(() => {
      if (!isMounted || !mapRef.current || !window.L) return;

      if (!leafletInstance.current) {
        const L = window.L;

        // Initialize map centered on Nagpur
        const map = L.map(mapRef.current, {
          center: [21.1458, 79.0882],
          zoom: 12,
          zoomControl: true,
          scrollWheelZoom: false
        });

        // Task 2 — Switch to CARTO Positron (light, muted map tiles matching parchment)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }).addTo(map);

        leafletInstance.current = map;
      }

      setMapLoaded(true);
    });

    return () => {
      isMounted = false;
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, []);

  // Update map custom markers & radar ping when zones data updates
  useEffect(() => {
    if (!mapLoaded || !leafletInstance.current || !window.L) return;

    const L = window.L;
    const map = leafletInstance.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Render Custom Droplet Pins (L.divIcon) with High-Risk Radar Ping
    zones.forEach((z) => {
      const coords = NAGPUR_COORDINATES[z.zone] || [21.1458, 79.0882];
      const nrw = z.latest_nrw_pct || 0;

      let color = '#10b981'; // Optimal green
      let statusLabel = 'Optimal (<30%)';
      const isHighRisk = nrw > 45;

      if (isHighRisk) {
        color = '#ef4444'; // High Risk red
        statusLabel = 'High Loss (>45%)';
      } else if (nrw >= 30) {
        color = '#f59e0b'; // Moderate amber
        statusLabel = 'Moderate (30-45%)';
      }

      // Custom HTML DivIcon Droplet Pin
      const customHtml = `
        <div class="custom-leaflet-marker">
          ${isHighRisk ? '<div class="radar-ping-ring"></div>' : ''}
          <div class="marker-droplet-pin" style="background: ${color};">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
            </svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(map);

      // Custom Popup HTML styled as a sleek NeerNetra card
      const popupHtml = `
        <div style="padding: 8px; min-width: 200px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="font-size: 1.1rem; font-weight: 800; color: #0d1b2a; margin-bottom: 4px;">
            ${z.zone}
          </div>
          <div style="margin-bottom: 8px;">
            <span style="background: ${color}; color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; display: inline-block;">
              ${statusLabel}
            </span>
          </div>
          <div style="font-size: 0.85rem; color: #5a6578; margin-bottom: 4px;">
            <strong>Latest NRW:</strong> <span style="font-size: 1.1rem; font-weight: 800; color: #0d1b2a;">${nrw}%</span>
          </div>
          <div style="font-size: 0.8rem; color: #5a6578; margin-bottom: 12px;">
            Supplied: <strong>${z.mld_supplied || 0} MLD</strong> | Tankers: <strong>${z.tanker_count || 0}</strong>
          </div>
          <a href="/zone/${encodeURIComponent(z.zone)}" style="display: flex; alignItems: center; justifyContent: center; gap: 4px; background: #0d1b2a; color: #ffffff; font-weight: 700; text-decoration: none; padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; box-shadow: 0 4px 12px rgba(13,27,42,0.2);">
            Open Zone Analytics →
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);
    });

  }, [mapLoaded, zones, navigate]);

  return (
    <div className="glass-card" style={{ padding: '1.35rem', marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0d1b2a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={22} color="#c9a15f" /> Nagpur City Zone Spatial Risk Map
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Real-time custom droplet risk markers with active radar pings on High Loss zones
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }}></span> Optimal (&lt;30%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '50%' }}></span> Moderate (30-45%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%' }}></span> High Risk (&gt;45%)
          </span>
        </div>
      </div>

      <div
        ref={mapRef}
        className="map-container-vignette"
        style={{
          height: '430px',
          width: '100%',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid rgba(13, 27, 42, 0.12)'
        }}
      />
    </div>
  );
};
