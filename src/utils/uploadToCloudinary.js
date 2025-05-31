export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);

  // 👇 Preset usato per tutto: deve essere "unsigned" e accettare image + video
  formData.append("upload_preset", "bubble-vocals");

  // 👇 Determina endpoint Cloudinary corretto
  const mime = file.type;
  let resourceType = "raw"; // fallback sicuro

  if (mime.startsWith("image/")) {
    resourceType = "image";
  } else if (mime.startsWith("video/") || mime === "audio/webm") {
    resourceType = "video";
  }

  const endpoint = `https://api.cloudinary.com/v1_1/ddqzi7dsc/${resourceType}/upload`;

  console.log('[uploadToCloudinary] Endpoint:', endpoint); // LOGGING
  console.log('[uploadToCloudinary] FormData (file details):', { name: file.name, type: file.type, size: file.size }); // LOGGING

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  console.log('[uploadToCloudinary] Cloudinary Response:', data); // LOGGING

  if (data.secure_url) {
    return data.secure_url;
  } else {
    console.error("Errore Cloudinary:", data);
    throw new Error("Upload fallito");
  }
}
