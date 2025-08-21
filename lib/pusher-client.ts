"use client";
import Pusher from "pusher-js";

export function getPusherClient() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY!;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu";

  const pusher = new Pusher(key, {
    cluster,
    forceTLS: true,
    // Auth pour private-* (voir route /api/pusher/auth)
    authEndpoint: "/api/pusher/auth",
    auth: { headers: { } },
  });

  return pusher;
}
