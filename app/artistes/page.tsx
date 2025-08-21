"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

// Artiste type based on your API
interface Artiste {
  id: number;
  nom: string;
  style_principal?: string | null;
  genres_secondaires?: string[] | null;
  photo_url?: string | null;
  description?: string;
}

function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function GenreBadge({ nom }: { nom: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-fuchsia-500/10 text-fuchsia-300 ring-1 ring-inset ring-fuchsia-500/20 px-2.5 py-1 text-xs font-medium">
      {nom}
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
        </div>
        <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
      </div>
    </li>
  );
}

export default function ArtistesPage() {
  const [artistes, setArtistes] = useState<Artiste[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/artistes")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setArtistes(data);
        } else {
          setArtistes([]); // fallback if API returns error object
        }
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!q) return artistes;
    return artistes.filter((a) =>
      a.nom.toLowerCase().includes(q.toLowerCase()) ||
      (a.description || "").toLowerCase().includes(q.toLowerCase())
    );
  }, [artistes, q]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(1200px_600px_at_0%_0%,rgba(139,92,246,0.12),transparent_60%),radial-gradient(1000px_600px_at_100%_100%,rgba(168,85,247,0.12),transparent_60%),linear-gradient(to_bottom_right,#0b1020,#0f1324)] text-slate-200">
      <header className="sticky top-0 z-20 border-b border-white/5 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Artistes</h1>
          <div className="text-sm text-slate-400">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-4">
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-400 outline-none focus:border-white/20 focus:ring-2 focus:ring-fuchsia-500/30"
            placeholder="Recherche (nom, description)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {loading ? (
          <ul className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</ul>
        ) : filtered.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <p className="text-lg font-semibold text-white">Aucun artiste trouvé</p>
            <p className="mt-1 text-sm text-slate-400">Ajuste la recherche pour affiner.</p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <li key={a.id}>
                <a
                  href={`/artistes/${a.id}`}
                  className="group flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-300 hover:bg-white/7 hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)] hover:scale-105 hover:rotate-1 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  style={{ textDecoration: 'none' }}
                >
                  {a.photo_url ? (
                    <img
                      src={a.photo_url}
                      alt={a.nom}
                      className="w-full aspect-square object-cover rounded-2xl border border-white/10 bg-white/10 mb-4"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-2xl bg-white/10 flex items-center justify-center text-4xl text-fuchsia-400 font-bold mb-4">
                      {a.nom?.[0] || "?"}
                    </div>
                  )}
                  <span className="mt-1 text-lg font-bold text-white text-center block w-full truncate">{a.nom}</span>
                  {a.style_principal && (
                    <span className="mt-1 text-sm text-fuchsia-300 text-center block w-full truncate">{a.style_principal}</span>
                  )}
                  {a.genres_secondaires && a.genres_secondaires.length > 0 && (
                    <span className="mt-1 text-xs text-violet-300 text-center block w-full truncate">
                      {a.genres_secondaires.join(", ")}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
