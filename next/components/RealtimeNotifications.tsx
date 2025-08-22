"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";

export default function RealtimeNotifications({ userId }: { userId?: number }) {
  const [messages, setMessages] = useState<Array<{ id: string; text: string }>>([]);

  useEffect(() => {
    if (!userId) return;
    const pusher = getPusherClient();
    const channelName = `private-user-${userId}`;
    const ch = pusher.subscribe(channelName);

    ch.bind("pusher:subscription_succeeded", () => { /* ok */ });

    ch.bind("rappel", (data: { evenementId:number; titre:string; dateDebut:string; delai:number }) => {
      const text = `Rappel ${data.delai} min : « ${data.titre} »`;
      const id = `${Date.now()}-${Math.random()}`;
      setMessages((m) => [...m, { id, text }]);
      // auto-hide après 6s
      setTimeout(() => setMessages((m) => m.filter(x => x.id !== id)), 6000);
    });

    return () => { ch.unbind_all(); pusher.unsubscribe(channelName); pusher.disconnect(); };
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {messages.map(m => (
        <div key={m.id} className="pointer-events-auto rounded-xl border border-fuchsia-400/20 bg-fuchsia-600/10 px-4 py-3 text-sm text-fuchsia-100 shadow-lg">
          {m.text}
        </div>
      ))}
    </div>
  );
}
