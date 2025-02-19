import type { DownloadProgress } from "../types";

const DB_NAME = "m3u8_downloader";
const STORE_NAME = "download_progress";

export async function initStorage(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveProgress(
  db: IDBDatabase,
  url: string,
  progress: DownloadProgress,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(progress, url);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getProgress(
  db: IDBDatabase,
  url: string,
): Promise<DownloadProgress | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function deleteProgress(
  db: IDBDatabase,
  url: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(url);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
