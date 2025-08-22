import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params
    const ev = await prisma.evenement.findUnique({
        where: { id: Number(id) },
        include: { artistes: { include: { artiste: true } }, genres: { include: { genre: true } }, lieu: true, poi: true }
    })
    if (!ev) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(ev)
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await ctx.params
    const body = await req.json()
    const data: any = {}
    if (body.titre !== undefined) data.titre = String(body.titre)
    if (body.description !== undefined) data.description = body.description === null ? null : String(body.description)
    if (body.categorie !== undefined) data.categorie = String(body.categorie)
    if (body.date_debut !== undefined) data.date_debut = new Date(body.date_debut)
    if (body.date_fin !== undefined) data.date_fin = new Date(body.date_fin)
    if (body.statut !== undefined) data.statut = String(body.statut)
    if (body.capacite !== undefined) data.capacite = body.capacite
    if (body.lieu_id !== undefined) data.lieu_id = body.lieu_id
    if (body.poi_id !== undefined) data.poi_id = body.poi_id

    const updated = await prisma.evenement.update({ where: { id: Number(id) }, data })
    if (Array.isArray(body.genre_ids)) {
        await prisma.evenementGenre.deleteMany({ where: { evenement_id: Number(id) } })
        await prisma.evenementGenre.createMany({ data: body.genre_ids.map((gid: number) => ({ evenement_id: Number(id), genre_id: gid })) })
    }
    if (Array.isArray(body.artiste_ids)) {
        await prisma.evenementArtiste.deleteMany({ where: { evenement_id: Number(id) } })
        await prisma.evenementArtiste.createMany({ data: body.artiste_ids.map((aid: number) => ({ evenement_id: Number(id), artiste_id: aid })) })
    }
    return NextResponse.json(updated)
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await ctx.params
    await prisma.evenement.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
}
