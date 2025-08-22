import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type CreateBody = {
    nom: string;
    prenom?: string | null;
    email: string;
    mot_de_passe?: string; // optionnel; si absent, user non authentifiable tant que pas reset
    role?: "ADMIN" | "UTILISATEUR";
    email_verifie?: boolean;
};

function sanitize(u: any) {
    // Supprime le hash du retour API
    // (NextResponse.json sérialise, on retire par sécurité)
    const { mot_de_passe_hash, ...rest } = u || {};
    return rest;
}

// GET /api/users
export async function GET() {
    try {
        const users = await prisma.utilisateur.findMany({
            orderBy: [{ createdAt: "desc" }],
            select: {
                id: true, nom: true, prenom: true, email: true,
                role: true, email_verifie: true, createdAt: true, updatedAt: true,
                _count: { select: { favoris: true, rappels: true } },
            },
        });
        return NextResponse.json(users);
    } catch {
        return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
}

// POST /api/users
export async function POST(req: Request) {
    try {
        const body = (await req.json()) as CreateBody;
        const nom = (body.nom || "").trim();
        const email = (body.email || "").trim().toLowerCase();
        const prenom = (body.prenom || null) as string | null;
        const role = (body.role as any) || "UTILISATEUR";
        const email_verifie = body.email_verifie ?? false;
        const mot_de_passe = body.mot_de_passe;

        if (!nom) return NextResponse.json({ error: "Nom obligatoire" }, { status: 400 });
        if (!email) return NextResponse.json({ error: "Email obligatoire" }, { status: 400 });
        if (!["ADMIN", "UTILISATEUR"].includes(role)) {
            return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
        }

        const mot_de_passe_hash = mot_de_passe
            ? await bcrypt.hash(mot_de_passe, 10)
            : await bcrypt.hash(crypto.randomUUID(), 10); // hash placeholder si pas de mot de passe fourni

        const created = await prisma.utilisateur.create({
            data: {
                nom, prenom, email, role, email_verifie, mot_de_passe_hash,
            },
        });

        return NextResponse.json(sanitize(created), { status: 201 });
    } catch (e: any) {
        if (e?.code === "P2002") {
            return NextResponse.json({ error: "Un utilisateur avec cet email existe déjà." }, { status: 409 });
        }
        return NextResponse.json({ error: "Impossible de créer l’utilisateur" }, { status: 500 });
    }
}
