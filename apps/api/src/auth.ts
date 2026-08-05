import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { User } from "@localito/shared";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  if (storedHash.startsWith("demo-hash:")) {
    return timingSafeTextEqual(password, storedHash.slice("demo-hash:".length));
  }

  const [algorithm, salt, expectedHex] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;

  try {
    const expected = Buffer.from(expectedHex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function createSessionToken() {
  return randomBytes(48).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSignedSessionToken(user: User, durationMs: number, secret: string) {
  const payload = Buffer.from(JSON.stringify({ user, exp: Date.now() + durationMs })).toString("base64url");
  const value = `v1.${payload}`;
  const signature = createHmac("sha256", secret).update(value).digest("base64url");
  return `${value}.${signature}`;
}

export function verifySignedSessionToken(token: string, secret: string): User | null {
  const [version, payload, signature] = token.split(".");
  if (version !== "v1" || !payload || !signature) return null;
  const expected = createHmac("sha256", secret).update(`${version}.${payload}`).digest("base64url");
  if (!timingSafeTextEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { user?: Partial<User>; exp?: number };
    const user = parsed.user;
    if (!parsed.exp || parsed.exp <= Date.now() || !user?.id || !user.tenantId || !user.name || !user.email || !["owner", "seller"].includes(String(user.role))) return null;
    return { id: user.id, tenantId: user.tenantId, name: user.name, email: user.email, role: user.role as User["role"], active: user.active !== false };
  } catch {
    return null;
  }
}

export function passwordPolicyError(password: string) {
  if (password.length < 10) return "La clave debe tener al menos 10 caracteres.";
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return "La clave debe incluir letras y números.";
  return undefined;
}

function timingSafeTextEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
