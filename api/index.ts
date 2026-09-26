export default async function handler(req: any, res: any) {
  try {
    const requestUrl = new URL(req.url ?? "/api", "https://localito.internal");
    const rewrittenPath = requestUrl.searchParams.get("__localito_path");
    if (!rewrittenPath) {
      return res.status(404).json({ message: "Ruta de API no encontrada." });
    }

    requestUrl.searchParams.delete("__localito_path");
    const forwardedPath = rewrittenPath.replace(/^\/+/, "");
    const forwardedQuery = requestUrl.searchParams.toString();
    req.url = `/${forwardedPath}${forwardedQuery ? `?${forwardedQuery}` : ""}`;

    const mod = await import("../apps/api/dist/server.js");
    return mod.default(req, res);
  } catch (error) {
    console.error("API_ROUTER_FUNCTION_ERROR", error);
    if (res.headersSent) return;
    const databaseUnavailable = error instanceof Error && error.message.startsWith("[localito-api] PostgreSQL es obligatorio en producción.");
    return res.status(databaseUnavailable ? 503 : 500).json({
      code: databaseUnavailable ? "DATABASE_UNAVAILABLE" : "API_UNAVAILABLE",
      message: databaseUnavailable ? "El servicio de datos no está disponible. Intenta nuevamente más tarde." : "La API no pudo procesar la solicitud."
    });
  }
}
