"use client";

import { useEffect, useMemo, useState } from "react";

type Lieu = {
    id: number;
    nom: string;
    adresse?: string | null;
    ville?: string | null;
    pays?: string | null;
    latitude?: string | null;   // renvoyé par Prisma Decimal → string
    longitude?: string | null;  // idem
    description?: string | null;
    _count?: { pois: number; evenements: number };
};

type Draft = {
    id?: number;
    nom: string;
    adresse?: string | null;
    ville?: string | null;
    pays?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    description?: string | null;
};

function asNumStr(v?: string | null) {
    if (v === null || v === undefined || v === "") return "";
    return v;
}

export default function AdminLieuxPage() {
    const [items, setItems] = useState<Lieu[]>([]);
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
                const data: Lieu[] = await fetch("/api/lieux").then(r => r.json());
                setItems(data);
            } catch {
                setErr("Impossible de charger les lieux.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return items;
        return items.filter(l =>
            [
                l.nom,
                l.adresse || "",
                l.ville || "",
                l.pays || "",
                l.description || "",
            ].join(" ").toLowerCase().includes(t)
        );
    }, [items, q]);

    function openCreateModal() {
        setDraft({
            nom: "",
            adresse: "",
            ville: "",
            pays: "",
            latitude: "",
            longitude: "",
            description: "",
        });
        setOpenCreate(true);
    }

    function openEditModal(id: number) {
        const l = items.find(x => x.id === id);
        if (!l) return;
        setDraft({
            id: l.id,
            nom: l.nom,
            adresse: l.adresse || "",
            ville: l.ville || "",
            pays: l.pays || "",
            latitude: asNumStr(l.latitude),
            longitude: asNumStr(l.longitude),
            description: l.description || "",
        });
        setOpenEdit(true);
    }

    async function createOne(values: Draft) {
        setErr("");
        try {
            const res = await fetch("/api/lieux", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Création impossible.");
            }
            const created: Lieu = await res.json();
            setItems(s => [created, ...s]);
            setOpenCreate(false);
            setDraft(null);
        } catch (e: any) {
            setErr(e.message || "Création impossible.");
        }
    }

    async function updateOne(values: Draft & { id: number }) {
        setErr("");
        const prev = items;
        setItems(s => s.map(x => (x.id === values.id ? { ...x, ...values } as any : x))); // optimistic
        try {
            const res = await fetch(`/api/lieux/${values.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
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
        setItems(s => s.filter(x => x.id !== id)); // optimistic
        try {
            const res = await fetch(`/api/lieux/${id}`, { method: "DELETE" });
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
                <h2 className="text-base font-semibold text-white">Lieux</h2>
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
                        + Nouveau lieu
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
                <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-white/20 focus:ring-2 focus:ring-fuchsia-500/30"
                    placeholder="Rechercher (nom, ville, pays, adresse)…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            </div>

            {/* Liste */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                {loading ? (
                    <div className="p-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="mb-2 h-20 animate-pulse rounded-xl bg-white/10" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">Aucun lieu.</div>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {filtered.map((l) => (
                            <li key={l.id} className="flex items-center gap-4 p-4 hover:bg-white/5">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">{l.nom}</p>
                                    <p className="text-xs text-slate-400">
                                        {[l.adresse, l.ville, l.pays].filter(Boolean).join(" • ") || "—"}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                        {l.latitude && l.longitude ? (
                                            <span>📍 {l.latitude}, {l.longitude}</span>
                                        ) : (
                                            <span>📍 coord. inconnues</span>
                                        )}
                                        {l._count && (
                                            <>
                                                <span className="rounded-full bg-white/10 px-2 py-0.5">POI: {l._count.pois}</span>
                                                <span className="rounded-full bg-white/10 px-2 py-0.5">Événements: {l._count.evenements}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(l.id)}
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
                <LieuModal
                    title="Créer un lieu"
                    initial={draft}
                    onClose={() => { setOpenCreate(false); setDraft(null); }}
                    onSubmit={createOne}
                    submitLabel="Créer"
                />
            )}

            {openEdit && draft && draft.id && (
                <LieuModal
                    title="Éditer le lieu"
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

function LieuModal({
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
        adresse: initial.adresse || "",
        ville: initial.ville || "",
        pays: initial.pays || "",
        latitude: initial.latitude ?? "",
        longitude: initial.longitude ?? "",
        description: initial.description || "",
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
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200 backdrop-blur-md shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)]">
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
                    {/* Nom + Ville */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Nom</label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.nom}
                                onChange={(e) => set("nom", e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Ville</label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.ville || ""}
                                onChange={(e) => set("ville", e.target.value)}
                                placeholder="(optionnel)"
                            />
                        </div>
                    </div>

                    {/* Adresse + Pays */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Adresse</label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.adresse || ""}
                                onChange={(e) => set("adresse", e.target.value)}
                                placeholder="(optionnel)"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Pays</label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.pays || ""}
                                onChange={(e) => set("pays", e.target.value)}
                                placeholder="(optionnel)"
                            />
                        </div>
                    </div>

                    {/* Latitude / Longitude */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Latitude</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.latitude ?? ""}
                                onChange={(e) => set("latitude", e.target.value)}
                                placeholder="ex: 48.8566"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Longitude</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.longitude ?? ""}
                                onChange={(e) => set("longitude", e.target.value)}
                                placeholder="ex: 2.3522"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-1 block text-xs text-slate-400">Description</label>
                        <textarea
                            className="h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                            value={values.description || ""}
                            onChange={(e) => set("description", e.target.value)}
                            placeholder="(optionnel)"
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
