// /app/api/get-signed-get/route.ts
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../../lib/s3";

export async function POST(request: Request) {
  try {
    const { key, expires = 3600 } = await request.json();
    if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

    const getCmd = new GetObjectCommand({ Bucket: process.env.E2_BUCKET, Key: key });
    const url = await getSignedUrl(s3Client, getCmd, { expiresIn: Number(expires) });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("get-signed-get error", err);
    return NextResponse.json({ error: "failed to sign get" }, { status: 500 });
  }
}
