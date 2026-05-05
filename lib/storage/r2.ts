import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_BUCKET = process.env.R2_BUCKET ?? "agentcenter-bundles";

function getClient(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function generatePresignedPutUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300,
): Promise<string> {
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function generatePresignedGetUrl(
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const client = getClient();
  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export function bundleKey(slug: string, version: string): string {
  return `bundles/${slug}/${version}/bundle.zip`;
}
