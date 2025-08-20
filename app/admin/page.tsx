'use client'

import { useEffect, useState } from 'react'

export default function AdminPage() {
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/events')
            .then(res => res.json())
            .then(data => {
                setEvents(data)
                setLoading(false)
            })
    }, [])

    if (loading) return <p className="p-6">Chargement...</p>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Gestion des événements</h1>
            <a href="/admin/new" className="bg-blue-600 text-white px-4 py-2 rounded">+ Créer</a>
            <ul className="mt-4 space-y-2">
                {events.map(ev => (
                    <li key={ev.id} className="border p-3 rounded flex justify-between">
                        <div>
                            <p className="font-semibold">{ev.titre}</p>
                            <p className="text-sm text-gray-600">{ev.date_debut}</p>
                        </div>
                        <div className="space-x-2">
                            <a href={`/admin/edit/${ev.id}`} className="px-3 py-1 bg-yellow-500 text-white rounded">Éditer</a>
                            <button
                                className="px-3 py-1 bg-red-600 text-white rounded"
                                onClick={async () => {
                                    await fetch(`/api/events/${ev.id}`, { method: 'DELETE' })
                                    setEvents(events.filter(e => e.id !== ev.id))
                                }}
                            >
                                Supprimer
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
