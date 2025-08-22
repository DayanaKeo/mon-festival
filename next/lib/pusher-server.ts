import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER ?? "eu",
  useTLS: true,
});

/** Déclenche une notif temps réel vers le canal privé de l'utilisateur */
export async function notifyUserReminder(userId: number, payload: {
  evenementId: number;
  titre: string;
  dateDebut: string;
  delai: number;    
}) {
  const channel = `private-user-${userId}`;
  await pusherServer.trigger(channel, "rappel", payload);
}
