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

  const maxSizeMB = 1;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    throw new Error(`File is too large. Please upload files under ${maxSizeMB} MB for now.`);
  }

  const base64 = await convertFileToBase64(file);

  return {
    name: file.name,
    size: `${Math.round(file.size / 1024)} KB`,
    sizeBytes: file.size,
    type: file.type || "Unknown file",
    url: base64,
    dataUrl: base64,
    storageType: "firestore-base64",
    uploadedAt: new Date().toISOString(),
  };
}

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file."));

    reader.readAsDataURL(file);
  });
}