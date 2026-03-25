import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const r2Region = process.env.R2_REGION!;
const r2BucketName = process.env.R2_BUCKET_NAME!;
const r2PublicUrl = process.env.R2_PUBLIC_URL!;
const r2AccessKey = process.env.R2_ACCESS_KEY!;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const r2Endpoint = process.env.R2_ENDPOINT!;

const s3Client = new S3Client({
  region: r2Region,
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKey,
    secretAccessKey: r2SecretAccessKey,
  },
});

function getKeyFromPublicUrl(publicUrl: string): string | null {
  const base = r2PublicUrl.replace(/\/$/, "");
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
    Bucket: r2BucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3Client.send(command);

  return `${r2PublicUrl}/${key}`;
}

export async function deleteFileFromR2(publicUrl: string): Promise<void> {
  const key = getKeyFromPublicUrl(publicUrl);
  if (!key) {
    throw new Error("Invalid R2 public URL");
  }
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: r2BucketName,
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
