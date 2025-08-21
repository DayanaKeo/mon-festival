export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { eventId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const uid = Number(session.user.id);
  const evenement_id = Number(params.eventId);
  if (!evenement_id || Number.isNaN(evenement_id)) {
    return NextResponse.json({ error: "eventId invalide" }, { status: 400 });
  }

  // Désactiver tous les rappels actifs (60/30/15) pour cet event
  const { count } = await prisma.rappel.updateMany({
    where: { utilisateur_id: uid, evenement_id, actif: true },
    data: { actif: false },
  });

  // Info : y avait-il des rappels non-actifs déjà présents ?
  let hadAny = false;
  if (count === 0) {
    const existing = await prisma.rappel.count({
      where: { utilisateur_id: uid, evenement_id },
    });
    hadAny = existing > 0;
  }

  return NextResponse.json({
    ok: true,
    disabledCount: count,
    note: count === 0 ? (hadAny ? "Aucun rappel actif à désactiver" : "Aucun rappel trouvé") : undefined,
  });
}
