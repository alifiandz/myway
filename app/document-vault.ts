export type VaultDocument = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  category: string;
  version: number;
  previousVersionId?: string;
};

type StoredVaultDocument = VaultDocument & { blob: Blob };

const DB_NAME = "myway-document-vault";
const STORE_NAME = "documents";
const DB_VERSION = 1;

function openVault() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runVaultRequest<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openVault();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function listVaultDocuments(): Promise<VaultDocument[]> {
  const stored = await runVaultRequest<StoredVaultDocument[]>("readonly", (store) => store.getAll());
  return stored
    .map((document) => ({ id: document.id, name: document.name, type: document.type, size: document.size, uploadedAt: document.uploadedAt, category: document.category, version: document.version, previousVersionId: document.previousVersionId }))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export const newVaultDocumentId = () => globalThis.crypto?.randomUUID?.() || `document-${Date.now()}`;

export async function saveVaultDocument(document: VaultDocument, blob: Blob) {
  await runVaultRequest<IDBValidKey>("readwrite", (store) => store.put({ ...document, blob }));
}

export async function getVaultDocument(id: string): Promise<StoredVaultDocument | undefined> {
  return runVaultRequest<StoredVaultDocument | undefined>("readonly", (store) => store.get(id));
}

export async function deleteVaultDocument(id: string) {
  await runVaultRequest<undefined>("readwrite", (store) => store.delete(id));
}

export async function clearVaultDocuments() {
  await runVaultRequest<undefined>("readwrite", (store) => store.clear());
}
