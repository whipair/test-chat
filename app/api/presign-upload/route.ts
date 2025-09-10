// /app/api/presign-upload/route.ts
import { NextResponse } from "next/server";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../../lib/s3";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, contentType, expires = 3600 } = body;

    if (!key || !contentType) {
      return NextResponse.json({ error: "key and contentType required" }, { status: 400 });
    }

    const putCmd = new PutObjectCommand({
      Bucket: process.env.E2_BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: "private",
    });

    const uploadUrl = await getSignedUrl(s3Client, putCmd, { expiresIn: Number(expires) });

    const getCmd = new GetObjectCommand({
      Bucket: process.env.E2_BUCKET,
      Key: key,
    });
    const downloadUrl = await getSignedUrl(s3Client, getCmd, { expiresIn: Number(expires) });

    return NextResponse.json({ uploadUrl, downloadUrl });
  } catch (err) {
    console.error("presign-upload error", err);
    return NextResponse.json({ error: "failed to presign" }, { status: 500 });
  }
}
