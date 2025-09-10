// lib/s3.ts
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  endpoint: process.env.E2_ENDPOINT, // e.g. https://h8v3.fra.idrivee2-11.com
  region: process.env.E2_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.E2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.E2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // important for many S3-compatible providers
});