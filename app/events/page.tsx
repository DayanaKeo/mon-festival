"use client"

import { useEffect, useMemo, useRef, useState } from "react"

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

type GenreMeta = { id: number; nom: string }

const CATEGORIES = ["CONCERT", "CONFERENCE", "STAND", "ACTIVITE"] as const

function cx(...xs: (string | false | null | undefined)[]) {
    return xs.filter(Boolean).join(" ")
}

function CategoryBadge({ c }: { c: string }) {
    const tone: Record<string, string> = {
        CONCERT: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/20",
        CONFERENCE: "bg-violet-500/10 text-violet-300 ring-violet-500/20",
        STAND: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
        ACTIVITE: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
    }
    return (
        <span
            className={cx(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                tone[c] || "bg-slate-600/10 text-slate-300 ring-slate-500/20"
            )}
        >
      {c}
    </span>
    )
}

function SkeletonCard() {
    return (
        <li className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <div className="flex items-start gap-4">
                <div className="h-16 w-16 animate-pulse rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-3/5 animate-pulse rounded bg-white/10" />
                </div>
                <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
            </div>
        </li>
    )
}

export default function EventsPage() {
    const [all, setAll] = useState<Ev[]>([])
    const [q, setQ] = useState("")
    const [debouncedQ, setDebouncedQ] = useState("")
    const [cat, setCat] = useState<string>("")
    const [from, setFrom] = useState<string>("")
    const [to, setTo] = useState<string>("")
    const [genre, setGenre] = useState<string>("")

    const [genres, setGenres] = useState<GenreMeta[]>([])
    const [loading, setLoading] = useState(true)

    const [elevate, setElevate] = useState(false)
    const headerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const onScroll = () => setElevate(window.scrollY > 6)
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    useEffect(() => {
        Promise.all([
            fetch("/api/events").then((r) => r.json()),
            fetch("/api/meta").then((r) => r.json()),
        ]).then(([evs, meta]) => {
            setAll(evs)
            setGenres(meta.genres)
            setLoading(false)
        })
    }, [])

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q), 250)
        return () => clearTimeout(t)
    }, [q])

    const clearFilters = () => {
        setQ("")
        setCat("")
        setFrom("")
        setTo("")
        setGenre("")
    }

    const fmt = (iso: string) =>
        new Date(iso).toLocaleString("fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
        })

    const items = useMemo(() => {
        return all
            .filter((e) => {
                if (debouncedQ) {
                    const h = `${e.titre} ${e.description || ""} ${(e.artistes || [])
                        .map((a) => a.artiste.nom)
                        .join(" ")} ${(e.genres || [])
                        .map((g) => g.genre.nom)
                        .join(" ")}`
                    if (!h.toLowerCase().includes(debouncedQ.toLowerCase())) return false
                }
                if (cat && e.categorie !== cat) return false
                if (genre) {
                    const has = e.genres?.some((g) => String(g.genre.id) === genre)
                    if (!has) return false
                }
                if (from && new Date(e.date_debut) < new Date(from)) return false
                if (to && new Date(e.date_fin) > new Date(to)) return false
                return true
            })
            .sort((a, b) => +new Date(a.date_debut) - +new Date(b.date_debut))
    }, [all, debouncedQ, cat, from, to, genre])

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(1200px_600px_at_0%_0%,rgba(139,92,246,0.12),transparent_60%),radial-gradient(1000px_600px_at_100%_100%,rgba(168,85,247,0.12),transparent_60%),linear-gradient(to_bottom_right,#0b1020,#0f1324)] text-slate-200">
            {/* Header */}
            <header
                ref={headerRef}
                className={cx(
                    "sticky top-0 z-20 border-b border-white/5 backdrop-blur-md transition-shadow",
                    elevate && "shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]"
                )}
            >
                <div className="mx-auto max-w-6xl px-4 py-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <h1 className="text-2xl font-semibold tracking-tight text-white">Événements</h1>
                        <div className="text-sm text-slate-400">{items.length} résultat{items.length > 1 ? "s" : ""}</div>
                    </div>

                    {/* Filtres */}
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <input
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-400 outline-none focus:border-white/20 focus:ring-2 focus:ring-fuchsia-500/30"
                                    placeholder="Recherche (titre, artiste, genre)"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />
                                <svg
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                        </div>

                        <select
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-400 focus:border-white/20 focus:ring-2 focus:ring-fuchsia-500/30"
                            value={cat}
                            onChange={(e) => setCat(e.target.value)}
                        >
                            <option value="">Catégorie</option>
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        <select
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-400 focus:border-white/20 focus:ring-2 focus:ring-fuchsia-500/30"
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                        >
                            <option value="">Genre</option>
                            {genres.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.nom}
                                </option>
                            ))}
                        </select>

                        <div className="flex gap-2">
                            <input
                                type="datetime-local"
                                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-400 focus:border-white/20 focus:ring-2 focus:ring-fuchsia-500/30"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                            />
                            <input
                                type="datetime-local"
                                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-400 focus:border-white/20 focus:ring-2 focus:ring-fuchsia-500/30"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                        >
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </header>

            {/* Liste */}
            <main className="mx-auto max-w-6xl px-4 py-6">
                {loading ? (
                    <ul className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</ul>
                ) : items.length === 0 ? (
                    <div className="mt-16 rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md">
                        <p className="text-lg font-semibold text-white">Aucun événement trouvé</p>
                        <p className="mt-1 text-sm text-slate-400">Ajuste les filtres pour affiner.</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {items.map((e) => {
                            const debut = fmt(e.date_debut)
                            const fin = fmt(e.date_fin)

                            const left: Record<string, string> = {
                                CONCERT: "border-l-fuchsia-500/60",
                                CONFERENCE: "border-l-violet-500/60",
                                STAND: "border-l-emerald-500/60",
                                ACTIVITE: "border-l-amber-500/60",
                            }

                            return (
                                <li
                                    key={e.id}
                                    className={cx(
                                        "group rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md transition hover:bg-white/7 hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)]",
                                        "border-l-4",
                                        left[e.categorie] || "border-l-slate-500/60"
                                    )}
                                >
                                    <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate text-lg font-semibold text-white">{e.titre}</p>
                                                <CategoryBadge c={e.categorie} />
                                            </div>
                                            <p className="mt-0.5 text-sm text-slate-400">
                                                {debut} → {fin}
                                                {e.lieu?.nom ? ` • ${e.lieu?.nom}` : ""}
                                            </p>
                                            {e.genres?.length > 0 && (
                                                <p className="mt-1 text-sm text-slate-300">
                                                    <span className="text-slate-400">Genres :</span> {e.genres.map((g) => g.genre.nom).join(", ")}
                                                </p>
                                            )}
                                            {e.artistes?.length > 0 && (
                                                <p className="text-sm text-slate-300">
                                                    <span className="text-slate-400">Artistes :</span> {e.artistes.map((a) => a.artiste.nom).join(", ")}
                                                </p>
                                            )}
                                            {e.description && (
                                                <p className="mt-2 text-[15px] leading-relaxed text-slate-200/90">{e.description}</p>
                                            )}
                                        </div>

                                        <a
                                            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(139,92,246,0.6)] transition hover:from-fuchsia-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                                            href={`/events/${e.id}`}
                                        >
                                            Détails
                                        </a>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </main>
        </div>
    )
}
