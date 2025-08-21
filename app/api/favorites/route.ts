/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Récupérer les favoris
 *     description: Récupère la liste des événements favoris de l'utilisateur connecté ou vérifie si un événement spécifique est favorisé.
 *     parameters:
 *       - name: eventId
 *         in: query
 *         required: false
 *         description: ID de l'événement à vérifier
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des événements favoris ou état de favori pour un événement spécifique
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     favorited:
 *                       type: boolean
 *                 - type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       utilisateur_id:
 *                         type: integer
 *                       evenement_id:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *   post:
 *     summary: Ajouter un événement aux favoris
 *     description: Ajoute un événement à la liste des favoris de l'utilisateur connecté.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_id:
 *                 type: integer
 *             required:
 *               - event_id
 *     responses:
 *       200:
 *         description: Événement ajouté aux favoris avec succès
 *       400:
 *         description: Paramètre `event_id` manquant
 *       401:
 *         description: Utilisateur non autorisé
 *   delete:
 *     summary: Supprimer un événement des favoris
 *     description: Supprime un événement de la liste des favoris de l'utilisateur connecté.
 *     parameters:
 *       - name: eventId
 *         in: query
 *         required: true
 *         description: ID de l'événement à supprimer des favoris
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Événement supprimé des favoris avec succès
 *       400:
 *         description: Paramètre `eventId` manquant
 *       401:
 *         description: Utilisateur non autorisé
 */

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
