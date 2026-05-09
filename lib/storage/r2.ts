import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_BUCKET = process.env.R2_BUCKET ?? "agentcenter-bundles";

// Validated on first use rather than at import time, so unrelated tests /
// build steps that import this module without ever calling presign don't
// blow up on missing creds.
function getR2Config(): {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
} {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const missing = [
    !accountId && "R2_ACCOUNT_ID",
    !accessKeyId && "R2_ACCESS_KEY_ID",
    !secretAccessKey && "R2_SECRET_ACCESS_KEY",
  ].filter(Boolean);
  if (missing.length > 0) {
    // Failing here surfaces a clear message via the upload-sign route's
    // catch block instead of an empty-subdomain URL that DNS-fails in the
    // browser as `TypeError: Failed to fetch`.
    throw new Error(
      `R2 is not configured — missing env vars: ${missing.join(", ")}. ` +
        `See .env.example.`,
    );
  }
  return {
    accountId: accountId as string,
    accessKeyId: accessKeyId as string,
    secretAccessKey: secretAccessKey as string,
  };
}

function getClient(): S3Client {
  const { accountId, accessKeyId, secretAccessKey } = getR2Config();
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
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
