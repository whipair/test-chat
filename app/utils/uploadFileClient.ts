// utils/uploadFileClient.js
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";

/** copy your sanitize function (keeps accents removal and safe chars) */
function sanitizeFileName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // rimuove accenti
    .replace(/[^a-zA-Z0-9._-]/g, "_"); // solo caratteri sicuri
}

/**
 * Uploads file directly to e2 using presigned PUT (server provides uploadUrl + downloadUrl),
 * then inserts a row into 'messages' (keeps using Supabase Postgres for messages).
 *
 * Returns: { filePath: key, signedUrl: downloadUrl, message }
 */
export async function uploadFile(file, userId, conversationId) {
  try {
    if (!file) throw new Error("No file provided");

    const safeName = sanitizeFileName(file.name);
    const key = `${userId}/${uuidv4()}-${safeName}`;

    // 1) Request presign info from your server
    const presignResp = await fetch("/api/presign-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        contentType: file.type || "application/octet-stream",
        expires: 3600,
      }),
    }).then((r) => r.json());

    console.log("presignResp", presignResp);

    if (!presignResp) throw new Error("No presign response from server");

    // If server returned fields -> presigned POST (form upload)
    if (presignResp.fields && typeof presignResp.fields === "object") {
      const uploadUrl = presignResp.uploadUrl;
      const form = new FormData();

      // append all returned fields (policy, signature, key, etc.)
      Object.entries(presignResp.fields).forEach(([k, v]) => {
        form.append(k, String(v));
      });

      // append file last (field name usually 'file')
      form.append("file", file);

      const resp = await fetch(uploadUrl, {
        method: "POST",
        body: form,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error("Upload failed: " + (text || resp.statusText));
      }
    } else if (presignResp.uploadUrl) {
      // presigned PUT flow
      const uploadUrl = presignResp.uploadUrl;

      const resp = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          // include Content-Type if server signed it that way; safe to include in most cases
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error("Upload failed: " + (text || resp.statusText));
      }
    } else {
      throw new Error("Presign response missing upload info (uploadUrl or fields)");
    }

    // 3) Insert message row into messages table (Supabase)
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          sender_id: userId,
          content: "[file]",
          message_type: "file",
          file_url: key,
        },
      ])
      .select()
      .single();

    if (msgError) throw msgError;

    // 4) If server returned a downloadUrl, return it. Otherwise client can call /api/get-signed-get later.
    const signedUrl = presignResp.downloadUrl ?? null;

    return { filePath: key, signedUrl, message };
  } catch (err) {
    console.error("uploadFile error:", err);
    throw err;
  }
}

/**
 * Returns a signed GET URL from your server for a stored object key.
 * Server should implement /api/get-signed-get which signs a GetObjectCommand.
 */
export async function getSignedUrl(filePath) {
  if (!filePath) return null;
  try {
    const resp = await fetch("/api/get-signed-get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: filePath, expires: 3600 }),
    }).then((r) => r.json());

    return resp?.url ?? null;
  } catch (err) {
    console.error("getSignedUrl error:", err);
    return null;
  }
}
