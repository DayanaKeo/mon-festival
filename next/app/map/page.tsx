'use client';
import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('./MapClient'), { ssr: false });

export default function MapPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(60%_40%_at_15%_0%,rgba(168,85,247,.18),transparent_60%),radial-gradient(40%_35%_at_100%_100%,rgba(59,130,246,.18),transparent_55%),linear-gradient(180deg,#0b0f1a,#0b0f1a)]">
            <div className="relative z-10 mx-auto max-w-6xl px-5 py-10">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-extrabold tracking-tight text-white">Carte interactive du festival</h1>
                    <p className="mt-1 text-sm text-white/70">
                        Explore le site du festival et localise tous les points d’intérêt
                    </p>
                </div>
                <MapClient />
            </div>
        </div>
    );
}