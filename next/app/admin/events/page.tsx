"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

// FullCalendar (React 19 / Next 15) — composant en dynamic (client-only)
const FullCalendar = dynamic(
    () => import("@fullcalendar/react").then((m) => m.default),
    { ssr: false }
);
// Plugins en import statique (v6)
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

/* ========= Types ========= */
type Simple = { id: number; nom: string };

type Ev = {
    id: number;
    titre: string;
    description?: string | null;
    categorie: string;
    date_debut: string;
    date_fin: string;
    lieu?: { id?: number; nom: string | null } | null;
    artistes?: { artiste: Simple }[];
    genres?: { genre: Simple }[];
    pois?: { poi: Simple }[];
};

type MetaPayload = {
    artistes: Simple[];
    genres: Simple[];
    lieux: Simple[];
    pois: Simple[];
};

type DraftValues = {
    id?: number;
    titre: string;
    description?: string | null;
    categorie: string;
    date_debut: string;
    date_fin: string;
    lieu_id: number | null;
    artiste_ids: number[];
    genre_ids: number[];
    poi_ids: number[];
};

const CATEGORIES = ["CONCERT", "CONFERENCE", "STAND", "ACTIVITE"] as const;

/* ========= Helpers ========= */
function tone(cat: string) {
    switch (cat) {
        case "CONCERT": return { bg: "#a855f7" };
        case "CONFERENCE": return { bg: "#8b5cf6" };
        case "STAND": return { bg: "#10b981" };
        case "ACTIVITE": return { bg: "#f59e0b" };
        default: return { bg: "#64748b" };
    }
}
const pad = (n: number) => String(n).padStart(2, "0");
function isoToLocalInput(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
function localInputToIso(val: string) {
    const d = new Date(val);
    return d.toISOString();
}
function cx(...xs: (string | false | null | undefined)[]) {
    return xs.filter(Boolean).join(" ");
}

export default function AdminEventsCalendarPage() {
    const [events, setEvents] = useState<Ev[]>([]);
    const [meta, setMeta] = useState<MetaPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // Modals
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [draft, setDraft] = useState<Partial<Ev> | null>(null); // pour create & edit

    /* ====== Load data ====== */
    useEffect(() => {
        (async () => {
            try {
                setErr(""); setLoading(true);
                const [evs, m] = await Promise.all([
                    fetch("/api/events").then((r) => r.json()),
                    fetch("/api/meta").then((r) => r.json()),
                ]);
                setEvents(evs);
                setMeta({
                    artistes: m?.artistes ?? [],
                    genres: m?.genres ?? [],
                    lieux: m?.lieux ?? [],
                    pois: m?.pois ?? [],
                });
            } catch {
                setErr("Impossible de charger les événements ou les métadonnées.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const fcEvents = useMemo(
        () =>
            events.map((e) => ({
                id: String(e.id),
                title: e.titre,
                start: e.date_debut,
                end: e.date_fin ?? e.date_debut,
                backgroundColor: tone(e.categorie).bg,
                borderColor: tone(e.categorie).bg,
                textColor: "#ffffff",
            })),
        [events]
    );

    /* ====== Drag / Resize persist ====== */
    async function persistDates(id: number, startISO: string, endISO?: string, revert?: () => void) {
        const prev = events;
        setEvents((s) =>
            s.map((ev) => (ev.id === id ? { ...ev, date_debut: startISO, date_fin: endISO || startISO } : ev))
        );
        try {
            const res = await fetch(`/api/events/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date_debut: startISO, date_fin: endISO || startISO }),
            });
            if (!res.ok) throw new Error();
        } catch {
            setErr("Mise à jour des dates impossible.");
            setEvents(prev);
            revert && revert();
        }
    }

    /* ====== Create ====== */
    const openCreateModal = useCallback((defaults?: Partial<Ev>) => {
        setDraft({
            titre: "",
            description: "",
            categorie: "CONCERT",
            date_debut: defaults?.date_debut || new Date().toISOString(),
            date_fin: defaults?.date_fin || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            lieu: null,
            artistes: [],
            genres: [],
            pois: [],
            ...defaults,
        });
        setOpenCreate(true);
    }, []);

    async function submitCreate(values: DraftValues) {
        setErr("");
        try {
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    titre: values.titre,
                    description: values.description || null,
                    categorie: values.categorie,
                    date_debut: values.date_debut,
                    date_fin: values.date_fin,
                    lieu_id: values.lieu_id ?? null,
                    artiste_ids: values.artiste_ids,
                    genre_ids: values.genre_ids,
                    poi_ids: values.poi_ids,
                }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Création impossible.");
            }
            const created = await res.json();
            setEvents((s) => [...s, created]);
            setOpenCreate(false);
            setDraft(null);
        } catch (e: any) {
            setErr(e.message || "Création impossible.");
        }
    }

    /* ====== Edit ====== */
    function openEditModal(evId: number) {
        const e = events.find((x) => x.id === evId);
        if (!e) return;
        setDraft({ ...e });
        setOpenEdit(true);
    }

    async function submitEdit(values: DraftValues & { id: number }) {
        setErr("");
        const prev = events;

        // Optimistic update (simple, sans recalcul des n–n)
        setEvents((s) =>
            s.map((x) =>
                x.id === values.id
                    ? {
                        ...x,
                        titre: values.titre,
                        description: values.description,
                        categorie: values.categorie,
                        date_debut: values.date_debut,
                        date_fin: values.date_fin,
                        lieu: values.lieu_id
                            ? { id: values.lieu_id, nom: meta?.lieux.find((l) => l.id === values.lieu_id)?.nom ?? "" }
                            : null,
                    }
                    : x
            )
        );

        try {
            const res = await fetch(`/api/events/${values.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    titre: values.titre,
                    description: values.description || null,
                    categorie: values.categorie,
                    date_debut: values.date_debut,
                    date_fin: values.date_fin,
                    lieu_id: values.lieu_id ?? null,
                    artiste_ids: values.artiste_ids,
                    genre_ids: values.genre_ids,
                    poi_ids: values.poi_ids,
                }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Édition impossible.");
            }
            // recharge des events à terme si besoin
            setOpenEdit(false);
            setDraft(null);
        } catch (e: any) {
            setErr(e.message || "Édition impossible.");
            setEvents(prev);
        }
    }

    async function deleteEvent(id: number) {
        const prev = events;
        setEvents((s) => s.filter((x) => x.id !== id));
        try {
            const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setOpenEdit(false);
            setDraft(null);
        } catch {
            setErr("Suppression impossible.");
            setEvents(prev);
        }
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]">
            {/* Header de la carte */}
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Planning des événements</h2>
                <div className="flex items-center gap-2">
                    {err && (
                        <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-200">
              {err}
            </span>
                    )}
                    <button
                        onClick={() => openCreateModal()}
                        className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3.5 py-2 text-sm font-medium text-white hover:from-fuchsia-500 hover:to-violet-500"
                    >
                        + Nouvel événement
                    </button>
                </div>
            </div>

            {/* Zone scrollable interne — borne la hauteur du calendrier */}
            <div className="h-[70vh] overflow-y-auto rounded-xl border border-white/5 bg-black/10 p-2">
            {loading ? (
                    <div className="h-[540px] animate-pulse rounded-lg bg-white/10" />
                ) : (
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth,timeGridWeek,timeGridDay",
                        }}
                        height="100%"          // occupe la hauteur du conteneur scrollable
                        contentHeight="auto"
                        expandRows
                        firstDay={1}
                        locale="fr"
                        nowIndicator
                        editable
                        eventStartEditable
                        eventDurationEditable
                        selectable
                        selectMirror
                        events={fcEvents}
                        select={(arg: any) => {
                            openCreateModal({
                                date_debut: arg.start?.toISOString(),
                                date_fin: arg.end?.toISOString() || arg.start?.toISOString(),
                            });
                        }}
                        eventClick={(arg: any) => {
                            const id = Number(arg?.event?.id);
                            if (!Number.isFinite(id)) return;
                            openEditModal(id);
                        }}
                        eventDrop={(arg: any) => {
                            const id = Number(arg.event.id);
                            const start = arg.event.start?.toISOString();
                            const end = arg.event.end?.toISOString();
                            if (!start) return arg.revert();
                            persistDates(id, start, end, arg.revert);
                        }}
                        eventResize={(arg: any) => {
                            const id = Number(arg.event.id);
                            const start = arg.event.start?.toISOString();
                            const end = arg.event.end?.toISOString();
                            if (!start) return arg.revert();
                            persistDates(id, start, end, arg.revert);
                        }}
                        dayMaxEventRows
                    />
                )}
            </div>

            <p className="mt-3 text-xs text-slate-400">
                Sélectionne un créneau pour créer un événement. Clique sur un événement pour l’éditer. Déplacer/redimensionner sauvegarde automatiquement.
            </p>

            {/* Modales */}
            {openCreate && draft && meta && (
                <EventModal
                    title="Créer un événement"
                    initial={draft}
                    meta={meta}
                    onClose={() => { setOpenCreate(false); setDraft(null); }}
                    onSubmit={(v) => submitCreate(v)}
                    submitLabel="Créer"
                />
            )}

            {openEdit && draft && meta && (
                <EventModal
                    title="Éditer l’événement"
                    initial={draft}
                    meta={meta}
                    onClose={() => { setOpenEdit(false); setDraft(null); }}
                    onSubmit={(v) => submitEdit({ ...v, id: draft.id as number })}
                    submitLabel="Enregistrer"
                    onDelete={draft.id ? () => deleteEvent(draft.id as number) : undefined}
                />
            )}
        </div>
    );
}

/* ========= Modal + formulaire ========= */

function EventModal({
                        title,
                        initial,
                        meta,
                        onClose,
                        onSubmit,
                        submitLabel,
                        onDelete,
                    }: {
    title: string;
    initial: Partial<Ev>;
    meta: MetaPayload;
    onClose: () => void;
    onSubmit: (values: DraftValues) => Promise<void> | void;
    submitLabel: string;
    onDelete?: () => Promise<void> | void;
}) {
    // Pré-remplir à partir de l'event (edit) ou des defaults (create)
    const [values, setValues] = useState<DraftValues>(() => {
        const artisteIds =
            initial.artistes?.map((a) => a.artiste.id) ??
            (Array.isArray((initial as any).artiste_ids) ? (initial as any).artiste_ids : []);
        const genreIds =
            initial.genres?.map((g) => g.genre.id) ??
            (Array.isArray((initial as any).genre_ids) ? (initial as any).genre_ids : []);
        const poiIds =
            (initial as any)?.pois?.map((p: any) => p.poi.id) ??
            (Array.isArray((initial as any).poi_ids) ? (initial as any).poi_ids : []);
        const lieuId =
            initial.lieu?.id ??
            (typeof (initial as any).lieu_id === "number" ? (initial as any).lieu_id : null);

        return {
            id: initial.id,
            titre: initial.titre || "",
            description: initial.description || "",
            categorie: initial.categorie || "CONCERT",
            date_debut: initial.date_debut || new Date().toISOString(),
            date_fin: initial.date_fin || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            lieu_id: lieuId ?? null,
            artiste_ids: artisteIds,
            genre_ids: genreIds,
            poi_ids: poiIds,
        };
    });
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    function set<K extends keyof DraftValues>(k: K, v: DraftValues[K]) {
        setValues((s) => ({ ...s, [k]: v }));
    }
    function toggleId(list: number[], id: number) {
        return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
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
            <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200 backdrop-blur-md shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)]">
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
                    {/* Titre + Catégorie */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Titre</label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-white/20 focus:ring-2 focus:ring-fuchsia-500/30"
                                value={values.titre}
                                onChange={(e) => set("titre", e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Catégorie</label>
                            <select
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={values.categorie}
                                onChange={(e) => set("categorie", e.target.value as DraftValues["categorie"])}
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Début</label>
                            <input
                                type="datetime-local"
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={isoToLocalInput(values.date_debut)}
                                onChange={(e) => set("date_debut", localInputToIso(e.target.value))}
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-400">Fin</label>
                            <input
                                type="datetime-local"
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                value={isoToLocalInput(values.date_fin)}
                                onChange={(e) => set("date_fin", localInputToIso(e.target.value))}
                                required
                            />
                        </div>
                    </div>

                    {/* Lieu (select simple) */}
                    <div>
                        <label className="mb-1 block text-xs text-slate-400">Lieu</label>
                        <select
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                            value={values.lieu_id ?? ""}
                            onChange={(e) => set("lieu_id", e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">— Aucun</option>
                            {meta.lieux.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.nom}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Multi sélections: Artistes / Genres / POI */}
                    <div className="grid gap-3 sm:grid-cols-3">
                        <CheckList
                            title="Artistes"
                            items={meta.artistes}
                            selected={values.artiste_ids}
                            onToggle={(id) => set("artiste_ids", toggleId(values.artiste_ids, id))}
                        />
                        <CheckList
                            title="Genres"
                            items={meta.genres}
                            selected={values.genre_ids}
                            onToggle={(id) => set("genre_ids", toggleId(values.genre_ids, id))}
                        />
                        <CheckList
                            title="POI"
                            items={meta.pois}
                            selected={values.poi_ids}
                            onToggle={(id) => set("poi_ids", toggleId(values.poi_ids, id))}
                        />
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
                        ) : (
                            <span />
                        )}
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

/* ========= Sous-composant : CheckList (multi-select à cases + chips) ========= */
function CheckList({
                       title,
                       items,
                       selected,
                       onToggle,
                   }: {
    title: string;
    items: Simple[];
    selected: number[];
    onToggle: (id: number) => void;
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="mb-2 text-xs font-medium text-slate-300">{title}</p>
            <div className="max-h-44 space-y-1 overflow-auto pr-1">
                {items.map((it) => {
                    const checked = selected.includes(it.id);
                    return (
                        <label key={it.id} className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="accent-fuchsia-600"
                                checked={checked}
                                onChange={() => onToggle(it.id)}
                            />
                            <span className="truncate">{it.nom}</span>
                        </label>
                    );
                })}
            </div>
            {selected.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {selected.map((id) => {
                        const it = items.find((x) => x.id === id);
                        if (!it) return null;
                        return (
                            <span key={id} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {it.nom}
              </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
