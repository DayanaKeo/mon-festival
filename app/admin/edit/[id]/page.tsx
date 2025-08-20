'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Meta = {
    artistes: { id: number; nom: string }[]
    genres: { id: number; nom: string }[]
    lieux: { id: number; nom: string }[]
    pois: { id: number; nom: string }[]
}

function toLocal(dt: string) {
    const d = new Date(dt)
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    return z.toISOString().slice(0, 16)
}

export default function EditEventPage() {
    const router = useRouter()
    const params = useParams() as { id: string }
    const [meta, setMeta] = useState<Meta>({ artistes: [], genres: [], lieux: [], pois: [] })
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState('')
    const [form, setForm] = useState<any>(null)

    useEffect(() => {
        Promise.all([
            fetch('/api/meta').then(r => r.json()),
            fetch(`/api/events/${params.id}`).then(r => r.json())
        ])
            .then(([m, ev]) => {
                setMeta(m)
                setForm({
                    titre: ev.titre || '',
                    description: ev.description || '',
                    categorie: ev.categorie,
                    date_debut: toLocal(ev.date_debut),
                    date_fin: toLocal(ev.date_fin),
                    statut: ev.statut,
                    capacite: ev.capacite ?? '',
                    lieu_id: ev.lieu_id ?? '',
                    poi_id: ev.poi_id ?? '',
                    artiste_ids: (ev.artistes || []).map((x: any) => String(x.artiste_id)),
                    genre_ids: (ev.genres || []).map((x: any) => String(x.genre_id))
                })
                setLoading(false)
            })
            .catch(() => { setMsg('Impossible de charger la fiche'); setLoading(false) })
    }, [params.id])

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setMsg('')
        const body = {
            ...form,
            capacite: form.capacite ? Number(form.capacite) : null,
            lieu_id: form.lieu_id ? Number(form.lieu_id) : null,
            poi_id: form.poi_id ? Number(form.poi_id) : null,
            artiste_ids: form.artiste_ids.map((x: string) => Number(x)),
            genre_ids: form.genre_ids.map((x: string) => Number(x))
        }
        const res = await fetch(`/api/events/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (res.ok) router.push('/admin')
        else { const d = await res.json(); setMsg(d.error || 'Erreur') }
    }

    return (
        <main className="relative min-h-screen bg-[#0b0f1a] text-white">
            <section className="relative h-[28svh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_15%_0%,rgba(168,85,247,.18),transparent_60%),radial-gradient(40%_35%_at_100%_100%,rgba(59,130,246,.18),transparent_55%),linear-gradient(180deg,#0b0f1a,#0b0f1a)]" />
                <h1 className="relative z-10 text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                    Éditer l’événement
                </h1>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block w-full h-20 text-[#0b0f1a] rotate-180" fill="currentColor">
                        <path d="M0 0h1200v46.29c-141.69 9.86-281.45 46.08-422.54 46.08-140.06 0-263.63-36.09-403.1-36.09C259.23 56.28 130.8 76.05 0 86.6V0z" />
                    </svg>
                </div>
            </section>

            <section className="py-10">
                <div className="max-w-5xl mx-auto px-6">
                    {msg && (
                        <div className="mb-6 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-rose-200">{msg}</div>
                    )}

                    <div className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 shadow-[0_10px_30px_rgba(2,6,23,.35)] backdrop-blur-sm">
                        {loading || !form ? (
                            <div className="p-8 grid gap-6 md:grid-cols-2">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="h-12 bg-white/10 animate-pulse rounded-xl" />
                                ))}
                                <div className="md:col-span-2 h-28 bg-white/10 animate-pulse rounded-xl" />
                                <div className="md:col-span-2 h-12 bg-white/10 animate-pulse rounded-xl" />
                            </div>
                        ) : (
                            <form onSubmit={submit} className="p-8 grid gap-6 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <input
                                        className="w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/50 px-4 py-3 outline-none focus:border-violet-400/60"
                                        value={form.titre}
                                        onChange={e => setForm({ ...form, titre: e.target.value })}
                                        placeholder="Titre"
                                        required
                                    />
                                </div>

                                <div>
                                    <select
                                        className="w-full rounded-xl border border-white/15 bg-white/10 text-white px-4 py-3 outline-none focus:border-violet-400/60"
                                        value={form.categorie}
                                        onChange={e => setForm({ ...form, categorie: e.target.value })}
                                    >
                                        <option className="bg-[#0b0f1a]" value="CONCERT">CONCERT</option>
                                        <option className="bg-[#0b0f1a]" value="CONFERENCE">CONFERENCE</option>
                                        <option className="bg-[#0b0f1a]" value="STAND">STAND</option>
                                        <option className="bg-[#0b0f1a]" value="ACTIVITE">ACTIVITE</option>
                                    </select>
                                </div>
                                <div>
                                    <select
                                        className="w-full rounded-xl border border-white/15 bg-white/10 text-white px-4 py-3 outline-none focus:border-violet-400/60"
                                        value={form.statut}
                                        onChange={e => setForm({ ...form, statut: e.target.value })}
                                    >
                                        <option className="bg-[#0b0f1a]" value="PUBLIE">PUBLIE</option>
                                        <option className="bg-[#0b0f1a]" value="BROUILLON">BROUILLON</option>
                                        <option className="bg-[#0b0f1a]" value="REPORTE">REPORTE</option>
                                        <option className="bg-[#0b0f1a]" value="ANNULE">ANNULE</option>
                                    </select>
                                </div>

                                <div>
                                    <input
                                        type="datetime-local"
                                        className="w-full rounded-xl border border-white/15 bg-white/10 text-white px-4 py-3 outline-none focus:border-violet-400/60"
                                        value={form.date_debut}
                                        onChange={e => setForm({ ...form, date_debut: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <input
                                        type="datetime-local"
                                        className="w-full rounded-xl border border-white/15 bg-white/10 text-white px-4 py-3 outline-none focus:border-violet-400/60"
                                        value={form.date_fin}
                                        onChange={e => setForm({ ...form, date_fin: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <input
                                        type="number"
                                        className="w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/50 px-4 py-3 outline-none focus:border-violet-400/60"
                                        value={form.capacite}
                                        onChange={e => setForm({ ...form, capacite: e.target.value })}
                                        placeholder="Capacité"
                                    />
                                </div>
                                <div>
                                    <select
                                        className="w-full rounded-xl border border-white/15 bg-white/10 text-white px-4 py-3 outline-none focus:border-violet-400/60"
                                        value={form.lieu_id}
                                        onChange={e => setForm({ ...form, lieu_id: e.target.value })}
                                    >
                                        <option className="bg-[#0b0f1a]" value="">Lieu</option>
                                        {meta.lieux.map(l => <option className="bg-[#0b0f1a]" key={l.id} value={l.id}>{l.nom}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <select
                                        className="w-full rounded-xl border border-white/15 bg-white/10 text-white px-4 py-3 outline-none focus:border-violet-400/60"
                                        value={form.poi_id}
                                        onChange={e => setForm({ ...form, poi_id: e.target.value })}
                                    >
                                        <option className="bg-[#0b0f1a]" value="">Point d'intérêt</option>
                                        {meta.pois.map(p => <option className="bg-[#0b0f1a]" key={p.id} value={p.id}>{p.nom}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-white/80">Artistes</label>
                                    <select
                                        multiple
                                        className="w-full h-36 rounded-xl border border-white/15 bg-white/10 text-white px-3 py-2 outline-none focus:border-violet-400/60"
                                        value={form.artiste_ids}
                                        onChange={e => setForm({ ...form, artiste_ids: Array.from(e.target.selectedOptions).map(o => o.value) })}
                                    >
                                        {meta.artistes.map(a => <option className="bg-[#0b0f1a]" key={a.id} value={a.id}>{a.nom}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-white/80">Genres</label>
                                    <select
                                        multiple
                                        className="w-full h-36 rounded-xl border border-white/15 bg-white/10 text-white px-3 py-2 outline-none focus:border-violet-400/60"
                                        value={form.genre_ids}
                                        onChange={e => setForm({ ...form, genre_ids: Array.from(e.target.selectedOptions).map(o => o.value) })}
                                    >
                                        {meta.genres.map(g => <option className="bg-[#0b0f1a]" key={g.id} value={g.id}>{g.nom}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                  <textarea
                      className="w-full min-h-[120px] rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/50 px-4 py-3 outline-none focus:border-violet-400/60"
                      placeholder="Description"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                                </div>

                                <div className="md:col-span-2 flex gap-3 pt-2">
                                    <button className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg hover:brightness-110">
                                        Enregistrer
                                    </button>
                                    <Link href="/admin" className="rounded-xl border border-white/20 px-5 py-3 text-white hover:bg-white/10">
                                        Annuler
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}
