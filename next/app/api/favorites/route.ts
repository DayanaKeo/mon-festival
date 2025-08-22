import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const url = new URL(req.url)
    const eventId = url.searchParams.get('eventId')
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ favorited: false })
    const userId = Number((session.user as any).id || 0)

    if (eventId) {
        const f = await prisma.favori.findUnique({
            where: { utilisateur_id_evenement_id: { utilisateur_id: userId, evenement_id: Number(eventId) } }
        })
        return NextResponse.json({ favorited: !!f })
    }

    const list = await prisma.favori.findMany({
        where: { utilisateur_id: userId },
        select: { utilisateur_id: true, evenement_id: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(list)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = Number((session.user as any).id || 0)
    const { event_id } = await req.json()
    if (!event_id) return NextResponse.json({ error: 'event_id manquant' }, { status: 400 })

    await prisma.favori.upsert({
        where: { utilisateur_id_evenement_id: { utilisateur_id: userId, evenement_id: Number(event_id) } },
        update: {},
        create: { utilisateur_id: userId, evenement_id: Number(event_id) }
    })

    return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = Number((session.user as any).id || 0)
    const { searchParams } = new URL(req.url)
    const eventId = Number(searchParams.get('eventId') || 0)
    if (!eventId) return NextResponse.json({ error: 'eventId manquant' }, { status: 400 })

    await prisma.favori.deleteMany({
        where: { utilisateur_id: userId, evenement_id: eventId }
    })

    return NextResponse.json({ ok: true })
}
