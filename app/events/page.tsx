'use client'

import { useEffect, useMemo, useState } from 'react'

type Ev = {
    id:number; titre:string; description:string|null; categorie:string; date_debut:string; date_fin:string
    genres:{ genre:{ id:number; nom:string } }[]
    artistes:{ artiste:{ id:number; nom:string } }[]
    lieu?:{ nom:string|null }|null
}

const CATEGORIES = ['CONCERT','CONFERENCE','STAND','ACTIVITE']

export default function EventsPage(){
    const [all,setAll]=useState<Ev[]>([])
    const [q,setQ]=useState('')
    const [cat,setCat]=useState<string>('')
    const [from,setFrom]=useState<string>('')
    const [to,setTo]=useState<string>('')
    const [genre,setGenre]=useState<string>('')

    const [genres,setGenres]=useState<{id:number;nom:string}[]>([])
    const [loading,setLoading]=useState(true)

    useEffect(()=>{
        Promise.all([
            fetch('/api/events').then(r=>r.json()),
            fetch('/api/meta').then(r=>r.json())
        ]).then(([evs,meta])=>{
            setAll(evs)
            setGenres(meta.genres)
            setLoading(false)
        })
    },[])

    const items = useMemo(()=>{
        return all.filter(e=>{
            if(q){
                const h = `${e.titre} ${e.description||''} ${(e.artistes||[]).map(a=>a.artiste.nom).join(' ')} ${(e.genres||[]).map(g=>g.genre.nom).join(' ')}`
                if(!h.toLowerCase().includes(q.toLowerCase())) return false
            }
            if(cat && e.categorie!==cat) return false
            if(genre){
                const has = e.genres?.some(g=>String(g.genre.id)===genre)
                if(!has) return false
            }
            if(from && new Date(e.date_debut) < new Date(from)) return false
            if(to && new Date(e.date_fin) > new Date(to)) return false
            return true
        }).sort((a,b)=>+new Date(a.date_debut)-+new Date(b.date_debut))
    },[all,q,cat,from,to,genre])

    if(loading) return <p className="p-6">Chargement...</p>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Événements</h1>

            <div className="grid md:grid-cols-5 gap-3 mb-4">
                <input className="border p-2 w-full md:col-span-2" placeholder="Recherche (titre, artiste, genre)" value={q} onChange={e=>setQ(e.target.value)} />
                <select className="border p-2" value={cat} onChange={e=>setCat(e.target.value)}>
                    <option value="">Catégorie</option>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select className="border p-2" value={genre} onChange={e=>setGenre(e.target.value)}>
                    <option value="">Genre</option>
                    {genres.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}
                </select>
                <div className="flex gap-2">
                    <input type="datetime-local" className="border p-2 flex-1" value={from} onChange={e=>setFrom(e.target.value)} />
                    <input type="datetime-local" className="border p-2 flex-1" value={to} onChange={e=>setTo(e.target.value)} />
                </div>
            </div>

            <ul className="space-y-3">
                {items.map(e=>{
                    const debut = new Date(e.date_debut).toLocaleString()
                    const fin = new Date(e.date_fin).toLocaleString()
                    return (
                        <li key={e.id} className="border rounded p-4">
                            <div className="flex justify-between items-center gap-3">
                                <div>
                                    <p className="text-lg font-semibold">{e.titre}</p>
                                    <p className="text-sm text-gray-600">{e.categorie} • {debut} → {fin}{e.lieu?.nom ? ` • ${e.lieu?.nom}`:''}</p>
                                    {e.genres?.length>0 && <p className="text-sm mt-1">Genres : {e.genres.map(g=>g.genre.nom).join(', ')}</p>}
                                    {e.artistes?.length>0 && <p className="text-sm">Artistes : {e.artistes.map(a=>a.artiste.nom).join(', ')}</p>}
                                    {e.description && <p className="mt-2">{e.description}</p>}
                                </div>
                                <a className="px-3 py-2 bg-blue-600 text-white rounded shrink-0" href={`/events/${e.id}`}>Détails</a>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
