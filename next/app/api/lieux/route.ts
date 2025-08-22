import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// petite normalisation des nombres décimaux (accepte number | string | null)
function normDecimal(v: unknown): string | null {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number" && Number.isFinite(v)) return v.toString();
    if (typeof v === "string") {
        const t = v.trim().replace(",", "."); // autorise "49,1234"
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
        adresse = null,
        ville = null,
        pays = null,
        latitude = null,
        longitude = null,
        description = null,
    } = body || {};
    return {
        nom,
        adresse,
        ville,
        pays,
        latitude: normDecimal(latitude),
        longitude: normDecimal(longitude),
        description,
    };
}

// GET /api/lieux
export async function GET() {
    try {
        const lieux = await prisma.lieu.findMany({
            orderBy: [{ nom: "asc" }, { ville: "asc" }],
            include: {
                _count: { select: { pois: true, evenements: true } },
            },
        });
        return NextResponse.json(lieux);
    } catch {
        return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
}

// POST /api/lieux
export async function POST(req: Request) {
    try {
        const data = normDraft(await req.json());
        if (!data.nom || typeof data.nom !== "string") {
            return NextResponse.json({ error: "Nom obligatoire" }, { status: 400 });
        }

        const created = await prisma.lieu.create({ data });
        return NextResponse.json(created, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Impossible de créer" }, { status: 500 });
    }
}
