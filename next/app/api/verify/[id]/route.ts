import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params
    const userId = Number(id)
    if (!userId) return NextResponse.json({ error: 'Invalide' }, { status: 400 })

    await prisma.utilisateur.update({
        where: { id: userId },
        data: { email_verifie: true }
    })

    return NextResponse.json({ message: 'Email vérifié avec succès' })
}
