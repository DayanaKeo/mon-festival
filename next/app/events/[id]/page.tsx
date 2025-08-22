"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"

// ——— Types légers ———
type Ev = {
    id: number
    titre: string
    description: string | null
    categorie: string
    date_debut: string
    date_fin: string
    genres: { genre: { id: number; nom: string } }[]
    artistes: { artiste: { id: number; nom: string } }[]
    lieu?: { nom: string | null } | null
}

type Favorited = { favorited: boolean }

// ——— Helpers UI ———
function cx(...xs: (string | false | null | undefined)[]) {
    return xs.filter(Boolean).join(" ")
}

const toneLeft: Record<string, string> = {
    CONCERT: "border-l-fuchsia-500/60",
    CONFERENCE: "border-l-violet-500/60",
    STAND: "border-l-emerald-500/60",
    ACTIVITE: "border-l-amber-500/60",
}

function CategoryBadge({ c }: { c: string }) {
    const tone: Record<string, string> = {
        CONCERT: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/20",
        CONFERENCE: "bg-violet-500/10 text-violet-300 ring-violet-500/20",
        STAND: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
        ACTIVITE: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
    }
    return (
        <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", tone[c] || "bg-slate-600/10 text-slate-300 ring-slate-500/20")}>{c}</span>
    )
}

function Skeleton() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <div className="h-8 w-1/2 animate-pulse rounded bg-white/10" />
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
                <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-white/10" />
                <div className="mt-6 space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                </div>
            </div>
        </div>
    )
}

export default function EventDetailPage() {
    const params = useParams() as { id: string }
    const { status } = useSession()
    const isAuth = status === "authenticated"

    const [ev, setEv] = useState<Ev | null>(null)
    const [loading, setLoading] = useState(true)
    const [fav, setFav] = useState<boolean>(false)
    const [msg, setMsg] = useState("")
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let mounted = true
        ;(async () => {
            try {
                const e: Ev = await fetch(`/api/events/${params.id}`).then((r) => r.json())
                let f: Favorited = { favorited: false }
                if (isAuth) {
                    try {
                        f = await fetch(`/api/favorites?eventId=${params.id}`).then((r) => r.json())
                    } catch (_) {
                        f = { favorited: false }
                    }
                }
                if (!mounted) return
                setEv(e)
                setFav(!!f.favorited)
            } finally {
                if (mounted) setLoading(false)
            }
        })()
        return () => {
            mounted = false
        }
    }, [params.id, isAuth])

    async function toggleFav() {
        if (!ev || busy) return
        setMsg("")
        setBusy(true)
        const next = !fav
        setFav(next) // Optimistic
        try {
            if (next) {
                const res = await fetch("/api/favorites", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event_id: ev.id }),
                })
                if (!res.ok) {
                    const d = await res.json().catch(() => ({}))
                    throw new Error(d.error || "Erreur")
                }
            } else {
                const res = await fetch(`/api/favorites/${ev.id}`, { method: "DELETE" })
                if (!res.ok) {
                    const d = await res.json().catch(() => ({}))
                    throw new Error(d.error || "Erreur")
                }
            }
        } catch (e: any) {
            setFav(!next) // revert
            setMsg(e?.message || "Erreur")
        } finally {
            setBusy(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_0%_0%,rgba(139,92,246,0.12),transparent_60%),radial-gradient(1000px_600px_at_100%_100%,rgba(168,85,247,0.12),transparent_60%),linear-gradient(to_bottom_right,#0b1020,#0f1324)] text-slate-200">
            <Skeleton />
        </div>
    )

    if (!ev?.id)
        return (
            <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_0%_0%,rgba(139,92,246,0.12),transparent_60%),radial-gradient(1000px_600px_at_100%_100%,rgba(168,85,247,0.12),transparent_60%),linear-gradient(to_bottom_right,#0b1020,#0f1324)] px-4 py-10 text-slate-200">
                <div className="mx-auto max-w-3xl">
                    <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">Introuvable</p>
                    <a href="/events" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">← Retour à la liste</a>
                </div>
            </div>
        )

    const debut = new Date(ev.date_debut).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })
    const fin = new Date(ev.date_fin).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(1200px_600px_at_0%_0%,rgba(139,92,246,0.12),transparent_60%),radial-gradient(1000px_600px_at_100%_100%,rgba(168,85,247,0.12),transparent_60%),linear-gradient(to_bottom_right,#0b1020,#0f1324)] text-slate-200">
            <div className="mx-auto max-w-3xl px-4 py-8">
                {/* Back */}
                <div className="mb-6">
                    <a href="/events" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">
                        <span aria-hidden>←</span> Retour à la liste
                    </a>
                </div>

                {/* Card */}
                <article className={cx("rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)] backdrop-blur-md", "border-l-4", toneLeft[ev.categorie] || "border-l-slate-500/60")}>
                    <header className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                            <h1 className="truncate text-2xl font-semibold text-white">{ev.titre}</h1>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                                <CategoryBadge c={ev.categorie} />
                                <span>• {debut} → {fin}</span>
                                {ev.lieu?.nom && <span>• {ev.lieu.nom}</span>}
                            </div>
                        </div>

                        {isAuth && (
                            <button
                                onClick={toggleFav}
                                disabled={busy}
                                className={cx(
                                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40",
                                    fav ? "bg-white/10 border border-white/10 hover:bg-white/15" : "bg-gradient-to-r from-fuchsia-600 to-violet-600 shadow-[0_8px_20px_-10px_rgba(139,92,246,0.6)] hover:from-fuchsia-500 hover:to-violet-500"
                                )}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} className={cx(fav ? "text-fuchsia-400" : "text-white")} stroke="currentColor" strokeWidth="1.5">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                {fav ? "Retirer des favoris" : "Ajouter aux favoris"}
                            </button>
                        )}
                    </header>

                    <section className="mt-6 space-y-3 text-[15px] leading-relaxed">
                        {ev.genres?.length > 0 && (
                            <p className="text-slate-300"><span className="text-slate-400">Genres :</span> {ev.genres.map((g) => g.genre.nom).join(", ")}</p>
                        )}
                        {ev.artistes?.length > 0 && (
                            <p className="text-slate-300"><span className="text-slate-400">Artistes :</span> {ev.artistes.map((a) => a.artiste.nom).join(", ")}</p>
                        )}
                        {ev.description && <p className="text-slate-200/90">{ev.description}</p>}

                        {msg && (
                            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{msg}</p>
                        )}
                    </section>
                </article>
            </div>
        </div>
    )
}
