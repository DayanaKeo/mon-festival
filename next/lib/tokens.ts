import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export async function createVerificationToken(email: string) {
    const raw = crypto.randomBytes(32).toString('hex')
    const hash = crypto.createHash('sha256').update(raw).digest('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.verificationToken.create({
        data: { identifier: email, token: hash, expires }
    })
    return raw
}

export async function verifyToken(raw: string) {
    const hash = crypto.createHash('sha256').update(raw).digest('hex')
    const record = await prisma.verificationToken.findUnique({ where: { token: hash } })
    if (!record) return { ok: false, reason: 'invalid' }
    if (record.expires < new Date()) {
        await prisma.verificationToken.delete({ where: { token: hash } })
        return { ok: false, reason: 'expired' }
    }
    await prisma.utilisateur.update({ where: { email: record.identifier }, data: { email_verifie: true } })
    await prisma.verificationToken.delete({ where: { token: hash } })
    return { ok: true }
}
