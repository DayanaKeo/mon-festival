"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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
	genres_secondaires?: string[] | null;
};

function cx(...xs: (string | false | null | undefined)[]) {
	return xs.filter(Boolean).join(" ");
}

function Skeleton() {
	return (
		<div className="mx-auto max-w-3xl px-4 py-10">
			<div className="h-8 w-1/2 animate-pulse rounded bg-white/10" />
			<div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
				<div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
				<div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-white/10" />
				<div className="mt-6 space-y-2">
					<div className="h-3 w-full animate-pulse rounded bg-white/10" />
					<div className="h-3 w-5/6 animate-pulse rounded bg-white/10" />
					<div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
				</div>
			</div>
		</div>
	);
}

export default function ArtisteDetailPage() {
	const params = useParams() as { id: string };
	const [artiste, setArtiste] = useState<Artiste | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const a: Artiste = await fetch(`/api/artistes/${params.id}`).then((r) => r.json());
				if (!mounted) return;
				setArtiste(a && a.id ? a : null);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [params.id]);

	if (loading)
		return (
			<div className="min-h-screen bg-[radial-gradient(1200px_600px_at_0%_0%,rgba(139,92,246,0.12),transparent_60%),radial-gradient(1000px_600px_at_100%_100%,rgba(168,85,247,0.12),transparent_60%),linear-gradient(to_bottom_right,#0b1020,#0f1324)] text-slate-200">
				<Skeleton />
			</div>
		);

	if (!artiste?.id)
		return (
			<div className="min-h-screen bg-[radial-gradient(1200px_600px_at_0%_0%,rgba(139,92,246,0.12),transparent_60%),radial-gradient(1000px_600px_at_100%_100%,rgba(168,85,247,0.12),transparent_60%),linear-gradient(to_bottom_right,#0b1020,#0f1324)] px-4 py-10 text-slate-200">
				<div className="mx-auto max-w-3xl">
					<p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">Introuvable</p>
					<Link href="/artistes" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">← Retour à la liste</Link>
				</div>
			</div>
		);

	return (
		<div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(1200px_600px_at_0%_0%,rgba(139,92,246,0.12),transparent_60%),radial-gradient(1000px_600px_at_100%_100%,rgba(168,85,247,0.12),transparent_60%),linear-gradient(to_bottom_right,#0b1020,#0f1324)] text-slate-200">
			<div className="mx-auto max-w-3xl px-4 py-8">
				{/* Back */}
				<div className="mb-6">
					<Link href="/artistes" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">
						<span aria-hidden>←</span> Retour à la liste
					</Link>
				</div>

				{/* Card */}
				<article className={cx("rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)] backdrop-blur-md")}> 
					<header className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
						<div className="min-w-0 flex-1">
							<h1 className="truncate text-2xl font-semibold text-white">{artiste.nom}</h1>
							{artiste.style_principal && (
								<div className="mt-2 text-sm text-fuchsia-300">{artiste.style_principal}</div>
							)}
						</div>
						{artiste.photo_url && (
							<img src={artiste.photo_url} alt={artiste.nom} className="h-24 w-24 rounded-xl object-cover border border-white/10 bg-white/10" />
						)}
					</header>

					<section className="mt-6 space-y-3 text-[15px] leading-relaxed">
						{artiste.bio && <p className="text-slate-200/90">{artiste.bio}</p>}
						{artiste.genres_secondaires && artiste.genres_secondaires.length > 0 && (
							<p className="text-slate-300"><span className="text-slate-400">Genres secondaires :</span> {artiste.genres_secondaires.join(", ")}</p>
						)}
						<div className="flex flex-wrap gap-3 mt-4">
							{artiste.site_web && (
								<a href={artiste.site_web} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-fuchsia-600/10 px-3 py-1.5 text-fuchsia-300 hover:bg-fuchsia-600/20">
									🌐 Site web
								</a>
							)}
							{artiste.instagram && (
								<a href={artiste.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-pink-500/10 px-3 py-1.5 text-pink-300 hover:bg-pink-500/20">
									🟣 Instagram
								</a>
							)}
							{artiste.x && (
								<a href={artiste.x} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-slate-500/10 px-3 py-1.5 text-slate-300 hover:bg-slate-500/20">
									✖ X
								</a>
							)}
							{artiste.facebook && (
								<a href={artiste.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-1.5 text-blue-300 hover:bg-blue-500/20">
									📘 Facebook
								</a>
							)}
						</div>
					</section>
				</article>
			</div>
		</div>
	);
}
