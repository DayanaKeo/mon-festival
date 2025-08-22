import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import type { Prisma, TypeEvenement, StatutEvenement } from "@prisma/client";

export async function GET() {
    const events = await prisma.evenement.findMany({
        orderBy: { date_debut: "asc" },
        include: {
            artistes: { include: { artiste: true } },
            genres:   { include: { genre: true } },
            lieu: true,
            poi: true,
        },
    });
    return NextResponse.json(events);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // --- Validation & normalisation légères ---
    const titre = String(body.titre || "").trim();
    if (!titre) return NextResponse.json({ error: "Titre obligatoire" }, { status: 400 });

    const date_debut = new Date(body.date_debut);
    const date_fin   = new Date(body.date_fin);
    if (isNaN(+date_debut) || isNaN(+date_fin)) {
        return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
    }

    const cat = String(body.categorie || "").toUpperCase() as TypeEvenement;
    const statut = (String(body.statut || "PUBLIE").toUpperCase() as StatutEvenement);

    // Optionnel: sécurité minimale sur enum (sinon Prisma lèvera de toute façon)
    const ENUM_CAT: ReadonlyArray<TypeEvenement> = ["CONCERT","CONFERENCE","STAND","ACTIVITE"] as const;
    const ENUM_STATUT: ReadonlyArray<StatutEvenement> = ["BROUILLON","PUBLIE","REPORTE","ANNULE"] as const;
    if (!ENUM_CAT.includes(cat))   return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
    if (!ENUM_STATUT.includes(statut)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

    const capacite = body.capacite != null && body.capacite !== ""
        ? Number(body.capacite)
        : null;

    if (capacite !== null && (!Number.isFinite(capacite) || capacite < 0)) {
        return NextResponse.json({ error: "Capacité invalide" }, { status: 400 });
    }

    const lieu_id = body.lieu_id != null && body.lieu_id !== "" ? Number(body.lieu_id) : null;
    const poi_id  = body.poi_id  != null && body.poi_id  !== "" ? Number(body.poi_id)  : null;

    // n–n: construire les créations via connect
    const artisteIds: number[] = Array.isArray(body.artiste_ids) ? body.artiste_ids.map((n: any) => Number(n)).filter(Number.isFinite) : [];
    const genreIds:   number[] = Array.isArray(body.genre_ids)   ? body.genre_ids.map((n: any) => Number(n)).filter(Number.isFinite)   : [];

    const artistesCreate = artisteIds.length
        ? {
            create: artisteIds.map((id) => ({
                artiste: { connect: { id } },
                // role_scene: body.role_scene?.[id] ?? null, // si un jour tu gères un rôle par artiste
            })),
        }
        : undefined;

    const genresCreate = genreIds.length
        ? {
            create: genreIds.map((id) => ({
                genre: { connect: { id } },
            })),
        }
        : undefined;

    // --- Construire le payload Prisma dans la forme "checked" (relations via connect) ---
    const data: Prisma.EvenementCreateInput = {
        titre,
        description: body.description ? String(body.description) : null,
        categorie: cat,
        date_debut,
        date_fin,
        statut,
        capacite: capacite as number | null,
        // Relations 1–n: utiliser connect si id fourni
        lieu: lieu_id ? { connect: { id: lieu_id } } : undefined,
        poi:  poi_id  ? { connect: { id: poi_id } }  : undefined,
        // Relations n–n
        artistes: artistesCreate,
        genres:   genresCreate,
    };

    const created = await prisma.evenement.create({ data });
    return NextResponse.json(created, { status: 201 });
}
