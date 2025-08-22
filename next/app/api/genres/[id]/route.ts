import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/genres/[id]
export async function PUT(req: Request, ctx: any) {
    try {
        const id = Number(ctx?.params?.id);
        if (!Number.isFinite(id)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

        const body = await req.json();
        const nom = (body?.nom || "").trim();
        if (!nom) return NextResponse.json({ error: "Nom obligatoire" }, { status: 400 });

        const updated = await prisma.genre.update({ where: { id }, data: { nom } });
        return NextResponse.json(updated);
    } catch (e: any) {
        if (e?.code === "P2002") {
            return NextResponse.json({ error: "Ce genre existe déjà." }, { status: 409 });
        }
        return NextResponse.json({ error: "Impossible de mettre à jour" }, { status: 500 });
    }
}

// DELETE /api/genres/[id]
export async function DELETE(_req: Request, ctx: any) {
    try {
        const id = Number(ctx?.params?.id);
        if (!Number.isFinite(id)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

        await prisma.genre.delete({ where: { id } });
        return NextResponse.json(null, { status: 204 });
    } catch {
        return NextResponse.json({ error: "Impossible de supprimer" }, { status: 500 });
    }
}
