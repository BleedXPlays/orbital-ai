import { supabase } from "../supabaseClient";

const BUCKET_NAME = "orbital-files";
const SIGNED_URL_LIFETIME_SECONDS = 60 * 60;

export async function getProjectFileUrl(filePath) {
  if (!filePath) throw new Error("File path is required.");

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, SIGNED_URL_LIFETIME_SECONDS);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteProjectFile(filePath) {
  if (!filePath) return;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) throw new Error(error.message);
}

export async function uploadProjectFile(userId, projectName, file) {
  if (!userId) {
    throw new Error("User ID missing.");
  }

  if (!projectName) {
    throw new Error("Project name missing.");
  }

  if (!file) {
    throw new Error("File missing.");
  }

  const safeProjectName = projectName.replace(/[^a-z0-9]/gi, "_");
  const safeFileName = file.name.replace(/[^a-z0-9._-]/gi, "_");

  const filePath = `${userId}/${safeProjectName}/${Date.now()}_${safeFileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const signedUrl = await getProjectFileUrl(filePath);

  return {
    name: file.name,
    size: `${Math.round(file.size / 1024)} KB`,
    sizeBytes: file.size,
    type: file.type || "Unknown file",
    url: signedUrl,
    path: filePath,
    storageType: "supabase-storage",
    uploadedAt: new Date().toISOString(),
  };
}
