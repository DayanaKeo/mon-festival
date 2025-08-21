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

// PUT /api/artistes/[id]
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (!Number.isFinite(id)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

        const data = normDraft(await req.json());
        const updated = await prisma.artiste.update({ where: { id }, data });
        return NextResponse.json(updated);
    } catch (e: any) {
        if (e?.code === "P2002") {
            return NextResponse.json({ error: "Un artiste avec ce nom existe déjà." }, { status: 409 });
        }
        return NextResponse.json({ error: "Impossible de mettre à jour" }, { status: 500 });
    }
}

// DELETE /api/artistes/[id]
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (!Number.isFinite(id)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

        await prisma.artiste.delete({ where: { id } });
        return NextResponse.json(null, { status: 204 });
    } catch {
        return NextResponse.json({ error: "Impossible de supprimer" }, { status: 500 });
    }
}
