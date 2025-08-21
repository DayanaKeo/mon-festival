"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

/* ---------------- Types ---------------- */
type Ev = {
  id: number;
  titre: string;
  description: string | null;
  categorie: string;
  date_debut: string;
  date_fin: string;
  genres: { genre: { id: number; nom: string } }[];
  artistes: { artiste: { id: number; nom: string } }[];
  lieu?: { nom: string | null } | null;
};
type GenreMeta = { id: number; nom: string };

const CATEGORIES = ["CONCERT", "CONFERENCE", "STAND", "ACTIVITE"] as const;

/* --------------- Helpers UI --------------- */
function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}
function CategoryBadge({ c }: { c: string }) {
  const tone: Record<string, string> = {
    CONCERT: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/20",
    CONFERENCE: "bg-violet-500/10 text-violet-300 ring-violet-500/20",
    STAND: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
    ACTIVITE: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", tone[c] || "bg-slate-600/10 text-slate-300 ring-slate-500/20")}>
      {c}
    </span>
  );
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
  );
}

/* --------------- Mini composants --------------- */
function BellButton({ isOn, onClick, disabled = false }: { isOn: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={isOn ? "Désactiver le rappel" : "Activer le rappel (emails 60/30/15 min + notification navigateur)"}
      onClick={onClick}
      className={
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 " +
        (disabled ? "opacity-50 cursor-not-allowed " : "") +
        (isOn ? "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300 hover:bg-fuchsia-500/15" : "border-white/10 bg-white/5 text-white hover:bg-white/10")
      }
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z" />
      </svg>
    </button>
  );
}

function LoginPromptModal({ open, onClose, redirectTo = "/events" }: { open: boolean; onClose: () => void; redirectTo?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
        <h3 className="text-lg font-semibold text-white">Connecte-toi pour activer un rappel</h3>
        <p className="mt-1 text-sm text-slate-300">Email + notification navigateur (60 / 30 / 15 min avant).</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Annuler</button>
          <a href={`/login?callbackUrl=${encodeURIComponent(redirectTo)}`} className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white hover:from-fuchsia-500 hover:to-violet-500">
            Se connecter
          </a>
        </div>
      </div>
    </div>
  );
}

/** Modale de confirmation avant désactivation */
function ConfirmDeactivateModal({
  open, onCancel, onConfirm, titre,
}: { open: boolean; onCancel: () => void; onConfirm: () => void; titre: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827]/90 p-6 backdrop-blur-md">
        <h3 className="text-lg font-semibold text-white">Désactiver le rappel ?</h3>
        <p className="mt-2 text-sm text-slate-300">
          Vous ne recevrez plus d’email ni de notification pour <span className="font-medium text-slate-100">« {titre} »</span>.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Annuler</button>
          <button onClick={onConfirm} className="rounded-xl border border-red-500/30 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/25">
            Oui, désactiver
          </button>
        </div>
      </div>
    </div>
  );
}

/** Petit toast d’info/succès/erreur */
function Toast({ msg, onClose }: { msg: { type: "success" | "error" | "info"; text: string } | null; onClose: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  const style =
    msg.type === "success"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
      : msg.type === "error"
      ? "border-red-400/30 bg-red-500/10 text-red-100"
      : "border-white/10 bg-white/10 text-slate-100";
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50">
      <div className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg ${style}`}>{msg.text}</div>
    </div>
  );
}

/* ===================== Page ===================== */
export default function EventsPage() {
  const [all, setAll] = useState<Ev[]>([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [genre, setGenre] = useState<string>("");

  const [genres, setGenres] = useState<GenreMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const [elevate, setElevate] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);

  // Auth + rappels
  const { status } = useSession();
  const isAuth = status === "authenticated";
  const [activeReminders, setActiveReminders] = useState<Record<number, boolean>>({});
  const [loginOpen, setLoginOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/events");

  // Confirmation de désactivation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; titre: string } | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    const onScroll = () => setElevate(window.scrollY > 6);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    Promise.all([fetch("/api/events").then((r) => r.json()), fetch("/api/meta").then((r) => r.json())]).then(([evs, meta]) => {
      setAll(evs);
      setGenres(meta.genres);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Charger l'état des rappels si connecté
  useEffect(() => {
    if (!isAuth) { setActiveReminders({}); return; }
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<number, boolean> = {};
        (d.activeEventIds ?? []).forEach((id: number) => (map[id] = true));
        setActiveReminders(map);
      })
      .catch(() => setActiveReminders({}));
  }, [isAuth]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

  // Notif navigateur immédiate après activation
  async function notifyBrowserActivation(ev: Ev, delais: number[]) {
    try {
      if (!("Notification" in window)) return;
      let perm = Notification.permission;
      if (perm === "default") perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const body = `Vous recevrez un email ${delais.sort((a,b)=>b-a).join(" / ")} min avant « ${ev.titre} ». Début : ${fmt(ev.date_debut)}`;
      new Notification("Rappel activé ✅", { body, icon: "/icon-notif.png"});
    } catch { /* noop */ }
  }

  /** Activation (directe) ou demande de confirmation avant désactivation */
  async function onBellClick(ev: Ev) {
    const isOn = !!activeReminders[ev.id];

    if (!isAuth) {
      setRedirectTo(`/events/${ev.id}`);
      setLoginOpen(true);
      return;
    }

    if (isOn) {
      // OUVRIR LA MODALE DE PRÉVENTION
      setConfirmTarget({ id: ev.id, titre: ev.titre });
      setConfirmOpen(true);
      return;
    }

    // Activation (UI optimiste)
    setActiveReminders((m) => ({ ...m, [ev.id]: true }));
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: ev.id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({} as any));
        throw new Error(d?.error || `Erreur ${res.status}`);
      }
      const d = await res.json().catch(() => ({} as any));
      await notifyBrowserActivation(ev, Array.isArray(d?.createdDelais) ? d.createdDelais : [60,30,15]);
      setToast({ type: "success", text: "Rappel activé" });
    } catch (e: any) {
      setActiveReminders((m) => ({ ...m, [ev.id]: false })); // revert
      setToast({ type: "error", text: e?.message ?? "Impossible d’activer le rappel." });
    }
  }

  /** Confirmer la désactivation */
  async function confirmDisable() {
    if (!confirmTarget) return;
    const { id, titre } = confirmTarget;

    // On ne met PAS à jour l’UI avant la réponse — on attend le succès
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);

      // Met à jour l’état local selon la réponse serveur
      setActiveReminders((m) => ({ ...m, [id]: false }));
      const label = d?.disabledCount > 0 ? "Rappel désactivé" : (d?.note ?? "Aucun rappel à désactiver");
      setToast({ type: "success", text: label });
    } catch (e: any) {
      setToast({ type: "error", text: e?.message ?? "Échec de la désactivation." });
    } finally {
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }

  // Filtrage commun
  const filtered = useMemo(() => {
    return all.filter((e) => {
      if (debouncedQ) {
        const h = `${e.titre} ${e.description || ""} ${(e.artistes || []).map((a) => a.artiste.nom).join(" ")} ${(e.genres || []).map((g) => g.genre.nom).join(" ")}`;
        if (!h.toLowerCase().includes(debouncedQ.toLowerCase())) return false;
      }
      if (cat && e.categorie !== cat) return false;
      if (genre) {
        const has = e.genres?.some((g) => String(g.genre.id) === genre);
        if (!has) return false;
      }
      if (from && new Date(e.date_debut) < new Date(from)) return false;
      if (to && new Date(e.date_fin) > new Date(to)) return false;
      return true;
    });
  }, [all, debouncedQ, cat, from, to, genre]);

  // Séparation à venir / terminés
  const { upcomingItems, pastItems } = useMemo(() => {
    const now = new Date();
    const upcoming = filtered
      .filter((e) => new Date(e.date_fin) >= now)
      .sort((a, b) => +new Date(a.date_debut) - +new Date(b.date_debut));

    const past = filtered
      .filter((e) => new Date(e.date_fin) < now)
      .sort((a, b) => +new Date(b.date_fin) - +new Date(a.date_fin));
    return { upcomingItems: upcoming, pastItems: past };
  }, [filtered]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(1200px_600px_at_0%_0%,rgba(139,92,246,0.12),transparent_60%),radial-gradient(1000px_600px_at_100%_100%,rgba(168,85,247,0.12),transparent_60%),linear-gradient(to_bottom_right,#0b1020,#0f1324)] text-slate-200">
      {/* Header */}
      <header ref={headerRef} className={cx("sticky top-0 z-20 border-b border-white/5 backdrop-blur-md transition-shadow", elevate && "shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]")}>
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Événements</h1>
            <div className="text-sm text-slate-400">
              {upcomingItems.length} à venir • {pastItems.length} terminés
            </div>
          </div>
          {/* ... (filtres et reset identiques à ta version) ... */}
        </div>
      </header>

      {/* Liste À venir */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {loading ? (
          <ul className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</ul>
        ) : (
          <>
            {upcomingItems.length > 0 && (
              <>
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">À venir</h2>
                <ul className="space-y-3">
                  {upcomingItems.map((e) => {
                    const debut = fmt(e.date_debut);
                    const fin = fmt(e.date_fin);
                    const left: Record<string, string> = {
                      CONCERT: "border-l-fuchsia-500/60",
                      CONFERENCE: "border-l-violet-500/60",
                      STAND: "border-l-emerald-500/60",
                      ACTIVITE: "border-l-amber-500/60",
                    };
                    const isOn = !!activeReminders[e.id];
                    return (
                      <li key={e.id} className={cx("group rounded-2xl border border-white/10 bg-white/5 p-4 transition", "border-l-4", left[e.categorie] || "border-l-slate-500/60")}>
                        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-lg font-semibold text-white">{e.titre}</p>
                              <CategoryBadge c={e.categorie} />
                            </div>
                            <p className="mt-0.5 text-sm text-slate-400">
                              {debut} → {fin}{e.lieu?.nom ? ` • ${e.lieu?.nom}` : ""}
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
                            {e.description && <p className="mt-2 text-[15px] leading-relaxed text-slate-200/90">{e.description}</p>}
                          </div>

                          <div className="flex items-center gap-2">
                            <BellButton isOn={isOn} onClick={() => onBellClick(e)} />
                            <a className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3.5 py-2.5 text-sm font-semibold text-white" href={`/events/${e.id}`}>Détails</a>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {/* Section Événements terminés */}
            {pastItems.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">Événements terminés</h2>
                <ul className="space-y-3">
                  {pastItems.map((e) => {
                    const debut = fmt(e.date_debut);
                    const fin = fmt(e.date_fin);
                    const left: Record<string, string> = {
                      CONCERT: "border-l-fuchsia-500/30",
                      CONFERENCE: "border-l-violet-500/30",
                      STAND: "border-l-emerald-500/30",
                      ACTIVITE: "border-l-amber-500/30",
                    };

                    return (
                      <li
                        key={e.id}
                        className={cx(
                          "rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md",
                          "opacity-60 grayscale",
                          "border-l-4",
                          left[e.categorie] || "border-l-slate-500/60"
                        )}
                      >
                        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-lg font-semibold text-white/80">{e.titre}</p>
                              <CategoryBadge c={e.categorie} />
                            </div>
                            <p className="mt-0.5 text-sm text-slate-400">
                              {debut} → {fin}
                              {e.lieu?.nom ? ` • ${e.lieu?.nom}` : ""}
                            </p>
                            {e.genres?.length > 0 && (
                              <p className="mt-1 text-sm text-slate-400">
                                <span className="text-slate-500">Genres :</span> {e.genres.map((g) => g.genre.nom).join(", ")}
                              </p>
                            )}
                            {e.artistes?.length > 0 && (
                              <p className="text-sm text-slate-400">
                                <span className="text-slate-500">Artistes :</span> {e.artistes.map((a) => a.artiste.nom).join(", ")}
                              </p>
                            )}
                            {e.description && <p className="mt-2 text-[15px] leading-relaxed text-slate-300/70">{e.description}</p>}
                          </div>

                          {/* AUCUNE action : pas de lien, pas de cloche (non cliquable) */}
                          <div className="hidden md:block text-xs text-slate-400 select-none">Terminé</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </main>

      {/* Modales */}
      <LoginPromptModal open={loginOpen} onClose={() => setLoginOpen(false)} redirectTo={redirectTo} />
      <ConfirmDeactivateModal
        open={confirmOpen}
        titre={confirmTarget?.titre ?? ""}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        onConfirm={confirmDisable}
      />

      {/* Toast */}
      <Toast msg={toast} onClose={() => setToast(null)} />
    </div>
  );
}
