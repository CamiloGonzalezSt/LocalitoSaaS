async function drawImageFile(file: File, maxDimension: number, quality: number) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("El navegador no pudo preparar la foto.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

export async function prepareQuickSaleImage(file: File) {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error("Usa una foto JPG, PNG o WebP.");
  if (file.size > 20_000_000) throw new Error("La foto es demasiado pesada. Usa una imagen de menos de 20 MB.");
  let imageDataUrl = await drawImageFile(file, 1800, 0.82);
  if (imageDataUrl.length > 6_300_000) imageDataUrl = await drawImageFile(file, 1400, 0.7);
  if (imageDataUrl.length > 6_300_000) throw new Error("No pudimos reducir la foto. Intenta con una resolución menor.");
  return imageDataUrl;
}

export function captureVideoFrame(video: HTMLVideoElement) {
  if (!video.videoWidth || !video.videoHeight) throw new Error("La cámara todavía no está lista.");
  const maxDimension = 1800;
  const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("El navegador no pudo preparar la foto.");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}
