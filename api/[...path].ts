import app from "../apps/api/src/server";

export default function handler(req: any, res: any) {
  if (typeof req.url === "string" && req.url.startsWith("/api/")) {
    req.url = req.url.slice("/api".length);
  }

  return app(req, res);
}
