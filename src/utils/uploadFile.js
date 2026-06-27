import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export async function uploadProjectFile(userId, projectName, file) {
  const safeProjectName = projectName.replace(/[^a-z0-9]/gi, "_");
  const safeFileName = file.name.replace(/[^a-z0-9._-]/gi, "_");

  const filePath = `users/${userId}/projects/${safeProjectName}/${Date.now()}_${safeFileName}`;

  const fileRef = ref(storage, filePath);

  await uploadBytes(fileRef, file);

  const url = await getDownloadURL(fileRef);

  return {
    name: file.name,
    size: `${Math.round(file.size / 1024)} KB`,
    type: file.type || "Unknown file",
    url,
    path: filePath,
    uploadedAt: new Date().toISOString(),
  };
}