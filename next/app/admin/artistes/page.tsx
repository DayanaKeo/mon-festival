"use client";

import { useEffect, useMemo, useState } from "react";

type Artiste = {
    id: number;
    nom: string;
    bio?: string | null;
    photo_url?: string | null;
    site_web?: string | null;
    instagram?: string | null;
    x?: string | null;
    facebook?: string | null;
    style_principal?: string | null;
    genres_secondaires?: any; // JSON: string[] conseillé
};

type Draft = {
    id?: number;
    nom: string;
    bio?: string | null;
    photo_url?: string | null;
    site_web?: string | null;
    instagram?: string | null;
    x?: string | null;
    facebook?: string | null;
    style_principal?: string | null;
    genres_secondaires?: string[] | string | null; // accepte tableau ou string "rock, jazz"
};

function cx(...xs: (string | false | null | undefined)[]) {
    return xs.filter(Boolean).join(" ");
}
const asArray = (v: any): string[] =>
    Array.isArray(v) ? v :
        typeof v === "string" ? v.split(",").map(s => s.trim()).filter(Boolean) :
            v && typeof v === "object" ? Object.values(v) as string[] : [];

export default function AdminArtistesPage() {
    const [items, setItems] = useState<Artiste[]>([]);
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
                const data: Artiste[] = await fetch("/api/artistes").then(r => r.json());
                setItems(data);
            } catch {
                setErr("Impossible de charger les artistes.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return items;
        return items.filter(a =>
            [
                a.nom,
                a.bio || "",
                a.style_principal || "",
                ...(asArray(a.genres_secondaires) || []),
            ].join(" ").toLowerCase().includes(t)
        );
    }, [items, q]);

    function openCreateModal() {
        setDraft({
            nom: "",
            bio: "",
            photo_url: "",
            site_web: "",
            instagram: "",
            x: "",
            facebook: "",
            style_principal: "",
            genres_secondaires: [],
        });
        setOpenCreate(true);
    }
    function openEditModal(id: number) {
        const a = items.find(x => x.id === id);
        if (!a) return;
        setDraft({
            id: a.id,
            nom: a.nom,
            bio: a.bio || "",
            photo_url: a.photo_url || "",
            site_web: a.site_web || "",
            instagram: a.instagram || "",
            x: a.x || "",
            facebook: a.facebook || "",
            style_principal: a.style_principal || "",
            genres_secondaires: asArray(a.genres_secondaires),
        });
        setOpenEdit(true);
    }

    async function createOne(values: Draft) {
        setErr("");
        const body = {
            ...values,
            genres_secondaires: values.genres_secondaires,
        };
        try {
            const res = await fetch("/api/artistes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Création impossible.");
            }
            const created: Artiste = await res.json();
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
            const res = await fetch(`/api/artistes/${values.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    genres_secondaires: values.genres_secondaires,
                }),
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
            const res = await fetch(`/api/artistes/${id}`, { method: "DELETE" });
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
                <h2 className="text-base font-semibold text-white">Artistes</h2>
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
                        + Nouvel artiste
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
                <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-white/20 focus:ring-2 focus:ring-fuchsia-500/30"
                    placeholder="Rechercher (nom, style, genres, bio)…"
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
                    <div className="p-8 text-center text-sm text-slate-400">Aucun artiste.</div>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {filtered.map((a) => (
                            <li key={a.id} className="flex items-center gap-4 p-4 hover:bg-white/5">
                                <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                    {a.photo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={a.photo_url} alt={a.nom} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">—</div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">{a.nom}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-1">
                                        {a.style_principal && (
                                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
                        {a.style_principal}
                      </span>
                                        )}
                                        {asArray(a.genres_secondaires).slice(0, 4).map((g, i) => (
                                            <span key={i} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
                        {g}
                      </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    {a.site_web && (
                                        <a
                                            href={a.site_web}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-slate-300 hover:text-white underline"
                                        >
                                            Site
                                        </a>
                                    )}
                                    <button
                                        onClick={() => openEditModal(a.id)}
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
                <ArtistModal
                    title="Créer un artiste"
                    initial={draft}
                    onClose={() => { setOpenCreate(false); setDraft(null); }}
                    onSubmit={createOne}
                    submitLabel="Créer"
                />
            )}

            {openEdit && draft && draft.id && (
                <ArtistModal
                    title="Éditer l’artiste"
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

/* ================= Modal ================= */

function ArtistModal({
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
        bio: initial.bio || "",
        photo_url: initial.photo_url || "",
        site_web: initial.site_web || "",
        instagram: initial.instagram || "",
        x: initial.x || "",
        facebook: initial.facebook || "",
        style_principal: initial.style_principal || "",
        genres_secondaires: Array.isArray(initial.genres_secondaires)
            ? initial.genres_secondaires
            : typeof initial.genres_secondaires === "string"
                ? initial.genres_secondaires.split(",").map(s => s.trim()).filter(Boolean)
                : [],
    });
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    function set<K extends keyof Draft>(k: K, v: Draft[K]) {
        setValues((s) => ({ ...s, [k]: v }));
    }
    function addGenreChip() {
        const input = (document.getElementById("genresInput") as HTMLInputElement | null);
        const txt = input?.value?.trim();
        if (!txt) return;
        setValues(s => ({ ...s, genres_secondaires: [...(s.genres_secondaires as string[]), txt] }));
        if (input) input.value = "";
    }
    function removeGenre(i: number) {
        setValues(s => {
            const arr = [...(s.genres_secondaires as string[])];
            arr.splice(i, 1);
            return { ...s, genres_secondaires: arr };
        });
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
                    {/* Nom + Style principal */}
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
                            <label className="mb-1 block text-xs text-slate-400">Style principal</label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.style_principal || ""}
                                onChange={(e) => set("style_principal", e.target.value)}
                                placeholder="ex: Pop, Rock, Electro…"
                            />
                        </div>
                    </div>

                    {/* Genres secondaires (chips) */}
                    <div>
                        <label className="mb-1 block text-xs text-slate-400">Genres secondaires</label>
                        <div className="flex gap-2">
                            <input
                                id="genresInput"
                                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                placeholder="Ajoute un genre puis Entrée / +"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") { e.preventDefault(); addGenreChip(); }
                                }}
                            />
                            <button type="button" onClick={addGenreChip} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/15">+</button>
                        </div>
                        {Array.isArray(values.genres_secondaires) && values.genres_secondaires.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {values.genres_secondaires.map((g, i) => (
                                    <button
                                        key={`${g}-${i}`}
                                        type="button"
                                        onClick={() => removeGenre(i)}
                                        className="rounded-full bg-white/10 px-2 py-0.5 text-xs"
                                        title="Retirer"
                                    >
                                        {g} ✕
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="mb-1 block text-xs text-slate-400">Biographie</label>
                        <textarea
                            className="h-28 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                            value={values.bio || ""}
                            onChange={(e) => set("bio", e.target.value)}
                            placeholder="(optionnel)"
                        />
                    </div>

                    {/* Photo */}
                    <div>
                        <label className="mb-1 block text-xs text-slate-400">Photo (URL)</label>
                        <input
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                            value={values.photo_url || ""}
                            onChange={(e) => set("photo_url", e.target.value)}
                            placeholder="https://…"
                        />
                        {values.photo_url && (
                            <div className="mt-2 h-32 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={values.photo_url} alt="" className="h-full w-full object-cover" />
                            </div>
                        )}
                    </div>

                    {/* Liens */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Site web</label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.site_web || ""}
                                onChange={(e) => set("site_web", e.target.value)}
                                placeholder="https://…"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Instagram</label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.instagram || ""}
                                onChange={(e) => set("instagram", e.target.value)}
                                placeholder="@handle ou URL"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">X (Twitter)</label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.x || ""}
                                onChange={(e) => set("x", e.target.value)}
                                placeholder="@handle ou URL"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Facebook</label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.facebook || ""}
                                onChange={(e) => set("facebook", e.target.value)}
                                placeholder="URL"
                            />
                        </div>
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
