import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { pusherServer } from "@/lib/pusher-server";

/**
 * Authentifie l'abonnement aux canaux privés "private-user-<id>"
 * Requiert un utilisateur connecté.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const form = await req.formData();
  const socketId = String(form.get("socket_id") ?? "");
  const channel = String(form.get("channel_name") ?? "");

  // sécurité : n'autoriser que son propre canal
  const uid = String(session.user.id);
  if (!channel.endsWith(`-${uid}`)) {
    return NextResponse.json({ error: "Canal interdit" }, { status: 403 });
  }

  const auth = pusherServer.authorizeChannel(socketId, channel);
  return NextResponse.json(auth);
}
