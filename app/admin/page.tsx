'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Ev = {
    id: number
    titre: string
    categorie: string
    date_debut: string
}

export default function AdminPage() {
    const [events, setEvents] = useState<Ev[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState('')

    useEffect(() => {
        let aborted = false
        async function load() {
            try {
                setLoading(true)
                setErr('')
                const r = await fetch('/api/events')
                if (!r.ok) throw new Error()
                const data: Ev[] = await r.json()
                if (!aborted) setEvents(data)
            } catch {
                if (!aborted) setErr('Impossible de charger les événements')
            } finally {
                if (!aborted) setLoading(false)
            }
        }
        load()
        return () => { aborted = true }
    }, [])

    async function remove(id: number) {
        const prev = events
        setEvents(prev.filter(e => e.id !== id))
        try {
            const r = await fetch(`/api/events/${id}`, { method: 'DELETE' })
            if (!r.ok) throw new Error()
        } catch {
            setEvents(prev)
        }
    }

    return (
        <main className="relative min-h-screen bg-slate-50">
            <section className="relative h-[32svh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_15%_0%,rgba(168,85,247,.18),transparent_60%),radial-gradient(40%_35%_at_100%_100%,rgba(59,130,246,.18),transparent_55%),linear-gradient(180deg,#0b0f1a,#0b0f1a)]" />
                <h1 className="relative z-10 text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                    Administration
                </h1>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block w-full h-20 text-slate-50 rotate-180" fill="currentColor">
                        <path d="M0 0h1200v46.29c-141.69 9.86-281.45 46.08-422.54 46.08-140.06 0-263.63-36.09-403.1-36.09C259.23 56.28 130.8 76.05 0 86.6V0z" />
                    </svg>
                </div>
            </section>

            <section className="py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-900">Gestion des événements</h2>
                            <p className="text-slate-600">Créer, éditer et supprimer des événements</p>
                        </div>
                        <Link
                            href="/admin/new"
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-900/20 hover:brightness-110"
                        >
                            + Créer un événement
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
                                    <div className="h-32 bg-slate-200 animate-pulse" />
                                    <div className="p-5 space-y-3">
                                        <div className="h-5 w-2/3 bg-slate-200 animate-pulse rounded" />
                                        <div className="h-4 w-1/3 bg-slate-200 animate-pulse rounded" />
                                        <div className="mt-2 h-9 w-full bg-slate-200 animate-pulse rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : err ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{err}</div>
                    ) : events.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                            <p className="text-slate-700 font-medium">Aucun événement pour l’instant.</p>
                            <p className="text-slate-500 mt-1">Crée le premier pour commencer.</p>
                            <Link
                                href="/admin/new"
                                className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow hover:brightness-110"
                            >
                                Créer un événement
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {events.map(ev => (
                                <article key={ev.id} className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden flex flex-col">
                                    <div className="h-32 bg-gradient-to-r from-slate-100 to-slate-200" />
                                    <div className="p-5 flex-1 flex flex-col gap-2">
                                        <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">{ev.titre}</h3>
                                        <p className="text-sm text-slate-600">{new Date(ev.date_debut).toLocaleString()}</p>
                                        <div className="mt-4 flex gap-2">
                                            <Link
                                                href={`/admin/edit/${ev.id}`}
                                                className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
                                            >
                                                Éditer
                                            </Link>
                                            <button
                                                onClick={() => remove(ev.id)}
                                                className="inline-flex items-center justify-center rounded-xl bg-rose-600 text-white px-4 py-2 text-sm hover:bg-rose-700"
                                            >
                                                Supprimer
                                            </button>
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
