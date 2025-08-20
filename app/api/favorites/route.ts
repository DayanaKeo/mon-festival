import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const url = new URL(req.url)
    const eventId = url.searchParams.get('eventId')
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ favorited: false })
    if (eventId) {
        const f = await prisma.favori.findUnique({
            where: { utilisateur_id_evenement_id: { utilisateur_id: Number((session.user as any).id || 0), evenement_id: Number(eventId) } }
        })
        return NextResponse.json({ favorited: !!f })
    }
    const list = await prisma.favori.findMany({ where: { utilisateur_id: Number((session.user as any).id || 0) } })
    return NextResponse.json(list)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { event_id } = await req.json()
    if (!event_id) return NextResponse.json({ error: 'event_id manquant' }, { status: 400 })
    await prisma.favori.create({
        data: { utilisateur_id: Number((session.user as any).id || 0), evenement_id: Number(event_id) }
    })
    return NextResponse.json({ ok: true })
}
