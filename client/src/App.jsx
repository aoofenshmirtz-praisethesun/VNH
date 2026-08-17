import { useCallback, useEffect, useState } from 'react';
import WaterMap, { MapLegend } from './components/WaterMap';
import { VerdictStatement } from './components/VerdictBadge';
import { api } from './services/api';

const TABS = [
  { id: 'map', label: 'Map' },
  { id: 'lookup', label: 'Your location' },
  { id: 'crop', label: 'Crop advisor' },
  { id: 'submit', label: 'Add reading' },
];

const LOCALITIES = [
  { name: 'VNIT Campus', lat: 21.1458, lon: 79.0882 },
  { name: 'Dharampeth', lat: 21.141, lon: 79.065 },
  { name: 'Civil Lines', lat: 21.155, lon: 79.09 },
  { name: 'Khamla', lat: 21.108, lon: 79.055 },
  { name: 'Hingna (rural)', lat: 21.104, lon: 78.842 },
];

function formatSample(sample = {}) {
  return Object.entries(sample).map(([key, value]) => (
    <div className="sample-row" key={key}>
      <span>{key}</span>
      <span>{value}</span>
    </div>
  ));
}

export default function App() {
  const [tab, setTab] = useState('map');
  const [meta, setMeta] = useState(null);
  const [features, setFeatures] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [queryPoint, setQueryPoint] = useState(null);
  const [nearest, setNearest] = useState(null);
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('Orange (santra / sweet orange)');
  const [cropResult, setCropResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitForm, setSubmitForm] = useState({ ec: '', tds: '', ph: '', notes: '' });
  const [submitMsg, setSubmitMsg] = useState('');

  const center = meta?.center || [21.1458, 79.0882];

  const refreshPoints = useCallback(async () => {
    const data = await api.points();
    setFeatures(data.features || []);
  }, []);

  useEffect(() => {
    Promise.all([api.meta(), api.points(), api.crops()])
      .then(([metaData, pointData, cropData]) => {
        setMeta(metaData);
        setFeatures(pointData.features || []);
        setCrops(cropData.crops || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadPoint = async (id) => {
    setSelectedId(id);
    setError('');
    try {
      const data = await api.point(id);
      setSelectedPoint(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const runNearest = async (lat, lon) => {
    setQueryPoint({ lat, lon });
    setError('');
    try {
      const data = await api.nearest(lat, lon);
      setNearest(data);
      if (data.nearest_point?.id) {
        setSelectedId(data.nearest_point.id);
        setSelectedPoint(data.nearest_point);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMapClick = (lat, lon) => {
    setTab('lookup');
    runNearest(lat, lon);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => runNearest(pos.coords.latitude, pos.coords.longitude),
      () => setError('Could not read your location.'),
    );
  };

  const runCropVerdict = async () => {
    if (!queryPoint) {
      setError('Pick a location on the map or use geolocation first.');
      return;
    }
    setError('');
    try {
      const data = await api.cropVerdict({
        lat: queryPoint.lat,
        lon: queryPoint.lon,
        crop: selectedCrop,
      });
      setCropResult(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitReading = async (e) => {
    e.preventDefault();
    if (!queryPoint) {
      setError('Click the map first to choose an approximate location.');
      return;
    }
    setError('');
    setSubmitMsg('');
    try {
      const payload = {
        lat: queryPoint.lat,
        lon: queryPoint.lon,
        ec: submitForm.ec ? Number(submitForm.ec) : null,
        tds: submitForm.tds ? Number(submitForm.tds) : null,
        ph: submitForm.ph ? Number(submitForm.ph) : null,
        notes: submitForm.notes || null,
      };
      const data = await api.addCitizenReading(payload);
      setSubmitMsg(data.message);
      setSubmitForm({ ec: '', tds: '', ph: '', notes: '' });
      await refreshPoints();
      setTab('map');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="brand">
          <h1>NeerNetra</h1>
          <span>Connecting Nagpur&apos;s measured water to where you live</span>
        </div>
        <nav className="nav-tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              className={`nav-tab ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="layout">
        <section className="map-panel">
          <div className="map-toolbar">
            <button className="btn btn-secondary" type="button" onClick={handleGeolocate}>
              Use my location
            </button>
          </div>
          {loading ? (
            <div className="loading" style={{ padding: '2rem' }}>
              Loading map data…
            </div>
          ) : (
            <WaterMap
              center={center}
              features={features}
              selectedId={selectedId}
              queryPoint={queryPoint}
              onMapClick={handleMapClick}
              onSelectPoint={loadPoint}
            />
          )}
        </section>

        <aside className="side-panel">
          {error && <div className="alert alert-warning">{error}</div>}

          <section className="panel-section">
            <h2>What this shows</h2>
            <p className="hero-note">
              Real measured points only — CGWB groundwater, NEERI rivers, lakes, wells, and STPs.
              Unmeasured areas stay empty on the map. We never say water is &quot;safe&quot;; only
              whether tested parameters exceed IS 10500 limits.
            </p>
            <div className="stat-grid" style={{ marginTop: '0.75rem' }}>
              <div className="stat-card">
                <strong>{meta?.stats?.cgwb_samples || '—'}</strong>
                <span>CGWB groundwater points</span>
              </div>
              <div className="stat-card">
                <strong>{meta?.stats?.neeri_features || '—'}</strong>
                <span>NEERI 2023-24 features</span>
              </div>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <MapLegend />
            </div>
          </section>

          {tab === 'map' && (
            <section className="panel-section">
              <h2>Selected measurement</h2>
              {!selectedPoint ? (
                <p className="empty-state">Click any point on the map to inspect its measurements and verdict.</p>
              ) : (
                <>
                  <p>
                    <strong>{selectedPoint.label}</strong>
                  </p>
                  <p>{selectedPoint.source?.toUpperCase()} · {selectedPoint.measured_date}</p>
                  {selectedPoint.citizen_only && (
                    <div className="alert alert-info">{selectedPoint.irrigation_note}</div>
                  )}
                  <VerdictStatement verdict={selectedPoint.drinking_verdict} />
                  <div className="sample-list" style={{ marginTop: '0.75rem' }}>
                    {formatSample(selectedPoint.sample)}
                  </div>
                </>
              )}
            </section>
          )}

          {tab === 'lookup' && (
            <section className="panel-section">
              <h2>Nearest measurement to you</h2>
              <p>Click the map or choose a locality. Distance is shown prominently — that honesty is the product.</p>
              <div className="form-grid" style={{ marginTop: '0.75rem' }}>
                {LOCALITIES.map((loc) => (
                  <button
                    key={loc.name}
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => runNearest(loc.lat, loc.lon)}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
              {nearest && (
                <div style={{ marginTop: '1rem' }}>
                  {nearest.distance_km != null && (
                    <div className="distance-banner">
                      Nearest official measurement: <strong>{nearest.distance_km} km</strong> away
                    </div>
                  )}
                  <VerdictStatement verdict={nearest.drinking_verdict} />
                  {nearest.nearest_point && (
                    <>
                      <p style={{ marginTop: '0.75rem' }}>
                        Source: {nearest.nearest_point.label} ({nearest.nearest_point.measured_date})
                      </p>
                      <div className="sample-list">{formatSample(nearest.nearest_point.sample)}</div>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {tab === 'crop' && (
            <section className="panel-section">
              <h2>Crop / irrigation verdict</h2>
              <p>Uses CPCB Class E and FAO-29 yield loss. Assumption: ECe = 1.5 × ECw.</p>
              <div className="form-grid" style={{ marginTop: '0.75rem' }}>
                <label>
                  Crop
                  <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
                    {crops.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="btn btn-primary" type="button" onClick={runCropVerdict}>
                  Analyze nearest measurement
                </button>
              </div>
              {cropResult?.error && <div className="alert alert-warning">{cropResult.error}</div>}
              {cropResult?.yield_loss && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="distance-banner">
                    Based on measurement {cropResult.distance_km} km away
                  </div>
                  <p>
                    Estimated yield loss for {cropResult.crop}:{' '}
                    <strong>{cropResult.yield_loss.yield_loss_pct}%</strong>
                  </p>
                  <p>{cropResult.yield_loss.assumption}</p>
                  {cropResult.cpcb_class_e && (
                    <p>
                      CPCB Class E (irrigation):{' '}
                      {cropResult.cpcb_class_e.passes ? 'passes checks' : 'does not pass all checks'}
                    </p>
                  )}
                  <h3>Better-tolerating alternatives</h3>
                  <div className="crop-list">
                    {(cropResult.alternatives || []).map((item) => (
                      <div className="crop-item" key={item.crop}>
                        <span>{item.crop}</span>
                        <span>{item.yield_loss_pct}% loss</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === 'submit' && (
            <section className="panel-section">
              <h2>Add a reading</h2>
              <div className="alert alert-info">
                A TDS/EC meter measures conductivity only — it cannot detect nitrate, fluoride,
                coliforms, or metals. Citizen readings never produce a drinking verdict.
              </div>
              <form className="form-grid" style={{ marginTop: '0.75rem' }} onSubmit={submitReading}>
                <label>
                  EC (µS/cm)
                  <input
                    value={submitForm.ec}
                    onChange={(e) => setSubmitForm({ ...submitForm, ec: e.target.value })}
                    placeholder="e.g. 850"
                  />
                </label>
                <label>
                  TDS (mg/L)
                  <input
                    value={submitForm.tds}
                    onChange={(e) => setSubmitForm({ ...submitForm, tds: e.target.value })}
                    placeholder="optional"
                  />
                </label>
                <label>
                  pH
                  <input
                    value={submitForm.ph}
                    onChange={(e) => setSubmitForm({ ...submitForm, ph: e.target.value })}
                    placeholder="optional"
                  />
                </label>
                <label>
                  Notes
                  <textarea
                    value={submitForm.notes}
                    onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })}
                  />
                </label>
                <button className="btn btn-primary" type="submit">
                  Submit reading at map location
                </button>
              </form>
              {submitMsg && <div className="alert alert-info">{submitMsg}</div>}
              {!queryPoint && (
                <p className="empty-state" style={{ marginTop: '0.75rem' }}>
                  Click the map first to set an approximate location (stored at ~100 m precision).
                </p>
              )}
            </section>
          )}
        </aside>
      </main>

      <footer className="footer-note">
        Grey/unmarked areas are intentionally unmeasured. No interpolation, no &quot;safety score&quot;, no ML
        predictions. Optional datasets (ESR supply hours, outfalls, flood reports) will appear when available.
      </footer>
    </div>
  );
}
