import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Mot de passe", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null
                const user = await prisma.utilisateur.findUnique({ where: { email: credentials.email } })
                if (!user || !user.email_verifie) return null
                const ok = await bcrypt.compare(credentials.password, user.mot_de_passe_hash)
                if (!ok) return null
                return { id: String(user.id), name: user.nom, email: user.email, role: (user as any).role ?? "USER" }
            }
        })
    ],
    pages: { signIn: "/login" },
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) token.role = (user as any).role ?? "USER"
            return token
        },
        async session({ session, token }) {
            if (token) (session.user as any).role = (token as any).role ?? "USER"
            return session
        }
    }
})
