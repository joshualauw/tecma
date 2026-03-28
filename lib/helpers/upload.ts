import { r2Client, R2Config } from "@/lib/integrations/r2";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

function getKeyFromPublicUrl(publicUrl: string): string | null {
  const base = R2Config.publicUrl.replace(/\/$/, "");
  const normalized = publicUrl.trim();
  if (!normalized.startsWith(base)) {
    return null;
  }
  const remainder = normalized.slice(base.length);
  const key = remainder.replace(/^\//, "");
  return key.length > 0 ? key : null;
}

export async function uploadFileToR2(buffer: Buffer, contentType: string, folder: string): Promise<string> {
  const key = `${folder}/${uuidv4()}`;
  const command = new PutObjectCommand({
    Bucket: R2Config.bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await r2Client.send(command);

  return `${R2Config.publicUrl}/${key}`;
}

export async function deleteFileFromR2(publicUrl: string): Promise<void> {
  const key = getKeyFromPublicUrl(publicUrl);
  if (!key) {
    throw new Error("Invalid R2 public URL");
  }
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2Config.bucketName,
      Key: key,
    }),
  );
}

export async function replaceFileFromR2(
  oldPublicUrl: string | null,
  buffer: Buffer,
  contentType: string,
  folder: string,
): Promise<string> {
  if (oldPublicUrl) {
    await deleteFileFromR2(oldPublicUrl);
  }
  return uploadFileToR2(buffer, contentType, folder);
}
