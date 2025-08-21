"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StatPayload = {
    events: number;
    artistes: number;
    lieux: number;
    pois: number;
    genres: number;
    users: number;
    latestEvents?: {
        id: number;
        titre: string;
        date_debut: string;
        date_fin: string;
        categorie: string;
        lieu?: { nom: string | null } | null;
    }[];
};

type Ev = {
    id: number;
    titre: string;
    date_debut: string;
    date_fin: string;
    categorie: string;
    lieu?: { nom: string | null } | null;
};

function cx(...xs: (string | false | null | undefined)[]) {
    return xs.filter(Boolean).join(" ");
}

const CARDS = [
    { key: "events", label: "Événements", href: "/admin/events" },
    { key: "artistes", label: "Artistes", href: "/admin/artistes" },
    { key: "lieux", label: "Lieux", href: "/admin/lieux" },
    { key: "pois", label: "POI", href: "/admin/pois" },
    { key: "genres", label: "Genres", href: "/admin/genres" },
    { key: "users", label: "Utilisateurs", href: "/admin/users" },
] as const;

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<StatPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string>("");

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                // 1) Essaye l’API dédiée de stats si elle existe
                const res = await fetch("/api/admin/stats");
                if (res.ok) {
                    const d = (await res.json()) as StatPayload;
                    setStats(d);
                } else {
                    // 2) Fallback minimal: compter via /api/events et /api/meta
                    const [evs, meta] = await Promise.all([
                        fetch("/api/events").then((r) => r.json()),
                        fetch("/api/meta").then((r) => r.json()),
                    ]);
                    const latestEvents: Ev[] = [...evs]
                        .sort((a: Ev, b: Ev) => +new Date(b.date_debut) - +new Date(a.date_debut))
                        .slice(0, 6);

                    setStats({
                        events: evs?.length || 0,
                        artistes: meta?.artistes?.length || 0,
                        lieux: meta?.lieux?.length || 0,
                        pois: meta?.pois?.length || 0,
                        genres: meta?.genres?.length || 0,
                        users: 0, // à remplacer si /api/admin/stats existe
                        latestEvents,
                    });
                }
            } catch (e) {
                setErr("Impossible de charger les statistiques.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const grid = useMemo(
        () =>
            (loading ? CARDS : CARDS).map((c) => {
                const v = stats ? (stats as any)[c.key] ?? 0 : 0;
                return { ...c, value: v as number };
            }),
        [loading, stats]
    );

    return (
        <div className="space-y-6">
            {err && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {err}
                </p>
            )}

            {/* KPI cards */}
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grid.map((card, i) => (
                    <Link
                        key={card.key}
                        href={card.href}
                        className={cx(
                            "group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md",
                            "shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] transition hover:bg-white/10"
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm text-slate-400">{card.label}</p>
                                <p className="mt-1 text-2xl font-semibold text-white">
                                    {loading ? (
                                        <span className="inline-block h-7 w-16 animate-pulse rounded bg-white/10" />
                                    ) : (
                                        card.value
                                    )}
                                </p>
                            </div>
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                Voir
              </span>
                        </div>
                    </Link>
                ))}
            </section>

            {/* Actions rapides */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/admin/events/new"
                        className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3.5 py-2 text-sm font-medium text-white hover:from-fuchsia-500 hover:to-violet-500"
                    >
                        + Créer un événement
                    </Link>
                    <Link
                        href="/admin/events"
                        className="rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-sm hover:bg-white/15"
                    >
                        Gérer les événements
                    </Link>
                    <Link
                        href="/admin/users"
                        className="rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-sm hover:bg-white/15"
                    >
                        Gérer les utilisateurs
                    </Link>
                </div>
            </section>

            {/* Derniers événements */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white">Derniers événements</h2>
                    <Link
                        className="text-sm text-slate-300 hover:text-white"
                        href="/admin/events"
                    >
                        Tout voir
                    </Link>
                </div>

                {loading ? (
                    <ul className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <li
                                key={i}
                                className="rounded-xl border border-white/10 bg-white/5 p-3"
                            >
                                <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
                                <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-white/10" />
                            </li>
                        ))}
                    </ul>
                ) : stats?.latestEvents && stats.latestEvents.length > 0 ? (
                    <ul className="space-y-2">
                        {stats.latestEvents.map((e) => (
                            <li
                                key={e.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-white">
                                        {e.titre}
                                    </p>
                                    <p className="truncate text-xs text-slate-400">
                                        {fmt(e.date_debut)} → {fmt(e.date_fin)}
                                        {e.lieu?.nom ? ` • ${e.lieu.nom}` : ""}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <Link
                                        href={`/admin/events/${e.id}/edit`}
                                        className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs hover:bg-white/15"
                                    >
                                        Éditer
                                    </Link>
                                    <Link
                                        href={`/events/${e.id}`}
                                        className="rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 px-2.5 py-1.5 text-xs font-medium text-white hover:from-fuchsia-500 hover:to-violet-500"
                                    >
                                        Voir
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
                        Aucun événement récent.
                    </div>
                )}
            </section>
        </div>
    );
}

function fmt(iso: string) {
    try {
        return new Date(iso).toLocaleString("fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    } catch {
        return iso;
    }
}
