import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function GET() {
    const events = await prisma.evenement.findMany({
        orderBy: { date_debut: 'asc' },
        include: { artistes: { include: { artiste: true } }, genres: { include: { genre: true } }, lieu: true, poi: true }
    })
    return NextResponse.json(events)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = {
        titre: String(body.titre),
        description: body.description ? String(body.description) : null,
        categorie: String(body.categorie),
        date_debut: new Date(body.date_debut),
        date_fin: new Date(body.date_fin),
        statut: body.statut || 'PUBLIE',
        capacite: body.capacite ?? null,
        lieu_id: body.lieu_id ?? null,
        poi_id: body.poi_id ?? null
    }

    const created = await prisma.evenement.create({
        data: {
            ...data,
            artistes: body.artiste_ids?.length ? { create: body.artiste_ids.map((id: number) => ({ artiste_id: id })) } : undefined,
            genres: body.genre_ids?.length ? { create: body.genre_ids.map((id: number) => ({ genre_id: id })) } : undefined
        }
    })
    return NextResponse.json(created, { status: 201 })
}
