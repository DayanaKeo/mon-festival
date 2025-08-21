import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const [artistes, genres, lieux, pois] = await Promise.all([
        prisma.artiste.findMany({ orderBy: { nom: 'asc' }, select: { id: true, nom: true } }),
        prisma.genre.findMany({ orderBy: { nom: 'asc' }, select: { id: true, nom: true } }),
        prisma.lieu.findMany({ orderBy: { nom: 'asc' }, select: { id: true, nom: true } }),
        prisma.pointInteret.findMany({ orderBy: { nom: 'asc' }, select: { id: true, nom: true } })
    ])
    return NextResponse.json({ artistes, genres, lieux, pois })
}
