// app/api/artistes/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ——— Normalisation du payload autorisé ———
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

type RouteParams = { id: string };

/* ====================== GET /api/artistes/[id] ====================== */
export async function GET(_req: NextRequest, ctx: { params: Promise<RouteParams> }) {
  try {
    const { id } = await ctx.params; // 👈 params est une Promise
    const artisteId = Number(id);
    if (!Number.isFinite(artisteId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const artiste = await prisma.artiste.findUnique({ where: { id: artisteId } });
    if (!artiste) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    return NextResponse.json(artiste);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ====================== PUT /api/artistes/[id] ====================== */
export async function PUT(req: NextRequest, ctx: { params: Promise<RouteParams> }) {
  try {
    const { id } = await ctx.params;
    const artisteId = Number(id);
    if (!Number.isFinite(artisteId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const payload = await req.json().catch(() => null);
    if (!payload) return NextResponse.json({ error: "JSON invalide" }, { status: 400 });

    const data = normDraft(payload);

    const updated = await prisma.artiste.update({ where: { id: artisteId }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Un artiste avec ce nom existe déjà." }, { status: 409 });
    }
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
    }
    return NextResponse.json({ error: "Impossible de mettre à jour" }, { status: 500 });
  }
}

/* ==================== DELETE /api/artistes/[id] ==================== */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<RouteParams> }) {
  try {
    const { id } = await ctx.params;
    const artisteId = Number(id);
    if (!Number.isFinite(artisteId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    await prisma.artiste.delete({ where: { id: artisteId } });
    // 204: pas de corps
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
    }
    return NextResponse.json({ error: "Impossible de supprimer" }, { status: 500 });
  }
}
