import type { Product } from "@localito/shared";

type VisionIdentification = {
  name: string;
  brand?: string;
  variant?: string;
  size?: string;
  barcode?: string;
  confidence: number;
  inventoryProductId?: string;
};

export async function identifyProductImage(imageDataUrl: string, products: Product[]): Promise<VisionIdentification | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!/^data:image\/(jpeg|png|webp);base64,/i.test(imageDataUrl)) throw new Error("Formato de imagen no permitido.");

  const catalog = products.slice(0, 250).map((product) => ({ id: product.id, name: product.name, brand: product.brand, variant: product.variant, barcode: product.barcode }));
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-5.6",
      input: [{
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Identifica el producto comercial de la foto. Compara primero con este inventario: ${JSON.stringify(catalog)}. Devuelve solamente JSON válido con name, brand, variant, size, barcode, confidence entre 0 y 1 e inventoryProductId cuando exista coincidencia. No inventes códigos.`
          },
          { type: "input_image", image_url: imageDataUrl, detail: "auto" }
        ]
      }]
    })
  });

  if (!response.ok) throw new Error(`El servicio visual respondió ${response.status}.`);
  const payload = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("") ?? "";
  const jsonText = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    const result = JSON.parse(jsonText) as VisionIdentification;
    return result.name ? { ...result, confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.5)) } : null;
  } catch {
    throw new Error("La IA visual no devolvió un resultado estructurado.");
  }
}
