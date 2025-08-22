'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

type FavRow = {
    utilisateur_id: number
    evenement_id: number
    createdAt: string
}

type Ev = {
    id: number
    titre: string
    categorie: string
    date_debut: string
    genres?: { genre: { nom: string } }[]
    artistes?: { artiste: { nom: string } }[]
}

function imgFor(cat: string) {
    if (cat === 'CONCERT') return 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?q=80&w=1600&auto=format&fit=crop'
    if (cat === 'CONFERENCE') return 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop'
    if (cat === 'ACTIVITE') return 'https://images.unsplash.com/photo-1531339094860-cc4e8fdd7b0d?q=80&w=1600&auto=format&fit=crop'
    return 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?q=80&w=1600&auto=format&fit=crop'
}
function Pill({ cat }: { cat: string }) {
    const color =
        cat === 'ACTIVITE' ? 'bg-emerald-600' :
            cat === 'CONFERENCE' ? 'bg-sky-600' : 'bg-fuchsia-600'
    return (
        <span className={`absolute left-4 top-4 ${color} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
      {cat}
    </span>
    )
}

export default function FavoritesPage() {
    const { status } = useSession()
    const router = useRouter()
    const [list, setList] = useState<Ev[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState('')

    // si pas connecté → login
    useEffect(() => {
        if (status === 'unauthenticated') router.replace('/login?returnTo=/favorites')
    }, [status, router])

    // charge favoris -> récupère les events
    useEffect(() => {
        if (status !== 'authenticated') return
        let aborted = false
        async function load() {
            try {
                setLoading(true)
                setErr('')

                const favRes = await fetch('/api/favorites')
                if (!favRes.ok) throw new Error()
                const favs: FavRow[] = await favRes.json()

                // déduplique les IDs d'événements
                const ids = Array.from(new Set(favs.map(f => Number(f.evenement_id)).filter(Boolean)))
                if (ids.length === 0) {
                    if (!aborted) setList([])
                    return
                }

                // Récupère chaque event en parallèle
                const events = await Promise.all(
                    ids.map(async (id) => {
                        try {
                            const r = await fetch(`/api/events/${id}`)
                            if (!r.ok) return null
                            const ev: Ev = await r.json()
                            // sécurité : vérifie les champs essentiels
                            if (!ev || !ev.id || !ev.titre) return null
                            return ev
                        } catch {
                            return null
                        }
                    })
                )

                if (!aborted) setList(events.filter(Boolean) as Ev[])
            } catch {
                if (!aborted) setErr('Impossible de charger vos favoris')
            } finally {
                if (!aborted) setLoading(false)
            }
        }
        load()
        return () => { aborted = true }
    }, [status])

    // suppression (optimiste)
    async function removeFav(eventId: number) {
        const prev = list
        setList(prev.filter(e => e.id !== eventId))
        try {
            const r = await fetch(`/api/favorites?eventId=${eventId}`, { method: 'DELETE' })
            if (!r.ok) throw new Error()
        } catch {
            setList(prev) // rollback
        }
    }

    return (
        <main className="relative min-h-screen bg-slate-50">
            {/* header */}
            <section className="relative h-[36svh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_15%_0%,rgba(168,85,247,.18),transparent_60%),radial-gradient(40%_35%_at_100%_100%,rgba(59,130,246,.18),transparent_55%),linear-gradient(180deg,#0b0f1a,#0b0f1a)]" />
                <h1 className="relative z-10 text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                    Mes favoris
                </h1>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block w-full h-20 text-slate-50 rotate-180" fill="currentColor">
                        <path d="M0 0h1200v46.29c-141.69 9.86-281.45 46.08-422.54 46.08-140.06 0-263.63-36.09-403.1-36.09C259.23 56.28 130.8 76.05 0 86.6V0z" />
                    </svg>
                </div>
            </section>

            <section className="py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-900">Vos événements sauvegardés</h2>
                            <p className="text-slate-600">Retrouvez ici tout ce que vous avez aimé</p>
                        </div>
                        <Link href="/events" className="text-violet-700 hover:underline">Explorer les événements</Link>
                    </div>

                    {status !== 'authenticated' ? null : loading ? (
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
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
                    ) : err ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                            {err}
                        </div>
                    ) : list.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                            <p className="text-slate-700 font-medium">Aucun favori pour l’instant.</p>
                            <p className="text-slate-500 mt-1">Ajoutez-en depuis la page d’un événement.</p>
                            <Link href="/events" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow hover:brightness-110">
                                Voir les événements
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                            {list.map((ev) => (
                                <article
                                    key={ev.id} // clé OK maintenant
                                    className="group relative rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(2,6,23,.08)] bg-white ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(2,6,23,.12)]"
                                >
                                    <div className="relative h-48">
                                        <img src={imgFor(ev.categorie)} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                                        <Pill cat={ev.categorie} />
                                        <button
                                            onClick={() => removeFav(ev.id)}
                                            className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow hover:bg-white"
                                            title="Retirer des favoris"
                                        >
                                            Retirer
                                        </button>
                                    </div>
                                    <div className="p-5 space-y-2">
                                        <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">{ev.titre}</h3>
                                        <p className="text-sm text-slate-600">
                                            {new Date(ev.date_debut).toLocaleString()}
                                        </p>
                                        {(ev.genres?.length || 0) > 0 && (
                                            <p className="text-sm text-slate-700">
                                                Genres : {ev.genres!.map(g => g.genre.nom).join(', ')}
                                            </p>
                                        )}
                                        {(ev.artistes?.length || 0) > 0 && (
                                            <p className="text-sm text-slate-700">
                                                Artistes : {ev.artistes!.map(a => a.artiste.nom).join(', ')}
                                            </p>
                                        )}
                                        <div className="pt-2">
                                            <Link
                                                href={`/events/${ev.id}`}
                                                className="inline-block rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
                                            >
                                                Voir le détail
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}
