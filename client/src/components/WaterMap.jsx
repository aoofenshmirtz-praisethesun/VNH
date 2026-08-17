import { MapContainer, TileLayer, Marker, Popup, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const COLORS = {
  cgwb: '#38bdf8',
  neeri_river: '#22d3ee',
  neeri_groundwater_city: '#fbbf24',
  neeri_stp: '#a78bfa',
  citizen: '#c084fc',
  query: '#f472b6',
};

function colorForPoint(props) {
  if (props.kind === 'citizen') return COLORS.citizen;
  if (props.source === 'cgwb') return COLORS.cgwb;
  if (props.source_type === 'river') return COLORS.neeri_river;
  if (props.source_type === 'groundwater_city') return COLORS.neeri_groundwater_city;
  if (props.source_type === 'stp') return COLORS.neeri_stp;
  return COLORS.cgwb;
}

function createIcon(color, radius = 7) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:${radius * 2}px;height:${radius * 2}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.85);box-shadow:0 0 0 2px rgba(0,0,0,0.25)"></div>`,
    iconSize: [radius * 2, radius * 2],
    iconAnchor: [radius, radius],
  });
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function WaterMap({
  center,
  features = [],
  selectedId,
  queryPoint,
  onMapClick,
  onSelectPoint,
}) {
  return (
    <MapContainer center={center} zoom={11} className="map-container" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMapClick={onMapClick} />

      {features.map((feature) => {
        const [lon, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        const color = colorForPoint(props);
        const isSelected = selectedId === props.id;
        return (
          <Marker
            key={props.id}
            position={[lat, lon]}
            icon={createIcon(color, isSelected ? 9 : 7)}
            eventHandlers={{ click: () => onSelectPoint?.(props.id) }}
          >
            <Popup>
              <strong>{props.label}</strong>
              <br />
              {props.source?.toUpperCase()} · {props.source_type}
            </Popup>
          </Marker>
        );
      })}

      {queryPoint && (
        <CircleMarker
          center={[queryPoint.lat, queryPoint.lon]}
          radius={10}
          pathOptions={{ color: COLORS.query, fillColor: COLORS.query, fillOpacity: 0.35 }}
        />
      )}
    </MapContainer>
  );
}

export function MapLegend() {
  const items = [
    ['CGWB groundwater', COLORS.cgwb],
    ['NEERI rivers', COLORS.neeri_river],
    ['NEERI city wells', COLORS.neeri_groundwater_city],
    ['STPs', COLORS.neeri_stp],
    ['Citizen reading', COLORS.citizen],
    ['Your click', COLORS.query],
  ];
  return (
    <div className="legend">
      {items.map(([label, color]) => (
        <span className="legend-item" key={label}>
          <span className="legend-dot" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}
