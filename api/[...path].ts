export default async function handler(req: any, res: any) {
  try {
    const mod = await import("../apps/api/dist/server.js");
    const app = mod.default;

    if (req.url?.startsWith("/api/")) {
      req.url = req.url.replace(/^\/api/, "");
    }

    return app(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    console.error("API_FUNCTION_ERROR", error);

    return res.status(500).json({
      message: "La API se cayó al iniciar.",
      error: message,
      stack
    });
  }
}