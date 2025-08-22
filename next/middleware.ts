import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

    // Guard /admin : ADMIN seulement
    if (pathname.startsWith("/admin")) {
        if (!token || (token as any).role !== "ADMIN") {
            const url = req.nextUrl.clone();
            url.pathname = "/login";
            url.searchParams.set("from", pathname);
            return NextResponse.redirect(url);
        }
    }

    // Empêche l'accès à /login et /register si déjà connecté
    if ((pathname === "/login" || pathname === "/register") && token) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/login", "/register"],
};
