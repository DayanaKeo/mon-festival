import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { consumeResetToken } from '@/lib/resetTokens'

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json()
        if (!token || !password) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
        if (password.length < 6) return NextResponse.json({ error: 'Mot de passe trop court' }, { status: 400 })

        const r = await consumeResetToken(token)
        if (!r.ok) {
            const msg = r.reason === 'expired' ? 'Lien expiré' : 'Lien invalide'
            return NextResponse.json({ error: msg }, { status: 400 })
        }

        await prisma.utilisateur.update({
            where: { email: r.email! },
            data: { mot_de_passe_hash: await bcrypt.hash(password, 10) }
        })

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
