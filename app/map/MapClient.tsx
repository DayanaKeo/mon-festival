'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

// ⚠️ Importer react-leaflet/leaflet côté client uniquement
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false });
const Marker        = dynamic(() => import('react-leaflet').then(m => m.Marker),        { ssr: false });
const Tooltip       = dynamic(() => import('react-leaflet').then(m => m.Tooltip),       { ssr: false });

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const placeholderImages = [
    'https://picsum.photos/seed/1/600/300',
    'https://picsum.photos/seed/2/600/300',
    'https://picsum.photos/seed/3/600/300',
    'https://picsum.photos/seed/4/600/300',
    'https://picsum.photos/seed/5/600/300',
];

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

function getCustomIcon(color: string) {
    const halo = (hex: string, a: number) => {
        const h = hex.replace('#', '');
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        return `rgba(${r},${g},${b},${a})`;
    };

    return L.divIcon({
        className: '',
        html: `
      <div style="width:64px;height:64px;background:${halo(color,0.25)};border-radius:50%;
                  display:flex;align-items:center;justify-content:center;">
        <div style="width:32px;height:32px;background:${color};border-radius:50%;
                    box-shadow:0 0 8px #888;"></div>
      </div>
    `,
        iconSize: [64, 64],
        iconAnchor: [32, 32],
        popupAnchor: [0, -32],
    });
}

export default function MapClient() {
    const [events, setEvents] = useState<any[]>([]);
    const [modal, setModal] = useState<{ poi: any; events: any[] } | null>(null);
    const [imgIdx, setImgIdx] = useState(0);

    useEffect(() => {
        fetch('/api/events').then(r => r.json()).then(setEvents);
    }, []);

    const pois = useMemo(() => {
        const g: Record<string, { poi: any; events: any[] }> = {};
        for (const ev of events) {
            if (ev?.poi) {
                const id = ev.poi.id;
                if (!g[id]) g[id] = { poi: ev.poi, events: [] };
                g[id].events.push(ev);
            }
        }
        return g;
    }, [events]);

    const handleMarkerClick = (poi: any, evs: any[]) => {
        setImgIdx(Math.floor(Math.random() * placeholderImages.length));
        setModal({ poi, events: evs });
    };

    // centre par défaut (Rouen, ex) si pas de points
    const center: [number, number] = [49.443, 1.099];

    return (
        <div style={{ width: '55%', background: '#fff', borderRadius: 16, padding: '14px 22px', marginTop: 16 }}>
            <div style={{ position: 'relative', width: '100%', height: 400, borderRadius: 16, overflow: 'hidden' }}>
                <MapContainer center={center} zoom={17} style={{ height: '100%', width: '100%', borderRadius: 16, filter: 'brightness(1.15) grayscale(0.2)' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {Object.values(pois).map(({ poi, events }) => {
                        const lat = Number(poi.latitude);
                        const lng = Number(poi.longitude);
                        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                        return (
                            <Marker
                                key={poi.id}
                                position={[lat, lng]}
                                icon={getCustomIcon(poiColors[poi.nom] || '#888')}
                                eventHandlers={{ click: () => handleMarkerClick(poi, events) }}
                            >
                                <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                                    <div style={{ textAlign: 'center', maxWidth: 90 }}>
                                        <strong style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                            {poi.nom}
                                        </strong>
                                        <br />
                                        {events.map((ev: any) => (
                                            <div key={ev.id} style={{ fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>
                                                {ev.titre}
                                            </div>
                                        ))}
                                    </div>
                                </Tooltip>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>

            {/* Légende */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, marginTop: 32, justifyContent: 'center', width: '100%' }}>
                {legend.map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
                        <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: '50%', background: item.color, marginRight: 8, border: '2px solid #eee' }} />
                        <span style={{ fontSize: 16, color: '#111827' }}>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modal && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setModal(null)}
                >
                    <div
                        style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 24px #3335', padding: 15, minWidth: 340, maxWidth: 420, position: 'relative' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setModal(null)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>
                            &times;
                        </button>
                        <h2 style={{ margin: '8px 0 16px 0', fontSize: 22, color: '#374151' }}>{modal.poi.nom}</h2>
                        <img src={placeholderImages[imgIdx]} alt="event" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
                        {modal.events.map(ev => (
                            <div key={ev.id} style={{ marginBottom: 18, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                                <div style={{ fontWeight: 600, fontSize: 18, color: '#374151' }}>{ev.titre}</div>
                                <div style={{ fontSize: 14, color: '#374151', margin: '6px 0' }}>{ev.description?.slice(0, 80) || ''}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 6px 0' }}>
                                    {ev.date_debut && <><span>Débute: {new Date(ev.date_debut).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span><br /></>}
                                    {ev.date_fin && <span>Fin: {new Date(ev.date_fin).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                                </div>
                                <a href={`/events/${ev.id}`} style={{
                                    display: 'block', width: '100%', marginTop: 8, padding: '12px 0',
                                    background: '#6c5ce7', color: '#fff', borderRadius: 8, textDecoration: 'none',
                                    fontWeight: 500, textAlign: 'center'
                                }}>
                                    Voir tous les détails
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
