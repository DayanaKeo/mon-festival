import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/tokens'

export async function POST(req: Request) {
    try {
        const { token } = await req.json()
        if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
        const r = await verifyToken(token)
        if (!r.ok) return NextResponse.json({ error: r.reason === 'expired' ? 'Token expiré' : 'Token invalide' }, { status: 400 })
        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
