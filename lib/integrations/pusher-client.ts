"use client";

import Pusher from "pusher-js";

export const PusherClientConfig = {
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
};

let client: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  if (!client) {
    client = new Pusher(PusherClientConfig.key, { cluster: PusherClientConfig.cluster });
  }
  return client;
}
