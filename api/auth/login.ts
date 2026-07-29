export default async function handler(req: any, res: any) {
  try {
    const mod = await import("../../apps/api/dist/server.js");
    const app = mod.default;

    req.url = "/auth/login";

    return app(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("LOGIN_FUNCTION_ERROR", error);

    return res.status(500).json({
      message: "La funcion de login se cayo.",
      error: message
    });
  }
}
