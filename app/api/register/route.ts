import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createVerificationToken } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/mailer'

export async function POST(req: Request) {
    try {
        const { nom, email, password } = await req.json()
        if (!nom || !email || !password) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

        const existing = await prisma.utilisateur.findUnique({ where: { email } })
        if (existing) return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 400 })

        const hash = await bcrypt.hash(password, 10)
        await prisma.utilisateur.create({
            data: { nom, email, mot_de_passe_hash: hash, email_verifie: false }
        })

        const token = await createVerificationToken(email)
        await sendVerificationEmail(email, nom, token)

        return NextResponse.json({ message: 'Compte créé, vérifiez vos emails.' })
    } catch {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
