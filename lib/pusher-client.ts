"use client";

import Pusher from "pusher-js";

const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

function createPusherClient(): Pusher | null {
  if (typeof window === "undefined" || !key || !cluster) return null;
  return new Pusher(key, { cluster });
}

let client: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  if (!client) {
    client = createPusherClient();
  }
  return client;
}
