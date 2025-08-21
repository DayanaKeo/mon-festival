/**
 * @swagger
 * /api/artistes/{id}:
 *   get:
 *     summary: Récupérer un artiste par ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: L'identifiant de l'artiste à récupérer
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Affiche les détails de l'artiste
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
 *         description: ID invalide fourni
 *       404:
 *         description: Artiste introuvable
 *       500:
 *         description: Erreur serveur
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// GET /api/artistes/[id]
export async function GET(_: Request, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (!Number.isFinite(id)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

        const artiste = await prisma.artiste.findUnique({ where: { id } });
        if (!artiste) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
        return NextResponse.json(artiste);
    } catch {
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
 // Adjust path to your `swagger.ts`

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

// PUT /api/artistes/:id
export async function PUT(req: Request, ctx: any) {
    try {
        const id = Number(ctx?.params?.id);
        if (!Number.isFinite(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }
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

// DELETE /api/artistes/:id
export async function DELETE(_req: Request, ctx: any) {
    try {
        const id = Number(ctx?.params?.id);
        if (!Number.isFinite(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }
        await prisma.artiste.delete({ where: { id } });
        return NextResponse.json(null, { status: 204 });
    } catch {
        return NextResponse.json({ error: "Impossible de supprimer" }, { status: 500 });
    }
}
