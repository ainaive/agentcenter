/**
 * Apply CORS rules to the R2 bundle bucket.
 *
 * Run once after creating the bucket, and again when the production domain changes:
 *
 *   PRODUCTION_URL=https://agentcenter.app bun run scripts/set-r2-cors.ts
 *
 * Requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in the environment
 * (or .env.local).
 */
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET ?? "agentcenter-bundles";
const PRODUCTION_URL = process.env.PRODUCTION_URL;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error(
    "Missing required env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY",
  );
  process.exit(1);
}

const allowedOrigins = [
  "http://localhost:3000",
  // Covers all Vercel preview deployments for this project
  "https://*.vercel.app",
  ...(PRODUCTION_URL ? [PRODUCTION_URL] : []),
];

const client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

console.log(`Applying CORS to bucket: ${R2_BUCKET}`);
console.log("Allowed origins:", allowedOrigins);

await client.send(
  new PutBucketCorsCommand({
    Bucket: R2_BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          // Browser PUT for bundle uploads (upload wizard → R2 presigned URL)
          AllowedOrigins: allowedOrigins,
          AllowedMethods: ["PUT"],
          AllowedHeaders: ["Content-Type", "Content-Length", "Content-MD5"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
        {
          // Public GET for any future direct-CDN reads (optional, safe to keep)
          AllowedOrigins: ["*"],
          AllowedMethods: ["GET", "HEAD"],
          AllowedHeaders: [],
          MaxAgeSeconds: 86400,
        },
      ],
    },
  }),
);

// Read back to confirm
const { CORSRules } = await client.send(
  new GetBucketCorsCommand({ Bucket: R2_BUCKET }),
);

console.log("\nCORS rules now in effect:");
console.log(JSON.stringify(CORSRules, null, 2));
