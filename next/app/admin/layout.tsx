"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

function cx(...xs: (string | false | null | undefined)[]) {
    return xs.filter(Boolean).join(" ");
}

const NAV = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/events", label: "Événements" },
    { href: "/admin/artistes", label: "Artistes" },
    { href: "/admin/lieux", label: "Lieux" },
    { href: "/admin/pois", label: "POI" },
    { href: "/admin/genres", label: "Genres" },
    { href: "/admin/users", label: "Utilisateurs" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [openMobile, setOpenMobile] = useState(false);

    return (
        <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_0%_0%,rgba(139,92,246,0.12),transparent_60%),radial-gradient(1000px_600px_at_100%_100%,rgba(168,85,247,0.12),transparent_60%),linear-gradient(to_bottom_right,#0b1020,#0f1324)] text-slate-200">
            <div className="mx-auto flex max-w-7xl">
                {/* Sidebar (desktop) */}
                <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/5 bg-white/5/10 px-3 py-6 backdrop-blur md:block">
                    <div className="mb-6 px-2">
                        <Link href="/admin" className="text-lg font-semibold text-white">
                            Aurora · Admin
                        </Link>
                    </div>
                    <nav className="space-y-1">
                        {NAV.map((item) => {
                            const active =
                                pathname === item.href ||
                                (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cx(
                                        "block rounded-xl px-3 py-2 text-sm transition",
                                        active
                                            ? "bg-white/15 text-white"
                                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="mt-6 px-2">
                        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
                            ← Retour au site
                        </Link>
                    </div>
                </aside>

                {/* Mobile topbar + drawer */}
                <div className="md:hidden fixed inset-x-0 top-0 z-20 border-b border-white/5 bg-black/30 backdrop-blur">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                        <Link href="/admin" className="text-base font-semibold text-white">
                            Aurora · Admin
                        </Link>
                        <button
                            onClick={() => setOpenMobile((v) => !v)}
                            className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-sm"
                        >
                            {openMobile ? "Fermer" : "Menu"}
                        </button>
                    </div>
                    {openMobile && (
                        <div className="border-t border-white/5 px-2 pb-2">
                            {NAV.map((item) => {
                                const active =
                                    pathname === item.href ||
                                    (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpenMobile(false)}
                                        className={cx(
                                            "mt-2 block rounded-xl px-3 py-2 text-sm",
                                            active
                                                ? "bg-white/15 text-white"
                                                : "text-slate-300 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                            <div className="px-3 pb-2 pt-2">
                                <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
                                    ← Retour au site
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main */}
                <main className="flex-1 px-3 pb-10 pt-16 md:px-6 md:pt-6 md:ml-0">
                    {/* Top header (in content) */}
                    <header className="sticky top-0 z-10 -mx-3 mb-4 border-b border-white/5 bg-transparent/30 px-3 py-3 backdrop-blur md:static md:mx-0 md:px-0 md:py-0 md:border-none md:backdrop-blur-0">
                        <div className="hidden items-center justify-between md:flex">
                            <h1 className="text-xl font-semibold text-white">Administration</h1>
                            <div className="text-xs text-slate-400">Session active</div>
                        </div>
                    </header>

                    <div className="pt-2 md:pt-0">{children}</div>
                </main>
            </div>
        </div>
    );
}
