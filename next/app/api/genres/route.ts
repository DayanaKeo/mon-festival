import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/genres
export async function GET() {
    try {
        const genres = await prisma.genre.findMany({
            orderBy: { nom: "asc" },
            include: { _count: { select: { evenements: true } } },
        });
        return NextResponse.json(genres);
    } catch {
        return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
}

// POST /api/genres
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const nom = (body?.nom || "").trim();
        if (!nom) return NextResponse.json({ error: "Nom obligatoire" }, { status: 400 });

        const created = await prisma.genre.create({ data: { nom } });
        return NextResponse.json(created, { status: 201 });
    } catch (e: any) {
        if (e?.code === "P2002") {
            return NextResponse.json({ error: "Ce genre existe déjà." }, { status: 409 });
        }
        return NextResponse.json({ error: "Impossible de créer" }, { status: 500 });
    }
}
