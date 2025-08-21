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

/**
 * @swagger
 * /api/lieux:
 *   get:
 *     summary: Récupérer tous les lieux
 *     description: Récupère la liste de tous les lieux, triés par nom et ville, avec le nombre de points d'intérêt et d'événements associés.
 *     responses:
 *       200:
 *         description: Liste des lieux récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nom:
 *                     type: string
 *                   adresse:
 *                     type: string
 *                   ville:
 *                     type: string
 *                   pays:
 *                     type: string
 *                   latitude:
 *                     type: string
 *                   longitude:
 *                     type: string
 *                   description:
 *                     type: string
 *                   _count:
 *                     type: object
 *                     properties:
 *                       pois:
 *                         type: integer
 *                       evenements:
 *                         type: integer
 *       500:
 *         description: Erreur serveur
 *   post:
 *     summary: Créer un nouveau lieu
 *     description: Permet de créer un nouveau lieu en fournissant les informations nécessaires.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Le nom du lieu
 *               adresse:
 *                 type: string
 *                 description: L'adresse du lieu
 *               ville:
 *                 type: string
 *                 description: La ville du lieu
 *               pays:
 *                 type: string
 *                 description: Le pays du lieu
 *               latitude:
 *                 type: string
 *                 description: La latitude du lieu
 *               longitude:
 *                 type: string
 *                 description: La longitude du lieu
 *               description:
 *                 type: string
 *                 description: Une description du lieu
 *             required:
 *               - nom
 *     responses:
 *       201:
 *         description: Lieu créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nom:
 *                   type: string
 *                 adresse:
 *                   type: string
 *                 ville:
 *                   type: string
 *                 pays:
 *                   type: string
 *                 latitude:
 *                   type: string
 *                 longitude:
 *                   type: string
 *                 description:
 *                   type: string
 *       400:
 *         description: Le nom est obligatoire
 *       500:
 *         description: Erreur serveur
 */

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
