'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

function VerifiedBanner() {
    const sp = useSearchParams()
    const verified = sp.get('verified') === '1'
    if (!verified) return null
    return (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            Email vérifié. Tu peux te connecter.
        </div>
    )
}

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [showPwd, setShowPwd] = useState(false)
    const [msg, setMsg] = useState('')
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setMsg('')
        const res = await signIn('credentials', {
            email: form.email,
            password: form.password,
            redirect: false
        })
        if (res?.error) setMsg('Identifiants invalides ou email non vérifié')
        else router.push('/')
    }

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Fond en dégradés */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_15%_0%,rgba(168,85,247,.18),transparent_60%),radial-gradient(40%_35%_at_100%_100%,rgba(59,130,246,.18),transparent_55%),linear-gradient(180deg,#0b0f1a,#0b0f1a)]" />

            <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_80px_rgba(0,0,0,.35)] backdrop-blur-xl"
                >
                    <h1 className="text-center text-2xl font-extrabold tracking-tight text-white">Connexion</h1>
                    <p className="mt-2 text-center text-sm text-white/70">Ravi de te revoir</p>

                    {/* ⚠️ useSearchParams doit être dans un Suspense */}
                    <Suspense fallback={null}>
                        <VerifiedBanner />
                    </Suspense>

                    {!!msg && (
                        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
                            {msg}
                        </div>
                    )}

                    <div className="mt-6 space-y-4">
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none ring-0 focus:border-violet-500/60"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            required
                        />

                        <div className="relative">
                            <input
                                type={showPwd ? 'text' : 'password'}
                                placeholder="Mot de passe"
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-24 text-white placeholder-white/40 outline-none ring-0 focus:border-violet-500/60"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd(v => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs text-white/70 hover:bg-white/10"
                            >
                                {showPwd ? 'Masquer' : 'Afficher'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="mt-6 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110 active:scale-[.99]"
                    >
                        Se connecter
                    </button>

                    <div className="mt-4 flex items-center justify-between text-sm">
                        <Link href="/register" className="text-white/70 hover:text-white">
                            Créer un compte
                        </Link>
                        <Link href="/forgot" className="text-white/50 hover:text-white/80">
                            Mot de passe oublié
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
