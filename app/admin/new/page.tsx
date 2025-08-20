'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Meta = { artistes: {id:number;nom:string}[]; genres:{id:number;nom:string}[]; lieux:{id:number;nom:string}[]; pois:{id:number;nom:string}[] }

export default function NewEventPage() {
    const router = useRouter()
    const [meta,setMeta]=useState<Meta>({artistes:[],genres:[],lieux:[],pois:[]})
    const [loading,setLoading]=useState(true)
    const [form,setForm]=useState<any>({
        titre:'', description:'', categorie:'CONCERT', date_debut:'', date_fin:'', statut:'PUBLIE', capacite:'', lieu_id:'', poi_id:'', artiste_ids:[], genre_ids:[]
    })
    const [msg,setMsg]=useState('')

    useEffect(()=>{
        fetch('/api/meta').then(r=>r.json()).then(d=>{setMeta(d);setLoading(false)})
    },[])

    async function submit(e:React.FormEvent){
        e.preventDefault()
        setMsg('')
        const body = {
            ...form,
            capacite: form.capacite?Number(form.capacite):null,
            lieu_id: form.lieu_id?Number(form.lieu_id):null,
            poi_id: form.poi_id?Number(form.poi_id):null,
            artiste_ids: form.artiste_ids.map((x:string)=>Number(x)),
            genre_ids: form.genre_ids.map((x:string)=>Number(x))
        }
        const res = await fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
        if(res.ok){ router.push('/admin') } else { const d=await res.json(); setMsg(d.error||'Erreur') }
    }

    if(loading) return <p className="p-6">Chargement...</p>

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">Créer un événement</h1>
            <form onSubmit={submit} className="space-y-3">
                <input className="border p-2 w-full" placeholder="Titre" value={form.titre} onChange={e=>setForm({...form,titre:e.target.value})}/>
                <textarea className="border p-2 w-full" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
                <div className="grid grid-cols-2 gap-3">
                    <select className="border p-2" value={form.categorie} onChange={e=>setForm({...form,categorie:e.target.value})}>
                        <option value="CONCERT">CONCERT</option>
                        <option value="CONFERENCE">CONFERENCE</option>
                        <option value="STAND">STAND</option>
                        <option value="ACTIVITE">ACTIVITE</option>
                    </select>
                    <select className="border p-2" value={form.statut} onChange={e=>setForm({...form,statut:e.target.value})}>
                        <option value="PUBLIE">PUBLIE</option>
                        <option value="BROUILLON">BROUILLON</option>
                        <option value="REPORTE">REPORTE</option>
                        <option value="ANNULE">ANNULE</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input type="datetime-local" className="border p-2" value={form.date_debut} onChange={e=>setForm({...form,date_debut:e.target.value})}/>
                    <input type="datetime-local" className="border p-2" value={form.date_fin} onChange={e=>setForm({...form,date_fin:e.target.value})}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input type="number" className="border p-2" placeholder="Capacité" value={form.capacite} onChange={e=>setForm({...form,capacite:e.target.value})}/>
                    <select className="border p-2" value={form.lieu_id} onChange={e=>setForm({...form,lieu_id:e.target.value})}>
                        <option value="">Lieu</option>
                        {meta.lieux.map(l=><option key={l.id} value={l.id}>{l.nom}</option>)}
                    </select>
                </div>
                <select className="border p-2 w-full" value={form.poi_id} onChange={e=>setForm({...form,poi_id:e.target.value})}>
                    <option value="">Point d'intérêt</option>
                    {meta.pois.map(p=><option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                    <select multiple className="border p-2 h-32" value={form.artiste_ids} onChange={e=>setForm({...form,artiste_ids:Array.from(e.target.selectedOptions).map(o=>o.value)})}>
                        {meta.artistes.map(a=><option key={a.id} value={a.id}>{a.nom}</option>)}
                    </select>
                    <select multiple className="border p-2 h-32" value={form.genre_ids} onChange={e=>setForm({...form,genre_ids:Array.from(e.target.selectedOptions).map(o=>o.value)})}>
                        {meta.genres.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}
                    </select>
                </div>
                <div className="flex gap-2">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded">Enregistrer</button>
                    <a href="/admin" className="px-4 py-2 border rounded">Annuler</a>
                </div>
                {msg && <p>{msg}</p>}
            </form>
        </div>
    )
}
