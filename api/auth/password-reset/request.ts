export default async function handler(req: any, res: any) {
  try {
    const mod = await import("../../../apps/api/dist/server.js");
    const app = mod.default;

    req.url = "/auth/password-reset/request";
    return app(req, res);
  } catch (error) {
    console.error("PASSWORD_RESET_REQUEST_FUNCTION_ERROR", error);
    return res.status(500).json({ message: "No se pudo iniciar la recuperación de contraseña." });
  }
}
