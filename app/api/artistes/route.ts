/**
 * @swagger
 * /api/artistes:
 *   get:
 *     summary: Récupérer tous les artistes
 *     responses:
 *       200:
 *         description: Liste des artistes
 */
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

/**
 * @swagger
 * /api/artistes:
 *   post:
 *     summary: Créer un nouvel artiste
 *     description: Permet de créer un nouvel artiste en fournissant les informations nécessaires.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Le nom de l'artiste
 *               bio:
 *                 type: string
 *                 description: La biographie de l'artiste
 *               photo_url:
 *                 type: string
 *                 description: URL de la photo de l'artiste
 *               site_web:
 *                 type: string
 *                 description: Site web de l'artiste
 *               instagram:
 *                 type: string
 *                 description: Compte Instagram de l'artiste
 *               x:
 *                 type: string
 *                 description: Compte X (anciennement Twitter) de l'artiste
 *               facebook:
 *                 type: string
 *                 description: Compte Facebook de l'artiste
 *               style_principal:
 *                 type: string
 *                 description: Style principal de l'artiste
 *               genres_secondaires:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Liste des genres secondaires de l'artiste
 *             required:
 *               - nom
 *     responses:
 *       201:
 *         description: Artiste créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nom:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 photo_url:
 *                   type: string
 *                 site_web:
 *                   type: string
 *                 instagram:
 *                   type: string
 *                 x:
 *                   type: string
 *                 facebook:
 *                   type: string
 *                 style_principal:
 *                   type: string
 *                 genres_secondaires:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Le champ `nom` est obligatoire
 *       409:
 *         description: Un artiste avec ce nom existe déjà
 *       500:
 *         description: Erreur serveur
 */
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
