export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/mailer";
import { pusherServer } from "@/lib/pusher-server";

// .env -> REMINDER_WINDOW_MINUTES=5 (par ex.)
const WINDOW_MINUTES = Number(process.env.REMINDER_WINDOW_MINUTES ?? 5);

// marge de rattrapage si une exécution a été manquée (2 minutes en arrière)
const DRIFT_BACK_MS = 2 * 60 * 1000;

export async function GET(req: Request) {
  // Test manuel: /api/tasks/reminders?force=1 enverra TOUT ce qui est <= now+WINDOW
  const url = new URL(req.url);
  const forceAll = url.searchParams.get("force");

  const now = new Date();
  const from = new Date(now.getTime() - DRIFT_BACK_MS);
  const to   = new Date(now.getTime() + WINDOW_MINUTES * 60_000);

  // Récupère les rappels "dans la fenêtre"
  const rappels = await prisma.rappel.findMany({
    where: forceAll ? {
      actif: true,
      date_rappel: { lte: to }
    } : {
      actif: true,
      date_rappel: { gt: from, lte: to }
    },
    include: {
      evenement: true,
      utilisateur: { select: { id: true, email: true, nom: true, email_verifie: true } }
    },
    orderBy: { date_rappel: 'asc' },
    take: 500
  });

  let sent = 0, pushed = 0;

  for (const r of rappels) {
    const u = r.utilisateur;
    const ev = r.evenement;

    // 1) Email (si l'email est vérifié)
    if (u.email_verifie && u.email) {
      try {
        await sendReminderEmail({
          to: u.email,
          nom: u.nom ?? "",
          titre: ev.titre,
          dateDebut: ev.date_debut,
          delai: r.delai_minutes,
          eventId: ev.id,     // ✅ lie à l’événement
          rappelId: r.id,     // ✅ lie au rappel
          userId: u.id,       // ✅ pour la signature
        });
        sent++;
      } catch (e) {
        console.error("MAIL FAIL", u.email, e);
      }
    }

    // 2) Notif temps-réel (Pusher) — visible si l’appli est ouverte (web/mobile)
    try {
      await pusherServer.trigger(`private-user-${u.id}`, "rappel", {
        type: "rappel",
        eventId: ev.id,
        titre: ev.titre,
        delai: r.delai_minutes,
        date_debut: ev.date_debut,
        rappel_id: r.id,
      });
      pushed++;
    } catch (e) {
      console.error("PUSHER FAIL", u.id, e);
    }

    // 3) Marquer le rappel comme inactif (idempotence)
    try {
      await prisma.rappel.update({
        where: { id: r.id },
        data: { actif: false },
      });
    } catch (e) {
      console.error("RAPPEL UPDATE FAIL", r.id, e);
    }
  }

  return NextResponse.json({
    ok: true,
    processed: rappels.length,
    emailsSent: sent,
    pusherSent: pushed,
    window: { from: from.toISOString(), to: to.toISOString() }
  });
}
