export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { sendReminderActivatedEmail } from "@/lib/mailer";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// - si eventId: { active: boolean } pour cet événement
// - sinon: { activeEventIds: number[] } pour tous les événements de l'utilisateur
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ activeEventIds: [] });

  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId");
  const uid = Number(session.user.id);

  if (eventId) {
    const count = await prisma.rappel.count({
      where: { utilisateur_id: uid, evenement_id: Number(eventId), actif: true },
    });
    return NextResponse.json({ active: count > 0 });
  }

  const rows = await prisma.rappel.findMany({
    where: { utilisateur_id: uid, actif: true },
    select: { evenement_id: true },
  });
  const activeEventIds = [...new Set(rows.map(r => r.evenement_id))];
  return NextResponse.json({ activeEventIds });
}


// -> crée les rappels 60/30/15 min (futurs), envoie un mail de confirmation si email vérifié
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const eventId = Number(body?.event_id);
  if (!eventId || Number.isNaN(eventId)) {
    return NextResponse.json({ error: "event_id manquant ou invalide" }, { status: 400 });
  }

  const ev = await prisma.evenement.findUnique({ where: { id: eventId } });
  if (!ev) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });

  const now = new Date();
  if (ev.date_fin && ev.date_fin <= now) {
    return NextResponse.json({ error: "L’événement est déjà terminé" }, { status: 409 });
  }

  const DELAIS = [60, 30, 15];
  const FUTURE_SAFETY_MS = 15_000;

  const candidats = DELAIS.map((m) => ({
    delai: m,
    at: new Date(new Date(ev.date_debut).getTime() - m * 60_000),
  }));

  const toCreate = candidats.filter(({ at }) => at.getTime() > now.getTime() + FUTURE_SAFETY_MS);
  if (toCreate.length === 0) {
    return NextResponse.json(
      { error: "Tous les créneaux de rappel (60/30/15) sont déjà passés pour cet événement" },
      { status: 409 }
    );
  }

  const uid = Number(session.user.id);

  // évite les doublons
  const createdRappels = await Promise.all(
    toCreate.map(({ delai, at }) =>
      prisma.rappel.upsert({
        where: {
          utilisateur_id_evenement_id_delai_minutes: {
            utilisateur_id: uid,
            evenement_id: ev.id,
            delai_minutes: delai,
          },
        },
        create: {
          utilisateur_id: uid,
          evenement_id: ev.id,
          delai_minutes: delai,
          date_rappel: at,
          actif: true,
        },
        update: { actif: true, date_rappel: at },
        select: { id: true, delai_minutes: true },
      })
    )
  );

  const user = await prisma.utilisateur.findUnique({
    where: { id: uid },
    select: { email: true, nom: true, email_verifie: true },
  });

  let emailSent = false;
  if (user?.email_verifie && user.email) {
    try {
      await sendReminderActivatedEmail({
        to: user.email,
        nom: user.nom ?? "",
        titre: ev.titre,
        dateDebut: ev.date_debut,
        eventId: ev.id,
        userId: uid,
        created: createdRappels.map(r => ({ id: r.id, delai: r.delai_minutes })),
      });
      emailSent = true;
    } catch (e) {
      console.error("Erreur lors de l'envoi de l'email de rappel activé", e);
    }
  }

  return NextResponse.json(
    {
      ok: true,
      created: createdRappels.map(r => ({ id: r.id, delai: r.delai_minutes })),
      emailSent,
    },
    { status: 201 }
  );
}
