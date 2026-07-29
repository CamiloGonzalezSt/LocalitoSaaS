import app from "../apps/api/src/server";

export default function handler(req: any, res: any) {
  if (req.url?.startsWith("/api/")) {
    req.url = req.url.replace(/^\/api/, "");
  }

  return app(req, res);
}
