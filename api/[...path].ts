export default async function handler(req: any, res: any) {
  try {
    const mod = await import("../apps/api/dist/server.js");
    const app = mod.default;

    if (req.url?.startsWith("/api/")) {
      req.url = req.url.replace(/^\/api/, "");
    }

    return app(req, res);
  } catch (error) {
    console.error("API_FUNCTION_ERROR", error);
    if (res.headersSent) return;
    const databaseUnavailable = error instanceof Error && error.message.startsWith("[localito-api] PostgreSQL es obligatorio en producción.");
    return res.status(databaseUnavailable ? 503 : 500).json({
      code: databaseUnavailable ? "DATABASE_UNAVAILABLE" : "API_UNAVAILABLE",
      message: databaseUnavailable ? "El servicio de datos no está disponible. Intenta nuevamente más tarde." : "La API no pudo procesar la solicitud."
    });
  }
}
