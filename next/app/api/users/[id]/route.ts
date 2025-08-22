import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type UpdateBody = {
    nom?: string;
    prenom?: string | null;
    email?: string;
    role?: "ADMIN" | "UTILISATEUR";
    email_verifie?: boolean;
    mot_de_passe?: string;
};

function sanitize(u: any) {
    const { mot_de_passe_hash, ...rest } = u || {};
    return rest;
}

// PUT /api/users/[id]
export async function PUT(req: Request, ctx: any) {
    try {
        const id = Number(ctx?.params?.id);
        if (!Number.isFinite(id)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

        const body = (await req.json()) as UpdateBody;

        const data: any = {};
        if (typeof body.nom === "string") data.nom = body.nom.trim();
        if (typeof body.prenom !== "undefined") data.prenom = body.prenom || null;
        if (typeof body.email === "string") data.email = body.email.trim().toLowerCase();
        if (typeof body.role === "string") {
            if (!["ADMIN", "UTILISATEUR"].includes(body.role)) {
                return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
            }
            data.role = body.role;
        }
        if (typeof body.email_verifie === "boolean") data.email_verifie = body.email_verifie;

        if (typeof body.mot_de_passe === "string" && body.mot_de_passe.length > 0) {
            data.mot_de_passe_hash = await bcrypt.hash(body.mot_de_passe, 10);
        }

        const updated = await prisma.utilisateur.update({ where: { id }, data });
        return NextResponse.json(sanitize(updated));
    } catch (e: any) {
        if (e?.code === "P2002") {
            return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
        }
        return NextResponse.json({ error: "Impossible de mettre à jour l’utilisateur" }, { status: 500 });
    }
}

// DELETE /api/users/[id]
export async function DELETE(_req: Request, ctx: any) {
    try {
        const id = Number(ctx?.params?.id);
        if (!Number.isFinite(id)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

        await prisma.utilisateur.delete({ where: { id } });
        return NextResponse.json(null, { status: 204 });
    } catch {
        return NextResponse.json({ error: "Impossible de supprimer l’utilisateur" }, { status: 500 });
    }
}
