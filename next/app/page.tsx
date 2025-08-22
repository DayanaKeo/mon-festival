'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

type Ev = {
    id:number
    titre:string
    categorie:'CONCERT'|'CONFERENCE'|'ACTIVITE'|string
    date_debut:string
    genres?:{ genre:{ nom:string } }[]
    artistes?:{ artiste:{ nom:string } }[]
}

const IMG_POOL: Record<string, string[]> = {
    CONCERT: [
        'https://images.unsplash.com/photo-1519677100203-a0e668c92439?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1600&auto=format&fit=crop',
    ],
    CONFERENCE: [
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1600&auto=format&fit=crop',
    ],
    ACTIVITE: [
        'https://images.unsplash.com/photo-1531339094860-cc4e8fdd7b0d?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1514511547117-f9c1ae0f3d62?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1520975922284-9d06a87f7a32?q=80&w=1600&auto=format&fit=crop',
    ],
    DEFAULT: [
        'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop',
    ],
}
const IMG_FALLBACK =
    'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?q=80&w=1600&auto=format&fit=crop'

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

function assignUniqueImages(evs: Ev[]): Map<number, string> {
    const used = new Set<string>()
    const map = new Map<number, string>()
    evs.forEach((ev) => {
        const pool = IMG_POOL[ev.categorie] ?? IMG_POOL.DEFAULT
        const candidates = shuffle(pool)
        const chosen = candidates.find((u) => !used.has(u)) ?? candidates[0] ?? IMG_FALLBACK
        used.add(chosen)
        map.set(ev.id, chosen)
    })
    return map
}

function SmartImg({
                      src,
                      alt,
                      className,
                  }: {
    src: string
    alt: string
    className?: string
}) {
    const [s, setS] = useState(src)
    useEffect(() => setS(src), [src])
    return <img src={s} alt={alt} onError={() => setS(IMG_FALLBACK)} className={className} />
}

function EventCard({ ev, img }: { ev: Ev; img: string }) {
    const start = new Date(ev.date_debut).toLocaleString()
    const pill =
        ev.categorie === 'ACTIVITE'
            ? 'bg-emerald-600'
            : ev.categorie === 'CONFERENCE'
                ? 'bg-sky-600'
                : 'bg-fuchsia-600'

    return (
        <Link
            href={`/events/${ev.id}`}
            className="group relative rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(2,6,23,.08)] bg-white ring-1 ring-slate-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(2,6,23,.12)] transition"
        >
            <div className="relative h-48">
                <SmartImg src={img} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <span className={`absolute left-4 top-4 ${pill} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
          {ev.categorie}
        </span>
            </div>
            <div className="p-5 space-y-2">
                <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">{ev.titre}</h3>
                <p className="text-sm text-slate-600">{start}</p>
                {(ev.genres?.length || 0) > 0 && (
                    <p className="text-sm text-slate-700">Genres : {ev.genres!.map((g) => g.genre.nom).join(', ')}</p>
                )}
                {(ev.artistes?.length || 0) > 0 && (
                    <p className="text-sm text-slate-700">Artistes : {ev.artistes!.map((a) => a.artiste.nom).join(', ')}</p>
                )}
            </div>
        </Link>
    )
}

function HeroVideo() {
    const ref = useRef<HTMLVideoElement>(null)
    useEffect(() => {
        const v = ref.current
        if (!v) return
        const play = () => v.play().catch(() => {})
        v.addEventListener('canplay', play)
        play()
        return () => v.removeEventListener('canplay', play)
    }, [])
    return (
        <>
            <video
                ref={ref}
                className="absolute inset-0 z-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster="https://images.unsplash.com/photo-1519677100203-a0e668c92439?q=80&w=1400&auto=format&fit=crop"
            >
                <source src="/videos/festival.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 z-10 bg-black/25 backdrop-blur-[1.5px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20">
                <svg
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    className="block w-full h-24 text-slate-50 transform rotate-180"
                    fill="currentColor"
                >
                    <path d="M0 0h1200v46.29c-141.69 9.86-281.45 46.08-422.54 46.08-140.06 0-263.63-36.09-403.1-36.09C259.23 56.28 130.8 76.05 0 86.6V0z" />
                </svg>
            </div>
        </>
    )
}

export default function HomePage() {
    const [events, setEvents] = useState<Ev[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/events')
            .then((r) => r.json())
            .then((all: Ev[]) => {
                const shuffled = shuffle(all)
                const pick3 = shuffled.slice(0, 3)
                setEvents(pick3)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const imageMap = useMemo(() => assignUniqueImages(events), [events])

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="relative h-[90vh] flex items-center justify-center text-center overflow-hidden">
                <HeroVideo />
                <div className="relative z-30 max-w-5xl px-6">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_8px_30px_rgba(0,0,0,.45)]">
                        Événements du Festival
                    </h1>
                    <p className="mt-5 text-xl md:text-2xl text-white/95 max-w-3xl mx-auto">
                        Découvrez tous les moments forts de cette édition exceptionnelle
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/events"
                            className="px-7 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition"
                        >
                            Voir les événements
                        </Link>
                        <Link
                            href="/artistes"
                            className="px-7 py-3 rounded-full bg-white/15 border border-white/30 text-white backdrop-blur-md hover:bg-white/25 transition"
                        >
                            Les Artistes
                        </Link>
                        <Link
                            href="/map"
                            className="px-7 py-3 rounded-full bg-white/15 border border-white/30 text-white backdrop-blur-md hover:bg-white/25 transition"
                        >
                            Carte interactive
                        </Link>
                        <Link
                            href="/favorites"
                            className="px-7 py-3 rounded-full bg-white/15 border border-white/30 text-white backdrop-blur-md hover:bg-white/25 transition"
                        >
                            Mes favoris
                        </Link>
                    </div>
                </div>
            </section>

            <section className="pt-10 pb-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900">À l’affiche</h2>
                            <p className="text-slate-600">Les prochains événements</p>
                        </div>
                        <Link href="/events" className="text-violet-700 hover:underline">
                            Tout voir
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="rounded-3xl overflow-hidden bg-white ring-1 ring-slate-200 shadow-sm">
                                    <div className="h-48 w-full bg-slate-200 animate-pulse" />
                                    <div className="p-5 space-y-3">
                                        <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
                                        <div className="h-5 w-3/4 bg-slate-200 animate-pulse rounded" />
                                        <div className="h-4 w-1/2 bg-slate-200 animate-pulse rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                            {events.map((ev) => (
                                <EventCard key={ev.id} ev={ev} img={imageMap.get(ev.id) ?? IMG_FALLBACK} />
                            ))}
                        </div>
                    )}

                    <div className="mt-14 grid gap-6 md:grid-cols-3">
                        <div className="rounded-3xl p-6 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg">
                            <h3 className="text-lg font-semibold">Ambiance & Scènes</h3>
                            <p className="mt-1 text-white/90 text-sm">Plusieurs scènes, du rock à l’électro, du matin jusqu’au bout de la nuit.</p>
                        </div>
                        <div className="rounded-3xl p-6 bg-white shadow-lg ring-1 ring-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900">Food & Stands</h3>
                            <p className="mt-1 text-slate-700 text-sm">Sélection de foodtrucks, boissons locales et stands partenaires.</p>
                        </div>
                        <div className="rounded-3xl p-6 bg-white shadow-lg ring-1 ring-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900">Accessibilité</h3>
                            <p className="mt-1 text-slate-700 text-sm">Accès PMR, parkings dédiés et zones détente signalées.</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t bg-white">
                <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-slate-600">© {new Date().getFullYear()} Aurora Fest</p>
                    <div className="flex gap-6 text-slate-700">
                        <Link href="/events" className="hover:text-slate-900">Événements</Link>
                        <Link href="/map" className="hover:text-slate-900">Carte</Link>
                        <Link href="/favorites" className="hover:text-slate-900">Mes favoris</Link>
                    </div>
                </div>
            </footer>
        </main>
    )
}
