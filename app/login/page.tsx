'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' })
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
        if (res?.error) {
            setMsg('Identifiants invalides ou email non vérifié')
        } else {
            router.push('/')
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <form onSubmit={handleSubmit} className="p-6 border rounded max-w-sm w-full space-y-4">
                <h1 className="text-xl font-bold">Connexion</h1>
                <input
                    type="email"
                    placeholder="Email"
                    className="border p-2 w-full"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                />
                <input
                    type="password"
                    placeholder="Mot de passe"
                    className="border p-2 w-full"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button className="bg-green-600 text-white px-4 py-2 rounded w-full">Se connecter</button>
                {msg && <p className="text-center mt-2">{msg}</p>}
            </form>
        </div>
    )
}
