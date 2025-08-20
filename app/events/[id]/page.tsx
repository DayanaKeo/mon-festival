'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function EventDetailPage() {
    const params = useParams() as { id: string }
    const { status } = useSession()
    const isAuth = status === 'authenticated'
    const [ev, setEv] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [fav, setFav] = useState<boolean>(false)
    const [msg, setMsg] = useState('')

    useEffect(() => {
        async function load() {
            const e = await fetch(`/api/events/${params.id}`).then(r => r.json())
            let f = { favorited: false }
            if (isAuth) {
                f = await fetch(`/api/favorites?eventId=${params.id}`).then(r => r.json()).catch(() => ({ favorited: false }))
            }
            setEv(e)
            setFav(!!f.favorited)
            setLoading(false)
        }
        load()
    }, [params.id, isAuth])

    async function toggleFav() {
        setMsg('')
        if (!ev) return
        if (!fav) {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_id: ev.id })
            })
            if (res.ok) setFav(true)
            else {
                const d = await res.json()
                setMsg(d.error || 'Erreur')
            }
        } else {
            const res = await fetch(`/api/favorites/${ev.id}`, { method: 'DELETE' })
            if (res.ok) setFav(false)
            else {
                const d = await res.json()
                setMsg(d.error || 'Erreur')
            }
        }
    }

    if (loading) return <p className="p-6">Chargement...</p>
    if (!ev?.id) return <p className="p-6">Introuvable</p>

    const debut = new Date(ev.date_debut).toLocaleString()
    const fin = new Date(ev.date_fin).toLocaleString()

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-3">
            <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold">{ev.titre}</h1>
                {isAuth && (
                    <button
                        onClick={toggleFav}
                        className={`px-3 py-2 rounded ${fav ? 'bg-red-600' : 'bg-blue-600'} text-white`}
                    >
                        {fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    </button>
                )}
            </div>
            <p className="text-sm text-gray-600">
                {ev.categorie} • {debut} → {fin}{ev.lieu?.nom ? ` • ${ev.lieu?.nom}` : ''}
            </p>
            {ev.genres?.length > 0 && <p>Genres : {ev.genres.map((g: any) => g.genre.nom).join(', ')}</p>}
            {ev.artistes?.length > 0 && <p>Artistes : {ev.artistes.map((a: any) => a.artiste.nom).join(', ')}</p>}
            {ev.description && <p className="mt-2">{ev.description}</p>}
            {msg && <p className="text-sm text-red-600">{msg}</p>}
            <a href="/events" className="inline-block mt-4 px-3 py-2 border rounded">← Retour à la liste</a>
        </div>
    )
}
