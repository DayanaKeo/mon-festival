import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export async function createResetToken(email: string) {
    const raw = crypto.randomBytes(32).toString('hex')
    const hash = crypto.createHash('sha256').update(raw).digest('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordResetToken.create({
        data: { identifier: email, token: hash, expires }
    })

    return raw
}

export async function consumeResetToken(raw: string) {
    const hash = crypto.createHash('sha256').update(raw).digest('hex')
    const rec = await prisma.passwordResetToken.findUnique({ where: { token: hash } })
    if (!rec) return { ok: false, reason: 'invalid' }
    if (rec.expires < new Date()) {
        await prisma.passwordResetToken.delete({ where: { token: hash } })
        return { ok: false, reason: 'expired' }
    }
    await prisma.passwordResetToken.delete({ where: { token: hash } })
    return { ok: true, email: rec.identifier }
}
