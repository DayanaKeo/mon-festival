"use client";

import { useEffect, useMemo, useState } from "react";

type Lieu = { id: number; nom: string };
type POI = {
    id: number;
    nom: string;
    type: "SCENE" | "STAND" | "INFO" | "TOILETTES" | "RESTAURATION" | "ENTREE" | "AUTRE";
    lieu_id?: number | null;
    lieu?: Lieu | null;
    latitude?: string | null;  // Decimal → string
    longitude?: string | null;
    description?: string | null;
    _count?: { evenements: number };
};

type Draft = {
    id?: number;
    nom: string;
    type: POI["type"];
    lieu_id: number | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    description?: string | null;
};

const TYPES: POI["type"][] = ["SCENE", "STAND", "INFO", "TOILETTES", "RESTAURATION", "ENTREE", "AUTRE"];

export default function AdminPOIPage() {
    const [items, setItems] = useState<POI[]>([]);
    const [lieux, setLieux] = useState<Lieu[]>([]);
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
                const [poiList, lieuxList] = await Promise.all([
                    fetch("/api/pois").then(r => r.json()),
                    fetch("/api/lieux").then(r => r.json()).then((arr) => arr.map((l: any) => ({ id: l.id, nom: l.nom }))),
                ]);
                setItems(poiList);
                setLieux(lieuxList);
            } catch {
                setErr("Impossible de charger les POI.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return items;
        return items.filter(p =>
            [
                p.nom,
                p.type,
                p.description || "",
                p.lieu?.nom || "",
            ].join(" ").toLowerCase().includes(t)
        );
    }, [items, q]);

    function openCreateModal() {
        setDraft({
            nom: "",
            type: "SCENE",
            lieu_id: null,
            latitude: "",
            longitude: "",
            description: "",
        });
        setOpenCreate(true);
    }
    function openEditModal(id: number) {
        const p = items.find(x => x.id === id);
        if (!p) return;
        setDraft({
            id: p.id,
            nom: p.nom,
            type: p.type,
            lieu_id: p.lieu_id ?? null,
            latitude: p.latitude ?? "",
            longitude: p.longitude ?? "",
            description: p.description ?? "",
        });
        setOpenEdit(true);
    }

    async function createOne(values: Draft) {
        setErr("");
        try {
            const res = await fetch("/api/pois", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Création impossible.");
            }
            const created: POI = await res.json();
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
            const res = await fetch(`/api/pois/${values.id}`, {
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
            const res = await fetch(`/api/pois/${id}`, { method: "DELETE" });
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
                <h2 className="text-base font-semibold text-white">Points d’intérêt</h2>
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
                        + Nouveau POI
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
                <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-white/20 focus:ring-2 focus:ring-fuchsia-500/30"
                    placeholder="Rechercher (nom, type, lieu, description)…"
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
                    <div className="p-8 text-center text-sm text-slate-400">Aucun POI.</div>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {filtered.map((p) => (
                            <li key={p.id} className="flex items-center gap-4 p-4 hover:bg-white/5">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">{p.nom}</p>
                                    <p className="text-xs text-slate-400">
                                        {p.type} {p.lieu?.nom ? `• ${p.lieu.nom}` : ""} {p.description ? `• ${p.description}` : ""}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                        {p.latitude && p.longitude ? (
                                            <span>📍 {p.latitude}, {p.longitude}</span>
                                        ) : (
                                            <span>📍 coord. inconnues</span>
                                        )}
                                        {typeof p._count?.evenements === "number" && (
                                            <span className="rounded-full bg-white/10 px-2 py-0.5">
                        Événements: {p._count.evenements}
                      </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(p.id)}
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
                <POIModal
                    title="Créer un POI"
                    initial={draft}
                    lieux={lieux}
                    onClose={() => { setOpenCreate(false); setDraft(null); }}
                    onSubmit={createOne}
                    submitLabel="Créer"
                />
            )}

            {openEdit && draft && draft.id && (
                <POIModal
                    title="Éditer le POI"
                    initial={draft as Draft}
                    lieux={lieux}
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

function POIModal({
                      title,
                      initial,
                      lieux,
                      onClose,
                      onSubmit,
                      submitLabel,
                      onDelete,
                  }: {
    title: string;
    initial: Draft;
    lieux: Lieu[];
    onClose: () => void;
    onSubmit: (values: Draft) => Promise<void> | void;
    submitLabel: string;
    onDelete?: () => Promise<void> | void;
}) {
    const [values, setValues] = useState<Draft>({
        id: initial.id,
        nom: initial.nom || "",
        type: initial.type || "SCENE",
        lieu_id: initial.lieu_id ?? null,
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
                    {/* Nom + Type */}
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
                            <label className="mb-1 block text-xs text-slate-400">Type</label>
                            <select
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.type}
                                onChange={(e) => set("type", e.target.value as Draft["type"])}
                            >
                                {TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Lieu */}
                    <div>
                        <label className="mb-1 block text-xs text-slate-400">Lieu</label>
                        <select
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                            value={values.lieu_id ?? ""}
                            onChange={(e) => set("lieu_id", e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">— Aucun</option>
                            {lieux.map((l) => (
                                <option key={l.id} value={l.id}>{l.nom}</option>
                            ))}
                        </select>
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
