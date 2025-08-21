import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normDraft(body: any) {
    const {
        nom,
        bio = null,
        photo_url = null,
        site_web = null,
        instagram = null,
        x = null,
        facebook = null,
        style_principal = null,
        genres_secondaires = null,
    } = body || {};

    let genres: any = null;
    if (Array.isArray(genres_secondaires)) genres = genres_secondaires;
    else if (typeof genres_secondaires === "string")
        genres = genres_secondaires.split(",").map((s: string) => s.trim()).filter(Boolean);
    else if (genres_secondaires && typeof genres_secondaires === "object") genres = genres_secondaires;

    return {
        nom,
        bio,
        photo_url,
        site_web,
        instagram,
        x,
        facebook,
        style_principal,
        genres_secondaires: genres,
    };
}

// GET /api/artistes
export async function GET() {
    try {
        const artistes = await prisma.artiste.findMany({
            orderBy: { nom: "asc" },
        });
        return NextResponse.json(artistes);
    } catch {
        return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
}

// POST /api/artistes
export async function POST(req: Request) {
    try {
        const body = normDraft(await req.json());
        if (!body.nom || typeof body.nom !== "string") {
            return NextResponse.json({ error: "Nom obligatoire" }, { status: 400 });
        }

        const created = await prisma.artiste.create({ data: body });
        return NextResponse.json(created, { status: 201 });
    } catch (e: any) {
        if (e?.code === "P2002") {
            return NextResponse.json({ error: "Un artiste avec ce nom existe déjà." }, { status: 409 });
        }
        return NextResponse.json({ error: "Impossible de créer" }, { status: 500 });
    }
}
