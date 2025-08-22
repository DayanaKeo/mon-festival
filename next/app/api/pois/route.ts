import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Normalise décimales (number | string "48,85" | vide) → string|null (Prisma.Decimal)
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
        type, // doit être une valeur de l'enum TypePOI
        lieu_id: typeof lieu_id === "number" ? lieu_id : lieu_id ? Number(lieu_id) : null,
        latitude: normDecimal(latitude),
        longitude: normDecimal(longitude),
        description,
    };
}

// GET /api/pois
export async function GET() {
    try {
        const pois = await prisma.pointInteret.findMany({
            orderBy: [{ nom: "asc" }],
            include: {
                lieu: { select: { id: true, nom: true } },
                _count: { select: { evenements: true } },
            },
        });
        return NextResponse.json(pois);
    } catch {
        return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
}

// POST /api/pois
export async function POST(req: Request) {
    try {
        const data = normDraft(await req.json());
        if (!data.nom || typeof data.nom !== "string") {
            return NextResponse.json({ error: "Nom obligatoire" }, { status: 400 });
        }
        if (!data.type || typeof data.type !== "string") {
            return NextResponse.json({ error: "Type obligatoire" }, { status: 400 });
        }

        const created = await prisma.pointInteret.create({ data });
        return NextResponse.json(created, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Impossible de créer" }, { status: 500 });
    }
}
