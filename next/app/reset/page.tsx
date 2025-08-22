'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetInner() {
    const sp = useSearchParams()
    const router = useRouter()
    const token = sp.get('token') || ''
    const [pwd, setPwd] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [msg, setMsg] = useState('')
    const [ok, setOk] = useState(false)

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setMsg('')
        const res = await fetch('/api/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password: pwd })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) { setMsg(data.error || 'Erreur'); return }
        setOk(true)
        setTimeout(() => router.push('/login'), 1500)
    }

    return (
        <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_15%_0%,rgba(168,85,247,.18),transparent_60%),radial-gradient(40%_35%_at_100%_100%,rgba(59,130,246,.18),transparent_55%),linear-gradient(180deg,#0b0f1a,#0b0f1a)]" />
            <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
                <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_80px_rgba(0,0,0,.35)] backdrop-blur-xl">
                    <h1 className="text-center text-2xl font-extrabold tracking-tight text-white">Nouveau mot de passe</h1>
                    <p className="mt-2 text-center text-sm text-white/70">Choisis un mot de passe</p>

                    {!!msg && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{msg}</div>}
                    {ok && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">Mot de passe mis à jour</div>}

                    <div className="mt-6 space-y-4">
                        <div className="relative">
                            <input
                                type={showPwd ? 'text' : 'password'}
                                placeholder="Nouveau mot de passe"
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-24 text-white placeholder-white/40 outline-none focus:border-violet-500/60"
                                value={pwd}
                                onChange={e => setPwd(e.target.value)}
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

                    <button type="submit" className="mt-6 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110">
                        Mettre à jour
                    </button>
                </form>
            </div>
        </div>
    )
}

export default function ResetPage() {
    return (
        <Suspense fallback={null}>
            <ResetInner />
        </Suspense>
    )
}
