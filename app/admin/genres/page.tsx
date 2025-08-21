"use client";

import { useEffect, useMemo, useState } from "react";

type Genre = {
    id: number;
    nom: string;
    _count?: { evenements: number };
};

type Draft = { id?: number; nom: string };

export default function AdminGenresPage() {
    const [items, setItems] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [q, setQ] = useState("");

    // Modales
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [draft, setDraft] = useState<Draft | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setErr(""); setLoading(true);
                const data: Genre[] = await fetch("/api/genres").then(r => r.json());
                setItems(data);
            } catch {
                setErr("Impossible de charger les genres.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return items;
        return items.filter(g => g.nom.toLowerCase().includes(t));
    }, [items, q]);

    function openCreateModal() {
        setDraft({ nom: "" });
        setOpenCreate(true);
    }
    function openEditModal(id: number) {
        const g = items.find(x => x.id === id);
        if (!g) return;
        setDraft({ id: g.id, nom: g.nom });
        setOpenEdit(true);
    }

    async function createOne(values: Draft) {
        setErr("");
        try {
            const res = await fetch("/api/genres", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Création impossible.");
            }
            const created: Genre = await res.json();
            setItems(s => [created, ...s].sort((a, b) => a.nom.localeCompare(b.nom)));
            setOpenCreate(false);
            setDraft(null);
        } catch (e: any) {
            setErr(e.message || "Création impossible.");
        }
    }

    async function updateOne(values: Draft & { id: number }) {
        setErr("");
        const prev = items;
        setItems(s => s.map(x => (x.id === values.id ? { ...x, nom: values.nom } : x)));
        try {
            const res = await fetch(`/api/genres/${values.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nom: values.nom }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Édition impossible.");
            }
            setOpenEdit(false);
            setDraft(null);
        } catch (e: any) {
            setErr(e.message || "Édition impossible.");
            setItems(prev);
        }
    }

    async function deleteOne(id: number) {
        setErr("");
        const prev = items;
        setItems(s => s.filter(x => x.id !== id));
        try {
            const res = await fetch(`/api/genres/${id}`, { method: "DELETE" });
            if (!res.ok && res.status !== 204) throw new Error();
            setOpenEdit(false);
            setDraft(null);
        } catch {
            setErr("Suppression impossible.");
            setItems(prev);
        }
    }

    return (
        <div className="space-y-4">
            {/* Header + actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-white">Genres</h2>
                <div className="flex items-center gap-2">
                    {err && (
                        <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-200">
              {err}
            </span>
                    )}
                    <button
                        onClick={openCreateModal}
                        className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3.5 py-2 text-sm font-medium text-white hover:from-fuchsia-500 hover:to-violet-500"
                    >
                        + Nouveau genre
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
                <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-white/20 focus:ring-2 focus:ring-fuchsia-500/30"
                    placeholder="Rechercher un genre…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            </div>

            {/* Liste */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                {loading ? (
                    <div className="p-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="mb-2 h-16 animate-pulse rounded-xl bg-white/10" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">Aucun genre.</div>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {filtered.map((g) => (
                            <li key={g.id} className="flex items-center gap-4 p-4 hover:bg-white/5">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">{g.nom}</p>
                                    {typeof g._count?.evenements === "number" && (
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            Événements liés : <span className="rounded-full bg-white/10 px-2 py-0.5">{g._count.evenements}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(g.id)}
                                        className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs hover:bg-white/15"
                                    >
                                        Éditer
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Modales */}
            {openCreate && draft && (
                <GenreModal
                    title="Créer un genre"
                    initial={draft}
                    onClose={() => { setOpenCreate(false); setDraft(null); }}
                    onSubmit={createOne}
                    submitLabel="Créer"
                />
            )}
            {openEdit && draft && draft.id && (
                <GenreModal
                    title="Éditer le genre"
                    initial={draft as Draft}
                    onClose={() => { setOpenEdit(false); setDraft(null); }}
                    onSubmit={(v) => updateOne({ ...(v as Draft), id: draft.id! })}
                    submitLabel="Enregistrer"
                    onDelete={() => deleteOne(draft.id!)}
                />
            )}
        </div>
    );
}

/* ============ Modal ============ */

function GenreModal({
                        title,
                        initial,
                        onClose,
                        onSubmit,
                        submitLabel,
                        onDelete,
                    }: {
    title: string;
    initial: Draft;
    onClose: () => void;
    onSubmit: (values: Draft) => Promise<void> | void;
    submitLabel: string;
    onDelete?: () => Promise<void> | void;
}) {
    const [values, setValues] = useState<Draft>({
        id: initial.id,
        nom: initial.nom || "",
    });
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    function set<K extends keyof Draft>(k: K, v: Draft[K]) {
        setValues((s) => ({ ...s, [k]: v }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsg(""); setBusy(true);
        try {
            await onSubmit(values);
        } catch (e: any) {
            setMsg(e?.message || "Erreur");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200 backdrop-blur-md shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)]">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-sm hover:bg-white/15"
                    >
                        Fermer
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs text-slate-400">Nom</label>
                        <input
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                            value={values.nom}
                            onChange={(e) => set("nom", e.target.value)}
                            placeholder="ex: Rock, Electro, Jazz…"
                            required
                        />
                    </div>

                    {msg && (
                        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                            {msg}
                        </p>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-2">
                        {onDelete ? (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/15"
                            >
                                Supprimer
                            </button>
                        ) : <span />}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                            >
                                Annuler
                            </button>
                            <button
                                disabled={busy}
                                className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3.5 py-2 text-sm font-medium text-white hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-60"
                            >
                                {submitLabel}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
