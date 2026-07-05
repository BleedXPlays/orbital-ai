import { supabase } from "../supabaseClient";

const BUCKET_NAME = "orbital-attachments";

const sanitizeFileName = (name) => {
  return name
    .toLowerCase()
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const uploadChatAttachment = async ({ userId, chatName, file }) => {
  if (!userId) throw new Error("User ID is required for upload.");
  if (!chatName) throw new Error("Chat name is required for upload.");
  if (!file) throw new Error("No file selected.");

  const safeFileName = sanitizeFileName(file.name);
  const safeChatName = sanitizeFileName(chatName);
  const filePath = `${userId}/chats/${safeChatName}/${Date.now()}-${safeFileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (error) throw error;

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  if (signedUrlError) throw signedUrlError;

  return {
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    path: data.path,
    url: signedUrlData.signedUrl,
    uploadedAt: new Date().toISOString(),
  };
};