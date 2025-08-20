import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: Request) {
    const url = new URL(req.url)
    const pathname = url.pathname
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (pathname.startsWith('/admin')) {
        if (!token || token.role !== 'ADMIN') return NextResponse.redirect(new URL('/login', req.url))
    }

    if ((pathname === '/login' || pathname === '/register') && token) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*','/login','/register']
}
