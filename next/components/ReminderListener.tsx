"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher-client";
// import { pusherClient } from "@/lib/pusher-client";


function notify(title: string, body: string) {
  try {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => { if (p === "granted") new Notification(title, { body, icon: "/icon-notif.png"}); });
      return;
    }
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon-notif.png"});
    }
  } catch {}
}

export default function ReminderListener() {
  const { data: session, status } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    const uid = session.user.id;
    const pusherClient = getPusherClient();
    const channel = pusherClient.subscribe(`private-user-${uid}`);
    const handler = (payload: any) => {
      const start = new Date(payload.date_debut).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
      const body = `« ${payload.titre} » commence bientôt (${payload.delai} min). Début: ${start}`;
      notify("Rappel d'événement", body);
      // tu peux aussi afficher un toast UI ici si tu en as un global
    };
    channel.bind("rappel", handler);
    setReady(true);

    return () => {
      channel.unbind("rappel", handler);
      pusherClient.unsubscribe(`private-user-${uid}`);
      setReady(false);
    };
  }, [status, session?.user?.id]);

  return null;
}
