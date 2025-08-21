'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
// Use picsum.photos for reliable placeholder images
const placeholderImages = [
  'https://picsum.photos/seed/1/600/300',
  'https://picsum.photos/seed/2/600/300',
  'https://picsum.photos/seed/3/600/300',
  'https://picsum.photos/seed/4/600/300',
  'https://picsum.photos/seed/5/600/300',
];
import L from 'leaflet';

const poiColors: Record<string, string> = {
  'Entrée Principale': '#e74c3c',
  'Scène Principale': '#9b59b6',
  'Scène Électronique': '#8e44ad',
  'Scène Jazz': '#a29bfe',
  'Restauration': '#e67e22',
  'Toilettes Nord': '#6c5ce7',
  'Toilettes Sud': '#0984e3',
  'Infirmerie': '#c0392b',
  'Espace Pédagogique': '#e74c3c',
  'Village Artisanal': '#00b894',
  'Espace Conférence': '#00cec9',
  'Point Info': '#fdcb6e',
};

const legend = [
  { label: 'Scènes', color: '#9b59b6' },
  { label: 'Conférences', color: '#00cec9' },
  { label: 'Stands', color: '#00b894' },
  { label: 'Activités', color: '#e67e22' },
  { label: 'Entrées', color: '#e74c3c' },
  { label: 'Restauration', color: '#e67e22' },
  { label: 'Services', color: '#6c5ce7' },
  { label: 'Médical', color: '#c0392b' },
];

function getCustomIcon(color: string, label: string) {
  // Convert hex to rgba for halo
  function hexToRgba(hex: string, alpha: number) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  const halo = hexToRgba(color, 0.25);
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:64px;height:64px;
        background:${halo};
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;">
        <div style="
          width:32px;height:32px;
          background:${color};
          border-radius:50%;
          box-shadow:0 0 8px #888;
        "></div>
      </div>
    `,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
    popupAnchor: [0, -32],
  });
}

export default function MapPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [modal, setModal] = useState<{ poi: any; events: any[] } | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(setEvents);
  }, []);

  // Group events by POI
  const pois: Record<string, { poi: any; events: any[] }> = {};
  events.forEach(event => {
    if (event.poi) {
      if (!pois[event.poi.id]) pois[event.poi.id] = { poi: event.poi, events: [] };
      pois[event.poi.id].events.push(event);
    }
  });

  // Modal open handler
  const handleMarkerClick = (poi: any, events: any[]) => {
    setImgIdx(Math.floor(Math.random() * placeholderImages.length));
    setModal({ poi, events });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top left, rgba(168,85,247,0.13) 0%, rgba(2,6,23,1) 60%)',
      backgroundColor: '#020617',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: 0,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Blurred animated background circles for visual effect */}
      <div style={{
        pointerEvents: 'none',
        position: 'absolute',
        top: -80,
        left: -80,
        height: 288,
        width: 288,
        borderRadius: '50%',
        background: 'rgba(192,38,211,0.3)',
        filter: 'blur(48px)',
        animation: 'pulse 2s infinite',
        zIndex: 0,
      }} />
      <div style={{
        pointerEvents: 'none',
        position: 'absolute',
        bottom: -96,
        right: -96,
        height: 320,
        width: 320,
        borderRadius: '50%',
        background: 'rgba(79,70,229,0.3)',
        filter: 'blur(48px)',
        animation: 'pulse 2s infinite',
        zIndex: 0,
      }} />
      <h1 className='from-violet-300 via-fuchsia-300 to-pink-300 text-2xl' style={{ fontSize: 24, fontWeight: 'bold' }}>Carte interactive du festival</h1>
      <p>Explorez le site du festival et localisez tous les points d'intérêt</p>
      <div style={{
        width: '55%',
        background: '#fff',
        borderRadius: 16,
        padding: '14px 22px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 16,
      }}>
        <div style={{ position: 'relative', width: '100%', height: 400, borderRadius: 16, overflow: 'hidden', margin: '0 auto' }}>
          <MapContainer center={[49.443, 1.099]} zoom={17} style={{ height: '100%', width: '100%', borderRadius: 16, filter: 'brightness(1.15) grayscale(0.2)' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {Object.values(pois).map(({ poi, events }) => (
              <Marker
                key={poi.id}
                position={[poi.latitude, poi.longitude]}
                icon={getCustomIcon(poiColors[poi.nom] || '#888', poi.nom)}
                eventHandlers={{
                  click: () => handleMarkerClick(poi, events),
                }}
              >
                <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                  <div style={{ textAlign: 'center', maxWidth: 90 }}>
                    <strong style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{poi.nom}</strong>
                    <br />
                    {events.map(ev => (
                      <div key={ev.id} style={{ fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>
                        {ev.titre}
                      </div>
                    ))}
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        </div>
        {/* Legend inside the card, below the map */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 32,
          marginTop: 32,
          justifyContent: 'center',
          width: '100%',
        }}>
          {legend.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
              <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: '50%', background: item.color, marginRight: 8, border: '2px solid #eee' }} />
              <span style={{ fontSize: 16, color: '#111827' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for POI events */}
      {modal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.35)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setModal(null)}>
          <div style={{
            background: '#fff', borderRadius: 16, boxShadow: '0 2px 24px #3335', padding: 15, minWidth: 340, maxWidth: 420, position: 'relative',
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setModal(null)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>&times;</button>
            <h2 style={{ margin: '8px 0 16px 0', fontSize: 22, color: '#374151' }}>{modal.poi.nom}</h2>
            <img src={placeholderImages[imgIdx]} alt="event" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
            {modal.events.map(ev => (
              <div key={ev.id} style={{ marginBottom: 18, borderBottom: '1px solid #eee', paddingBottom: 10}}>
                <div style={{ fontWeight: 600, fontSize: 18, color: '#374151' }}>{ev.titre}</div>
                <div style={{ fontSize: 14, color: '#374151', margin: '6px 0' }}>{ev.description?.slice(0, 80) || ''}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 6px 0' }}>
                  {ev.date_debut && (
                    <>
                      <span>Débute: {new Date(ev.date_debut).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span><br />
                    </>
                  )}
                  {ev.date_fin && (
                    <span>Fin: {new Date(ev.date_fin).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  )}
                </div>
                <a href={`/events/${ev.id}`} style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 8,
                  padding: '12px 0',
                  background: '#6c5ce7',
                  color: '#fff',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 500,
                  textAlign: 'center',
                }}>Voir tous les détails</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}