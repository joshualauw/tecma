export interface MessageExtras {
  image?: {
    mediaId?: string;
    mediaUrl?: string;
    type: "image" | "sticker";
  };
  document?: {
    mediaId?: string;
    mediaUrl?: string;
    filename?: string;
  };
  audio?: {
    mediaId?: string;
    mediaUrl?: string;
  };
  video?: {
    mediaId?: string;
    mediaUrl?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    name?: string;
    url?: string;
  };
}
