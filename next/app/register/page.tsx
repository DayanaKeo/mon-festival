'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
    const [form, setForm] = useState({ nom: '', email: '', password: '' })
    const [msg, setMsg] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPwd, setShowPwd] = useState(false)
    const [touched, setTouched] = useState<{nom:boolean;email:boolean;password:boolean}>({nom:false,email:false,password:false})

    function isEmail(v:string){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
    const pwdScore = useMemo(()=>{
        let s = 0
        if(form.password.length >= 8) s++
        if(/[A-Z]/.test(form.password)) s++
        if(/[0-9]/.test(form.password)) s++
        if(/[^A-Za-z0-9]/.test(form.password)) s++
        return s
    },[form.password])

    const errors = {
        nom: form.nom.trim().length < 2 ? 'Nom trop court' : '',
        email: !isEmail(form.email) ? 'Email invalide' : '',
        password: pwdScore < 2 ? 'Mot de passe trop faible' : ''
    }
    const isValid = !errors.nom && !errors.email && !errors.password

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setTouched({nom:true,email:true,password:true})
        if(!isValid) return
        setMsg('')
        setLoading(true)
        try{
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            const data = await res.json()
            setMsg(data.message || data.error || '')
        }catch{
            setMsg('Impossible de créer le compte pour le moment')
        }finally{
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-fuchsia-600/30 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-600/30 blur-3xl animate-pulse" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),rgba(2,6,23,0))]"></div>

            <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
                <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-extrabold tracking-tight">Crée ton compte</h1>
                        <p className="mt-2 text-sm text-white/70">Rejoins le festival en quelques secondes</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                placeholder="Nom complet"
                                className={`w-full rounded-xl border bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none transition focus:ring-2 focus:ring-fuchsia-500 ${touched.nom && errors.nom ? 'border-red-500/60' : 'border-white/15'}`}
                                value={form.nom}
                                onBlur={()=>setTouched(v=>({...v,nom:true}))}
                                onChange={e => setForm({ ...form, nom: e.target.value })}
                            />
                            {touched.nom && errors.nom && <p className="mt-1 text-xs text-red-400">{errors.nom}</p>}
                        </div>

                        <div>
                            <input
                                type="email"
                                placeholder="Email"
                                className={`w-full rounded-xl border bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none transition focus:ring-2 focus:ring-fuchsia-500 ${touched.email && errors.email ? 'border-red-500/60' : 'border-white/15'}`}
                                value={form.email}
                                onBlur={()=>setTouched(v=>({...v,email:true}))}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                            />
                            {touched.email && errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                        </div>

                        <div>
                            <div className={`flex items-center rounded-xl border bg-white/10 ${touched.password && errors.password ? 'border-red-500/60' : 'border-white/15'}`}>
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    placeholder="Mot de passe"
                                    className="w-full bg-transparent px-4 py-3 text-white placeholder-white/50 outline-none"
                                    value={form.password}
                                    onBlur={()=>setTouched(v=>({...v,password:true}))}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={()=>setShowPwd(s=>!s)}
                                    className="mx-2 rounded-lg px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                                >
                                    {showPwd ? 'Masquer' : 'Afficher'}
                                </button>
                            </div>

                            <div className="mt-2 flex gap-1">
                                <span className={`h-1 w-1/4 rounded ${pwdScore>=1?'bg-red-400':'bg-white/15'}`} />
                                <span className={`h-1 w-1/4 rounded ${pwdScore>=2?'bg-orange-400':'bg-white/15'}`} />
                                <span className={`h-1 w-1/4 rounded ${pwdScore>=3?'bg-yellow-400':'bg-white/15'}`} />
                                <span className={`h-1 w-1/4 rounded ${pwdScore>=4?'bg-emerald-400':'bg-white/15'}`} />
                            </div>
                            {touched.password && errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
                            {!errors.password && form.password && <p className="mt-1 text-xs text-emerald-400">Mot de passe correct</p>}
                        </div>

                        <button
                            disabled={!isValid || loading}
                            className="mt-2 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-3 font-semibold shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? 'Création...' : 'Créer mon compte'}
                        </button>

                        {msg && (
                            <div className={`mt-2 rounded-xl px-4 py-3 text-center text-sm ${/créé|vérifiez|email/i.test(msg) ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'}`}>
                                {msg}
                            </div>
                        )}

                        <p className="pt-2 text-center text-sm text-white/70">
                            Déjà un compte ?{' '}
                            <Link href="/login" className="text-fuchsia-300 underline decoration-dotted underline-offset-4 hover:text-fuchsia-200">
                                Se connecter
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}
