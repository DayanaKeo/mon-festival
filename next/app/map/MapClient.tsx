'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

// react-leaflet côté client
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false });
const Marker        = dynamic(() => import('react-leaflet').then(m => m.Marker),        { ssr: false });
const Tooltip       = dynamic(() => import('react-leaflet').then(m => m.Tooltip),       { ssr: false });

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Placeholder images pour la modale
const placeholderImages = [
    'https://picsum.photos/seed/1/600/300',
    'https://picsum.photos/seed/2/600/300',
    'https://picsum.photos/seed/3/600/300',
    'https://picsum.photos/seed/4/600/300',
    'https://picsum.photos/seed/5/600/300',
];

// libellés + couleurs par TypePOI
const TYPE_LABEL: Record<string, string> = {
    SCENE: 'Scènes',
    STAND: 'Stands',
    INFO: 'Info',
    TOILETTES: 'Toilettes',
    RESTAURATION: 'Restauration',
    ENTREE: 'Entrées',
    AUTRE: 'Autre',
    SANS_POI: 'Sans POI',
};

const TYPE_COLOR: Record<string, string> = {
    SCENE: '#9b59b6',
    STAND: '#00b894',
    INFO: '#fdcb6e',
    TOILETTES: '#6c5ce7',
    RESTAURATION: '#e67e22',
    ENTREE: '#e74c3c',
    AUTRE: '#8e44ad',
    SANS_POI: '#6c5ce7',
    DEFAULT: '#6c5ce7',
};

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

type Spot = {
    id: string;                // "poi-12" | "lieu-4"
    typeKey: string;           // TypePOI ou "SANS_POI"
    nom: string;
    latitude: number;
    longitude: number;
};

export default function MapClient() {
    const [events, setEvents] = useState<any[]>([]);
    const [modal, setModal] = useState<{ spot: Spot; events: any[] } | null>(null);
    const [imgIdx, setImgIdx] = useState(0);

    useEffect(() => {
        fetch('/api/events')
            .then(r => r.json())
            .then(setEvents);
    }, []);

    // Construire les spots : priorité POI, sinon Lieu (type SANS_POI)
    const { spotsMap, typesPresentOrdered } = useMemo(() => {
        const map: Record<string, { spot: Spot; events: any[] }> = {};
        const typeSet = new Set<string>();
        let hasSansPoi = false;

        for (const ev of events) {
            const poi = ev?.poi ?? null;
            const lieu = ev?.lieu ?? null;

            let spot: Spot | null = null;

            if (poi && Number.isFinite(Number(poi.latitude)) && Number.isFinite(Number(poi.longitude))) {
                const key = String(poi.type || 'AUTRE').toUpperCase();
                spot = {
                    id: `poi-${poi.id}`,
                    typeKey: key,
                    nom: poi.nom ?? TYPE_LABEL[key] ?? 'Point d’intérêt',
                    latitude: Number(poi.latitude),
                    longitude: Number(poi.longitude),
                };
                typeSet.add(spot.typeKey);
            } else if (lieu && Number.isFinite(Number(lieu.latitude)) && Number.isFinite(Number(lieu.longitude))) {
                spot = {
                    id: `lieu-${lieu.id}`,
                    typeKey: 'SANS_POI',
                    nom: lieu.nom ?? 'Lieu',
                    latitude: Number(lieu.latitude),
                    longitude: Number(lieu.longitude),
                };
                hasSansPoi = true;
            }

            if (!spot) continue;
            if (!map[spot.id]) map[spot.id] = { spot, events: [] };
            map[spot.id].events.push(ev);
        }

        // Ordre sympa pour les filtres
        const priority = ['SCENE', 'CONFERENCE', 'STAND', 'ACTIVITE', 'INFO', 'TOILETTES', 'RESTAURATION', 'ENTREE', 'AUTRE'];
        const present = priority.filter(t => typeSet.has(t));
        // Ajouter "SANS_POI" en dernier uniquement s’il existe
        if (hasSansPoi) present.push('SANS_POI');

        return { spotsMap: map, typesPresentOrdered: present };
    }, [events]);

    // État des filtres (tout actif par défaut)
    const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
    useEffect(() => {
        setActiveTypes(new Set(typesPresentOrdered));
    }, [typesPresentOrdered]);

    const toggleType = (t: string) => {
        setActiveTypes(prev => {
            const next = new Set(prev);
            if (next.has(t)) next.delete(t);
            else next.add(t);
            // éviter d’avoir 0 filtre actif → si vide, on remet tous
            if (next.size === 0) return new Set(typesPresentOrdered);
            return next;
        });
    };

    const center: [number, number] = [49.443, 1.099];

    const visibleSpots = Object.values(spotsMap).filter(({ spot }) => activeTypes.has(spot.typeKey));

    return (
        <div className="w-full max-w-5xl">
            {/* Carte dans une carte glass */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_rgba(0,0,0,.35)] backdrop-blur-xl">
                <div className="relative h-[520px] w-full overflow-hidden rounded-2xl">
                    <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {visibleSpots.map(({ spot, events }) => (
                            <Marker
                                key={spot.id}
                                position={[spot.latitude, spot.longitude]}
                                icon={getCustomIcon(TYPE_COLOR[spot.typeKey] ?? TYPE_COLOR.DEFAULT)}
                                eventHandlers={{ click: () => { setImgIdx(Math.floor(Math.random() * placeholderImages.length)); setModal({ spot, events }); } }}
                            >
                                <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                                    <div style={{ textAlign: 'center', maxWidth: 140 }}>
                                        <strong style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                            {spot.nom}
                                        </strong>
                                        <br />
                                        {events.map(ev => (
                                            <div key={ev.id} style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                                                {ev.titre}
                                            </div>
                                        ))}
                                    </div>
                                </Tooltip>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* Filtres dynamiques */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                    {typesPresentOrdered.map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => toggleType(t)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition
                ${activeTypes.has(t)
                                ? 'border-white/20 bg-white/10 text-white'
                                : 'border-white/10 bg-white/5 text-white/60 hover:text-white'}`}
                            title={TYPE_LABEL[t] ?? t}
                        >
              <span
                  className="inline-block h-3.5 w-3.5 rounded-full"
                  style={{ background: TYPE_COLOR[t] ?? TYPE_COLOR.DEFAULT, border: '2px solid rgba(255,255,255,.5)' }}
              />
                            <span>{TYPE_LABEL[t] ?? t}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Modale */}
            {modal && (
                <div
                    className="fixed inset-0 z-[1000] grid place-items-center bg-black/50 p-4"
                    onClick={() => setModal(null)}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setModal(null)}
                            className="absolute right-3 top-2 text-2xl leading-none text-neutral-500 hover:text-neutral-700"
                        >
                            &times;
                        </button>
                        <h2 className="mb-3 mt-1 text-xl font-semibold text-neutral-800">{modal.spot.nom}</h2>
                        <img
                            src={placeholderImages[imgIdx]}
                            alt="event"
                            className="mb-4 h-44 w-full rounded-xl object-cover"
                        />
                        <div className="space-y-4">
                            {modal.events.map(ev => (
                                <div key={ev.id} className="border-b pb-3 last:border-b-0">
                                    <div className="font-medium text-neutral-800">{ev.titre}</div>
                                    {ev.description && (
                                        <div className="mt-1 text-sm text-neutral-600">
                                            {String(ev.description).slice(0, 120)}
                                            {String(ev.description).length > 120 ? '…' : ''}
                                        </div>
                                    )}
                                    <div className="mt-1 text-xs text-neutral-500">
                                        {ev.date_debut && <>Débute&nbsp;: {new Date(ev.date_debut).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}<br /></>}
                                        {ev.date_fin && <>Fin&nbsp;: {new Date(ev.date_fin).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</>}
                                    </div>
                                    <a
                                        href={`/events/${ev.id}`}
                                        className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:brightness-110"
                                    >
                                        Voir les détails
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
