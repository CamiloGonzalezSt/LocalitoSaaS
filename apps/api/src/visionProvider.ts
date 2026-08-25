type Environment = Record<string, string | undefined>;

export type VisionProvider = {
  name: "groq" | "openai";
  apiKey: string;
  endpoint: string;
  model: string;
};

type VisionJsonRequest = {
  provider: VisionProvider;
  imageDataUrl: string;
  systemPrompt: string;
  userPrompt: string;
  schemaName: string;
  schema: unknown;
  maxOutputTokens: number;
  timeoutMs: number;
  operationLabel: string;
};

type ProviderPayload = {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
  choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
};

function publicProviderError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function providerRetryMessage(response: Response) {
  const retryAfter = Number(response.headers.get("retry-after"));
  if (!Number.isFinite(retryAfter) || retryAfter <= 0) return "Intenta nuevamente en uno o dos minutos.";
  const seconds = Math.max(1, Math.ceil(retryAfter));
  return seconds < 60 ? `Intenta nuevamente en unos ${seconds} segundos.` : `Intenta nuevamente en aproximadamente ${Math.ceil(seconds / 60)} minutos.`;
}

async function providerErrorDetail(response: Response) {
  try {
    const payload = await response.json() as { error?: { message?: unknown } };
    const message = payload.error?.message;
    return typeof message === "string" ? message.replace(/\s+/g, " ").trim().slice(0, 240) : "";
  } catch {
    return "";
  }
}

export function resolveVisionProvider(environment: Environment = process.env): VisionProvider | null {
  const requested = environment.VISION_PROVIDER?.trim().toLowerCase();
  const groqKey = environment.GROQ_API_KEY?.trim();
  const openAiKey = environment.OPENAI_API_KEY?.trim();

  if (requested === "groq") {
    return groqKey ? {
      name: "groq",
      apiKey: groqKey,
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      model: environment.GROQ_VISION_MODEL?.trim() || "qwen/qwen3.6-27b"
    } : null;
  }
  if (requested === "openai") {
    return openAiKey ? {
      name: "openai",
      apiKey: openAiKey,
      endpoint: "https://api.openai.com/v1/responses",
      model: environment.OPENAI_VISION_MODEL?.trim() || "gpt-5.6"
    } : null;
  }
  if (groqKey) {
    return {
      name: "groq",
      apiKey: groqKey,
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      model: environment.GROQ_VISION_MODEL?.trim() || "qwen/qwen3.6-27b"
    };
  }
  return openAiKey ? {
    name: "openai",
    apiKey: openAiKey,
    endpoint: "https://api.openai.com/v1/responses",
    model: environment.OPENAI_VISION_MODEL?.trim() || "gpt-5.6"
  } : null;
}

function providerText(payload: ProviderPayload) {
  if (payload.output_text) return payload.output_text;
  const responseText = payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("");
  if (responseText) return responseText;
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((item) => item.text ?? "").join("");
  return "";
}

function providerBody(request: VisionJsonRequest) {
  if (request.provider.name === "groq") {
    return {
      model: request.provider.model,
      reasoning_effort: "none",
      max_completion_tokens: request.maxOutputTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: request.systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${request.userPrompt}\nDevuelve únicamente JSON válido, sin Markdown, siguiendo exactamente este esquema: ${JSON.stringify(request.schema)}`
            },
            { type: "image_url", image_url: { url: request.imageDataUrl } }
          ]
        }
      ]
    };
  }

  return {
    model: request.provider.model,
    store: false,
    max_output_tokens: request.maxOutputTokens,
    text: { format: { type: "json_schema", name: request.schemaName, strict: true, schema: request.schema } },
    input: [
      { role: "system", content: [{ type: "input_text", text: request.systemPrompt }] },
      {
        role: "user",
        content: [
          { type: "input_text", text: request.userPrompt },
          { type: "input_image", image_url: request.imageDataUrl, detail: "high" }
        ]
      }
    ]
  };
}

export async function requestVisionJson(request: VisionJsonRequest): Promise<unknown> {
  const response = await fetch(request.provider.endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${request.provider.apiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(request.timeoutMs),
    body: JSON.stringify(providerBody(request))
  });

  if (!response.ok) {
    const detail = await providerErrorDetail(response);
    if (response.status === 429) throw publicProviderError(`La cuota gratuita de reconocimiento está temporalmente agotada. ${providerRetryMessage(response)}`, 429);
    if (response.status === 401 || response.status === 403) throw publicProviderError("La credencial del servicio de reconocimiento no es válida o no tiene acceso al modelo.", 503);
    if (response.status === 413) throw publicProviderError("La foto o el catálogo superan el límite gratuito del proveedor. Intenta con una foto más simple o menos productos visibles.", 413);
    const suffix = detail ? ` ${detail}` : "";
    throw publicProviderError(`${request.operationLabel} rechazó la solicitud.${suffix}`, 502);
  }

  const payload = await response.json() as ProviderPayload;
  const text = providerText(payload).replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  if (!text) throw publicProviderError("El servicio de reconocimiento devolvió una respuesta vacía. Intenta nuevamente.", 502);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw publicProviderError("El servicio de reconocimiento devolvió una respuesta inválida. Intenta nuevamente.", 502);
  }
}
