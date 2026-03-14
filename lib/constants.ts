export const SWR_FETCH_RETRY_COUNT = 3;
export const PHONE_NUMBER_REGEX = /^\+?[1-9]\d{6,14}$/;
export const DATA_TABLE_PAGE_SIZE = 6;

/** Bytes per MB */
const MB = 1024 * 1024;

export const MESSAGE_ATTACHMENT = {
  image: {
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    extensions: [".png", ".jpg", ".jpeg"],
    mimeTypes: ["image/png", "image/jpeg"],
    maxBytes: 5 * MB,
    maxBytesLabel: "5MB",
  },
  video: {
    accept: { "video/3gpp": [".3gp"], "video/mp4": [".mp4"] },
    extensions: [".3gp", ".mp4"],
    mimeTypes: ["video/3gpp", "video/mp4"],
    maxBytes: 16 * MB,
    maxBytesLabel: "16MB",
  },
  audio: {
    accept: {
      "audio/aac": [".aac"],
      "audio/amr": [".amr"],
      "audio/mpeg": [".mp3"],
      "audio/x-m4a": [".m4a"],
      "audio/mp4": [".m4a"],
    },
    extensions: [".aac", ".amr", ".mp3", ".m4a"],
    mimeTypes: ["audio/aac", "audio/amr", "audio/mpeg", "audio/x-m4a", "audio/mp4"],
    maxBytes: 16 * MB,
    maxBytesLabel: "16MB",
  },
  document: {
    accept: {
      "text/plain": [".txt"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "application/pdf": [".pdf"],
    },
    extensions: [".txt", ".xls", ".xlsx", ".doc", ".docx", ".ppt", ".pptx", ".pdf"],
    mimeTypes: [
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/pdf",
    ],
    maxBytes: 100 * MB,
    maxBytesLabel: "100MB",
  },
} as const;

export type MessageAttachmentType = keyof typeof MESSAGE_ATTACHMENT;

export function getAcceptString(type: MessageAttachmentType): string {
  const spec = MESSAGE_ATTACHMENT[type];
  return [...spec.mimeTypes, ...spec.extensions].join(",");
}

export function validateMessageAttachment(
  file: { type: string; size: number; name?: string },
  type: MessageAttachmentType,
): { valid: true } | { valid: false; error: string } {
  const spec = MESSAGE_ATTACHMENT[type];
  if (file.size > spec.maxBytes) {
    return { valid: false, error: `File must be at most ${spec.maxBytesLabel}` };
  }
  const mimeTypes = spec.mimeTypes as readonly string[];
  const extensions = spec.extensions as readonly string[];
  if (!mimeTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${extensions.join(", ")}` };
  }
  if (file.name) {
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
    if (!extensions.includes(ext)) {
      return { valid: false, error: `Invalid file extension. Allowed: ${extensions.join(", ")}` };
    }
  }
  return { valid: true };
}
