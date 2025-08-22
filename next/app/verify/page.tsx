'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function VerifyInner() {
    const sp = useSearchParams()
    const router = useRouter()
    const token = sp.get('token') || ''
    const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
    const [msg, setMsg] = useState('')

    useEffect(() => {
        if (!token) { setState('error'); setMsg('Lien invalide'); return }
        fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        })
            .then(r => r.json())
            .then(d => {
                if (d.ok) {
                    setState('ok'); setMsg('Adresse e-mail vérifiée')
                    setTimeout(() => router.push('/login?verified=1'), 1800)
                } else {
                    setState('error'); setMsg(d.error || 'Vérification impossible')
                }
            })
            .catch(() => { setState('error'); setMsg('Erreur réseau') })
    }, [token, router])

    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
            <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur-xl text-center">
                <h1 className="text-2xl font-extrabold">Vérification</h1>
                <p className="mt-2 text-white/80">
                    {state === 'loading' ? 'Traitement en cours…' : msg}
                </p>
                {state === 'error' && (
                    <div className="mt-6">
                        <Link href="/login" className="px-5 py-3 rounded-xl bg-white/15 border border-white/30 hover:bg-white/25 inline-block">
                            Aller à la connexion
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function VerifyPage() {
    return (
        <Suspense fallback={null}>
            <VerifyInner />
        </Suspense>
    )
}
