import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normDecimal(v: unknown): string | null {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number" && Number.isFinite(v)) return v.toString();
    if (typeof v === "string") {
        const t = v.trim().replace(",", ".");
        if (t === "") return null;
        const n = Number(t);
        if (!Number.isFinite(n)) return null;
        return n.toString();
    }
    return null;
}

function normDraft(body: any) {
    const {
        nom,
        type,
        lieu_id = null,
        latitude = null,
        longitude = null,
        description = null,
    } = body || {};
    return {
        nom,
        type,
        lieu_id: typeof lieu_id === "number" ? lieu_id : lieu_id ? Number(lieu_id) : null,
        latitude: normDecimal(latitude),
        longitude: normDecimal(longitude),
        description,
    };
}

// PUT /api/pois/[id]
export async function PUT(req: Request, ctx: any) {
    try {
        const id = Number(ctx?.params?.id);
        if (!Number.isFinite(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }
        const data = normDraft(await req.json());
        const updated = await prisma.pointInteret.update({ where: { id }, data });
        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: "Impossible de mettre à jour" }, { status: 500 });
    }
}

// DELETE /api/pois/[id]
export async function DELETE(_req: Request, ctx: any) {
    try {
        const id = Number(ctx?.params?.id);
        if (!Number.isFinite(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }
        await prisma.pointInteret.delete({ where: { id } });
        return NextResponse.json(null, { status: 204 });
    } catch {
        return NextResponse.json({ error: "Impossible de supprimer" }, { status: 500 });
    }
}
