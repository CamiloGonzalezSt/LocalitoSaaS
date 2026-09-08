export type QueueEntry = { id: string; path: string; body: string; createdAt: string; attempts: number; error?: string; rejected?: boolean; httpStatus?: number };
export class SyncHttpError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "SyncHttpError"; }
}
export type SyncOptions = { retryRejected?: boolean; entryId?: string };
export type SyncScope = { key: string; token: string };
export function syncScope(): SyncScope | null {
  try {
    const session = JSON.parse(localStorage.getItem("localito-session") || "null");
    const token = localStorage.getItem("localito-token");
    return session?.tenant?.id && session?.user?.id && token ? { key: `localito-queue:v2:${encodeURIComponent(session.tenant.id)}:${encodeURIComponent(session.user.id)}`, token } : null;
  } catch { return null; }
}
export function queueEntries(key = syncScope()?.key): QueueEntry[] {
  if (!key) return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(parsed) || parsed.some(entry => !entry || typeof entry.id !== "string" || entry.path !== "/sales" || typeof entry.body !== "string" || !Number.isFinite(Date.parse(entry.createdAt)) || !Number.isSafeInteger(entry.attempts) || entry.attempts < 0 || !validQueuedBody(entry.body, entry.id))) throw new Error();
    return parsed;
  } catch { throw new Error("No se pudo leer la cola de ventas. Conserva los datos del navegador y descarga el respaldo para revisarlo."); }
}
function validQueuedBody(body: string, id: string): boolean {
  try {
    const payload = JSON.parse(body);
    return payload?.idempotencyKey === id && Boolean(id.trim()) && typeof payload.paymentMethod === "string" && Array.isArray(payload.items) && payload.items.length > 0 && payload.items.every((item: { productId?: unknown; quantity?: unknown } | null) => item && typeof item.productId === "string" && typeof item.quantity === "number" && Number.isFinite(item.quantity) && item.quantity > 0);
  } catch { return false; }
}
function save(key: string, entries: QueueEntry[]) {
  localStorage.setItem(key, JSON.stringify(entries));
  window.dispatchEvent(new Event("localito-sync"));
}
export async function enqueueSale(scope: SyncScope, body: string) {
  if (!navigator.locks) throw new Error("No se pudo guardar la venta de forma segura. El ticket se conserva.");
  return navigator.locks.request(scope.key, () => {
  const payload = JSON.parse(body);
  if (typeof payload?.idempotencyKey !== "string" || !validQueuedBody(body, payload.idempotencyKey)) throw new Error("La venta necesita productos validos y un identificador antes de guardarse.");
  const entries = queueEntries(scope.key);
  if (!entries.some(entry => entry.id === payload.idempotencyKey)) {
    entries.push({ id: payload.idempotencyKey, path: "/sales", body, createdAt: new Date().toISOString(), attempts: 0 });
    try { save(scope.key, entries); } catch { throw new Error("No se pudo guardar la venta en este dispositivo. El ticket se conserva; no cierres la página."); }
  }
  });
}
export async function syncQueue(send: (entry: QueueEntry, token: string) => Promise<void>, options: SyncOptions = {}) {
  const scope = syncScope();
  if (!scope || !navigator.onLine) return { synced: 0, pending: scope ? queueEntries(scope.key).length : 0 };
  if (!navigator.locks) throw new Error("Este navegador no permite sincronizar de forma segura. Usa Chrome o Edge actualizado.");
  return navigator.locks.request(scope.key, async () => {
    let synced = 0;
    for (const entry of queueEntries(scope.key)) {
      if (syncScope()?.key !== scope.key || syncScope()?.token !== scope.token) break;
      if ((options.entryId && options.entryId !== entry.id) || (entry.rejected && !options.retryRejected)) continue;
      try {
        await send(entry, scope.token);
        save(scope.key, queueEntries(scope.key).filter(item => item.id !== entry.id));
        synced++;
        localStorage.setItem(scope.key + ":last", new Date().toISOString());
      } catch (error) {
        const httpStatus = error instanceof SyncHttpError ? error.status : undefined;
        const rejected = Boolean(httpStatus && [400, 404, 409, 413, 422].includes(httpStatus));
        save(scope.key, queueEntries(scope.key).map(item => item.id === entry.id ? { ...item, attempts: item.attempts + 1, error: error instanceof Error ? error.message : "No se pudo sincronizar.", rejected, httpStatus } : item));
        if (!rejected) break;
      }
    }
    return { synced, pending: queueEntries(scope.key).length };
  });
}
