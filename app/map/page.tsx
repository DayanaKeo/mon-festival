'use client';
import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('./MapClient'), { ssr: false });

export default function MapPage() {
    return (
        <div
            style={{
                minHeight: '100vh',
                background:
                    'radial-gradient(ellipse at top left, rgba(168,85,247,0.13) 0%, rgba(2,6,23,1) 60%)',
                backgroundColor: '#020617',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: 0,
                position: 'relative',
                overflow: 'hidden',
                paddingBottom: 32,
            }}
        >
            <div style={{ pointerEvents: 'none', position: 'absolute', top: -80, left: -80, height: 288, width: 288, borderRadius: '50%', background: 'rgba(192,38,211,0.3)', filter: 'blur(48px)' }} />
            <div style={{ pointerEvents: 'none', position: 'absolute', bottom: -96, right: -96, height: 320, width: 320, borderRadius: '50%', background: 'rgba(79,70,229,0.3)', filter: 'blur(48px)' }} />
            <h1 className="from-violet-300 via-fuchsia-300 to-pink-300 text-2xl" style={{ fontSize: 24, fontWeight: 'bold' }}>
                Carte interactive du festival
            </h1>
            <p>Explorez le site du festival et localisez tous les points d&apos;intérêt</p>

            {/* Carte client-only */}
            <MapClient />
        </div>
    );
}
