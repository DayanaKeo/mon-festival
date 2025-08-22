import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createResetToken } from '@/lib/resetTokens'
import { sendPasswordResetEmail } from '@/lib/mailer'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()
        if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

        const user = await prisma.utilisateur.findUnique({ where: { email } })

        if (user) {
            const token = await createResetToken(email)
            await sendPasswordResetEmail(email, token)
        }

        return NextResponse.json({ ok: true }) // pas de fuite d’info
    } catch {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
