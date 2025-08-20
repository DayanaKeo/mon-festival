import type { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
    session: { strategy: 'jwt' },
    providers: [
        Credentials({
            credentials: { email: {}, password: {} },
            authorize: async (c) => {
                if (!c?.email || !c?.password) return null
                const user = await prisma.utilisateur.findUnique({ where: { email: String(c.email) } })
                if (!user || !user.email_verifie) return null
                const ok = await bcrypt.compare(String(c.password), user.mot_de_passe_hash)
                if (!ok) return null
                return { id: String(user.id), email: user.email, name: user.nom, role: user.role }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = (user as any).id
                token.role = (user as any).role
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                ;(session.user as any).id = token.id
                ;(session.user as any).role = token.role
            }
            return session
        }
    },
    pages: { signIn: '/login' },
    secret: process.env.NEXTAUTH_SECRET
}
