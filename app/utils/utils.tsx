import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";

/**
 * Sanifica un nome file eliminando accenti e caratteri strani
 */
function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // rimuove accenti
    .replace(/[^a-zA-Z0-9._-]/g, "_"); // solo caratteri sicuri
}

/**
 * Carica un file su Supabase Storage e salva il messaggio in DB
 * @param file File oggetto (da input file o drag/drop)
 * @param userId id dell'utente che manda il file
 * @param conversationId id della conversazione
 * @returns {Promise<{filePath: string, signedUrl: string}>}
 */
export async function uploadFile(file, userId, conversationId) {
  try {
    // Estensione
    const ext = file.name.split(".").pop();
    const safeName = sanitizeFileName(file.name);

    // Percorso sicuro nel bucket
    const filePath = `${userId}/${uuidv4()}-${safeName}`;

    // Upload nel bucket
    const { error: uploadError } = await supabase.storage
      .from("chat-attachments")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Salva il messaggio in DB con file_url = filePath
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          sender_id: userId,
          content: "[file]",
          message_type: "file",
          file_url: filePath,
        },
      ])
      .select()
      .single();

    if (msgError) throw msgError;

    // Crea URL firmato valido 1 ora
    const { data: signed, error: urlError } = await supabase.storage
      .from("chat-attachments")
      .createSignedUrl(filePath, 3600);

    if (urlError) throw urlError;

    return { filePath, signedUrl: signed.signedUrl, message };
  } catch (err) {
    console.error("Error uploading file:", err);
    throw err;
  }
}
