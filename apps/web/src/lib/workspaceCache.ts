import type { BootstrapData } from "@localito/shared";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("localito-workspaces", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("snapshots");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function cacheWorkspace(key: string, value?: BootstrapData): Promise<BootstrapData | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("snapshots", value ? "readwrite" : "readonly");
      const store = tx.objectStore("snapshots");
      const request = value ? store.put(value, key) : store.get(key);
      let result: BootstrapData | undefined;
      request.onsuccess = () => { result = value ?? request.result; };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
