import { S3Client } from "@aws-sdk/client-s3";

export const R2Config = {
  region: process.env.R2_REGION!,
  bucketName: process.env.R2_BUCKET_NAME!,
  publicUrl: process.env.R2_PUBLIC_URL!,
  accessKey: process.env.R2_ACCESS_KEY!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  endpoint: process.env.R2_ENDPOINT!,
};

export const r2Client = new S3Client({
  region: R2Config.region,
  endpoint: R2Config.endpoint,
  credentials: {
    accessKeyId: R2Config.accessKey,
    secretAccessKey: R2Config.secretAccessKey,
  },
});
