import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await ctx.params
    await prisma.favori.delete({
        where: { utilisateur_id_evenement_id: { utilisateur_id: Number((session.user as any).id || 0), evenement_id: Number(id) } }
    })
    return NextResponse.json({ ok: true })
}
