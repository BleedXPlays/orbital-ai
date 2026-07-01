import { supabase } from "../supabaseClient";

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
    .from("orbital-files")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from("orbital-files")
    .getPublicUrl(filePath);

  return {
    name: file.name,
    size: `${Math.round(file.size / 1024)} KB`,
    sizeBytes: file.size,
    type: file.type || "Unknown file",
    url: data.publicUrl,
    path: filePath,
    storageType: "supabase-storage",
    uploadedAt: new Date().toISOString(),
  };
}