'use client'

import { useState } from 'react'

export default function ForgotPage() {
    const [email, setEmail] = useState('')
    const [done, setDone] = useState(false)
    const [err, setErr] = useState('')

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setErr('')
        const res = await fetch('/api/forgot', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email }) })
        if (res.ok) setDone(true)
        else setErr('Une erreur est survenue')
    }

    return (
        <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_15%_0%,rgba(168,85,247,.18),transparent_60%),radial-gradient(40%_35%_at_100%_100%,rgba(59,130,246,.18),transparent_55%),linear-gradient(180deg,#0b0f1a,#0b0f1a)]" />
            <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
                <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_80px_rgba(0,0,0,.35)] backdrop-blur-xl">
                    <h1 className="text-center text-2xl font-extrabold tracking-tight text-white">Mot de passe oublié</h1>
                    <p className="mt-2 text-center text-sm text-white/70">On t’envoie un lien de réinitialisation</p>

                    {done ? (
                        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300">
                            Si un compte existe pour cet email, un lien vient d’être envoyé.
                        </div>
                    ) : (
                        <>
                            {!!err && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{err}</div>}
                            <div className="mt-6 space-y-4">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-violet-500/60"
                                    value={email}
                                    onChange={e=>setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="mt-6 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110">
                                Envoyer le lien
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    )
}
