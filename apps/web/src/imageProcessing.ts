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

const MAX_UPLOAD_DATA_URL_LENGTH = 3_200_000;
const MAX_INVOICE_DATA_URL_LENGTH = 1_400_000;

async function compressForUpload(file: File, attempts: Array<{ maxDimension: number; quality: number }>, maxDataUrlLength = MAX_UPLOAD_DATA_URL_LENGTH) {
  for (const attempt of attempts) {
    const imageDataUrl = await drawImageFile(file, attempt.maxDimension, attempt.quality);
    if (imageDataUrl.length <= maxDataUrlLength) return imageDataUrl;
  }
  throw new Error("No pudimos optimizar la foto para enviarla. Intenta acercarte al documento y evita incluir el mesón o el fondo.");
}

export async function prepareQuickSaleImage(file: File) {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error("Usa una foto JPG, PNG o WebP.");
  if (file.size > 20_000_000) throw new Error("La foto es demasiado pesada. Usa una imagen de menos de 20 MB.");
  return compressForUpload(file, [
    { maxDimension: 1800, quality: 0.82 },
    { maxDimension: 1500, quality: 0.72 },
    { maxDimension: 1300, quality: 0.64 },
    { maxDimension: 1100, quality: 0.56 }
  ]);
}

export async function prepareInvoiceImage(file: File) {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error("Usa una foto JPG, PNG o WebP.");
  if (file.size > 30_000_000) throw new Error("La imagen supera 30 MB y el teléfono no puede procesarla con seguridad. Usa la cámara normal en vez del modo de máxima resolución.");
  return compressForUpload(file, [
    { maxDimension: 2200, quality: 0.86 },
    { maxDimension: 1900, quality: 0.78 },
    { maxDimension: 1700, quality: 0.72 },
    { maxDimension: 1500, quality: 0.66 },
    { maxDimension: 1300, quality: 0.6 },
    { maxDimension: 1100, quality: 0.54 },
    { maxDimension: 1000, quality: 0.48 }
  ], MAX_INVOICE_DATA_URL_LENGTH);
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
