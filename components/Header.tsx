'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const pathname = usePathname()
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
        <Link
            href={href}
            className={`px-3 py-2 rounded-full text-sm transition ${
                active
                    ? 'bg-white/80 text-violet-700 shadow'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
        >
            {children}
        </Link>
    )
}

export default function Header() {
    const { data: session, status } = useSession()
    const isAuth = status === 'authenticated'
    const role = (session?.user as any)?.role
    const isAdmin = isAuth && role === 'ADMIN'
    const [open, setOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50">
            <div className="absolute inset-0 h-[72px] bg-gradient-to-b from-black/60 to-black/30 backdrop-blur-md" />
            <div className="relative mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between px-4">
                <Link
                    href="/"
                    className="font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 text-2xl"
                >
                    Aurora Fest
                </Link>

                {/* Menu desktop */}
                <nav className="hidden md:flex items-center gap-2">
                    <NavLink href="/events">Événements</NavLink>
                    {isAuth && <NavLink href="/favorites">Mes Favoris</NavLink>}
                    {isAdmin && <NavLink href="/admin">Admin</NavLink>}
                    {!isAuth && <NavLink href="/login">Connexion</NavLink>}
                    {!isAuth && <NavLink href="/register">Inscription</NavLink>}
                    {isAuth && (
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="px-3 py-2 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white text-sm shadow hover:brightness-110 transition"
                        >
                            Déconnexion
                        </button>
                    )}
                </nav>

                {/* Burger menu */}
                <button
                    onClick={() => setOpen(!open)}
                    className="md:hidden text-white/90 px-3 py-2 rounded-lg hover:bg-white/10 transition"
                >
                    ☰
                </button>
            </div>

            {/* Menu mobile */}
            {open && (
                <div className="md:hidden bg-black/70 backdrop-blur-md border-t border-white/10">
                    <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">
                        <NavLink href="/events">Événements</NavLink>
                        {isAuth && <NavLink href="/favorites">Mes Favoris</NavLink>}
                        {isAdmin && <NavLink href="/admin">Admin</NavLink>}
                        {!isAuth && <NavLink href="/login">Connexion</NavLink>}
                        {!isAuth && <NavLink href="/register">Inscription</NavLink>}
                        {isAuth && (
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="px-3 py-2 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white text-sm shadow text-left"
                            >
                                Déconnexion
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}
