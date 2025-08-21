// app/api/reminders/[eventId]/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

type RouteParams = { eventId: string };

/** DELETE /api/reminders/[eventId] — désactive tous les rappels (60/30/15) actifs pour cet event */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<RouteParams> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { eventId } = await ctx.params; // 👈 params est une Promise
  const uid = Number(session.user.id);
  const evenement_id = Number(eventId);
  if (!Number.isFinite(evenement_id)) {
    return NextResponse.json({ error: 'eventId invalide' }, { status: 400 });
  }

  try {
    // Désactiver tous les rappels actifs (60/30/15) pour cet event
    const { count } = await prisma.rappel.updateMany({
      where: { utilisateur_id: uid, evenement_id, actif: true },
      data: { actif: false },
    });

    // Si rien désactivé, déterminer si des rappels existent mais déjà inactifs
    let note: string | undefined;
    if (count === 0) {
      const existing = await prisma.rappel.count({
        where: { utilisateur_id: uid, evenement_id },
      });
      note = existing > 0 ? 'Aucun rappel actif à désactiver' : 'Aucun rappel trouvé';
    }

    return NextResponse.json({ ok: true, disabledCount: count, note });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
