import Pusher from "pusher";

export const PusherConfig = {
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: process.env.NODE_ENV === "production",
};

const pusher = new Pusher(PusherConfig);

export default pusher;
