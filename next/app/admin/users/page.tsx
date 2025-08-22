"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
    id: number;
    nom: string;
    prenom?: string | null;
    email: string;
    role: "ADMIN" | "UTILISATEUR";
    email_verifie: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: { favoris: number; rappels: number };
};

type Draft = {
    id?: number;
    nom: string;
    prenom?: string | null;
    email: string;
    role: "ADMIN" | "UTILISATEUR";
    email_verifie: boolean;
    mot_de_passe?: string; // optionnel (edit: change si renseigné)
};

const ROLES: Array<User["role"]> = ["ADMIN", "UTILISATEUR"];

export default function AdminUsersPage() {
    const [items, setItems] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [q, setQ] = useState("");
    const [roleFilter, setRoleFilter] = useState<"" | User["role"]>("");
    const [verifFilter, setVerifFilter] = useState<"" | "oui" | "non">("");

    // Modales
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [draft, setDraft] = useState<Draft | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setErr(""); setLoading(true);
                const data: User[] = await fetch("/api/users").then(r => r.json());
                setItems(data);
            } catch {
                setErr("Impossible de charger les utilisateurs.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        return items
            .filter(u => {
                const matchesText = !t
                    || [u.nom, u.prenom || "", u.email].join(" ").toLowerCase().includes(t);
                const matchesRole = !roleFilter || u.role === roleFilter;
                const matchesVerif = !verifFilter
                    || (verifFilter === "oui" ? u.email_verifie : !u.email_verifie);
                return matchesText && matchesRole && matchesVerif;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [items, q, roleFilter, verifFilter]);

    function openCreateModal() {
        setDraft({
            nom: "",
            prenom: "",
            email: "",
            role: "UTILISATEUR",
            email_verifie: false,
            mot_de_passe: "",
        });
        setOpenCreate(true);
    }
    function openEditModal(id: number) {
        const u = items.find(x => x.id === id);
        if (!u) return;
        setDraft({
            id: u.id,
            nom: u.nom,
            prenom: u.prenom || "",
            email: u.email,
            role: u.role,
            email_verifie: u.email_verifie,
            mot_de_passe: "", // vide par défaut (non modifié)
        });
        setOpenEdit(true);
    }

    async function createOne(values: Draft) {
        setErr("");
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nom: values.nom,
                    prenom: values.prenom,
                    email: values.email,
                    role: values.role,
                    email_verifie: values.email_verifie,
                    mot_de_passe: values.mot_de_passe || undefined,
                }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Création impossible.");
            }
            const created: User = await res.json();
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
        setItems(s => s.map(x => (x.id === values.id ? {
            ...x,
            nom: values.nom,
            prenom: values.prenom || null,
            email: values.email,
            role: values.role,
            email_verifie: values.email_verifie,
        } : x)));
        try {
            const res = await fetch(`/api/users/${values.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nom: values.nom,
                    prenom: values.prenom,
                    email: values.email,
                    role: values.role,
                    email_verifie: values.email_verifie,
                    mot_de_passe: values.mot_de_passe ? values.mot_de_passe : undefined,
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
        setItems(s => s.filter(x => x.id !== id));
        try {
            const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
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
                <h2 className="text-base font-semibold text-white">Utilisateurs</h2>
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
                        + Nouvel utilisateur
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
                <div className="grid gap-3 sm:grid-cols-3">
                    <input
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-white/20 focus:ring-2 focus:ring-fuchsia-500/30"
                        placeholder="Rechercher (nom, prénom, email)…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <select
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as any)}
                    >
                        <option value="">Tous les rôles</option>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                        value={verifFilter}
                        onChange={(e) => setVerifFilter(e.target.value as any)}
                    >
                        <option value="">Tous (vérifiés / non)</option>
                        <option value="oui">Vérifiés</option>
                        <option value="non">Non vérifiés</option>
                    </select>
                </div>
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
                    <div className="p-8 text-center text-sm text-slate-400">Aucun utilisateur.</div>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {filtered.map((u) => (
                            <li key={u.id} className="flex items-center gap-4 p-4 hover:bg-white/5">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">
                                        {u.prenom ? `${u.prenom} ${u.nom}` : u.nom}
                                    </p>
                                    <p className="text-xs text-slate-300">{u.email}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                        <span className="rounded-full bg-white/10 px-2 py-0.5">{u.role}</span>
                                        <span className={`rounded-full px-2 py-0.5 ${u.email_verifie ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"}`}>
                      {u.email_verifie ? "Email vérifié" : "Email non vérifié"}
                    </span>
                                        {u._count && (
                                            <>
                                                <span className="rounded-full bg-white/10 px-2 py-0.5">Favoris: {u._count.favoris}</span>
                                                <span className="rounded-full bg-white/10 px-2 py-0.5">Rappels: {u._count.rappels}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(u.id)}
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
                <UserModal
                    title="Créer un utilisateur"
                    initial={draft}
                    onClose={() => { setOpenCreate(false); setDraft(null); }}
                    onSubmit={createOne}
                    submitLabel="Créer"
                />
            )}
            {openEdit && draft && draft.id && (
                <UserModal
                    title="Éditer l’utilisateur"
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

function UserModal({
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
        prenom: initial.prenom || "",
        email: initial.email || "",
        role: initial.role || "UTILISATEUR",
        email_verifie: initial.email_verifie ?? false,
        mot_de_passe: "",
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
                    {/* Nom + Prénom */}
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
                            <label className="mb-1 block text-xs text-slate-400">Prénom</label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.prenom || ""}
                                onChange={(e) => set("prenom", e.target.value)}
                                placeholder="(optionnel)"
                            />
                        </div>
                    </div>

                    {/* Email + Rôle */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Email</label>
                            <input
                                type="email"
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.email}
                                onChange={(e) => set("email", e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Rôle</label>
                            <select
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.role}
                                onChange={(e) => set("role", e.target.value as Draft["role"])}
                            >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Vérification email */}
                    <div>
                        <label className="mb-1 block text-xs text-slate-400">Vérification email</label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="accent-fuchsia-600"
                                checked={values.email_verifie}
                                onChange={(e) => set("email_verifie", e.target.checked)}
                            />
                            <span>Marquer comme vérifié</span>
                        </label>
                    </div>

                    {/* Mot de passe (optionnel) */}
                    <div>
                        <label className="mb-1 block text-xs text-slate-400">
                            Mot de passe {values.id ? "(laisser vide pour ne pas changer)" : ""}
                        </label>
                        <input
                            type="password"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                            value={values.mot_de_passe || ""}
                            onChange={(e) => set("mot_de_passe", e.target.value)}
                            placeholder={values.id ? "•••••••• (inchangé si vide)" : "Définir un mot de passe"}
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
