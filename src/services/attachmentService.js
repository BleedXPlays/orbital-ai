import { supabase } from "../supabaseClient";

const BUCKET_NAME = "orbital-attachments";
const SIGNED_URL_LIFETIME_SECONDS = 60 * 60;

const sanitizeFileName = (name) => {
  return String(name || "attachment")
    .toLowerCase()
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "attachment";
};

export const getChatAttachmentUrl = async (filePath) => {
  if (!filePath) throw new Error("Attachment path is required.");

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, SIGNED_URL_LIFETIME_SECONDS);

  if (error) throw error;
  return data.signedUrl;
};

export const uploadChatAttachment = async ({
  userId,
  chatName,
  file,
  filename,
}) => {
  if (!userId) throw new Error("User ID is required for upload.");
  if (!chatName) throw new Error("Chat name is required for upload.");
  if (!file) throw new Error("No file selected.");

  const originalFilename = filename || file.name || "attachment";
  const safeFileName = sanitizeFileName(originalFilename);
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

  let signedUrl = "";

  try {
    signedUrl = await getChatAttachmentUrl(filePath);
  } catch (error) {
    console.warn("Attachment uploaded, but its signed URL was not created.", error);
  }

  return {
    name: originalFilename,
    size: file.size,
    type: file.type || "application/octet-stream",
    path: data.path,
    url: signedUrl,
    uploadedAt: new Date().toISOString(),
  };
};

export const deleteChatAttachments = async (filePaths = []) => {
  const uniquePaths = [...new Set(filePaths.filter(Boolean))];
  if (uniquePaths.length === 0) return;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(uniquePaths);

  if (error) throw error;
};
