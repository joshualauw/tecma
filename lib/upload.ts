import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
