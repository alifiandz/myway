import type { VaultDocument } from "./document-vault-types";

type StoredVaultDocument = VaultDocument & { blob: Blob };

const DB_NAME = "myway-document-vault";
const STORE_NAME = "documents";
const DB_VERSION = 1;

export function accountVaultName() {
  const userId = window.localStorage.getItem("myway-active-user-id");
  if (!userId) throw new Error("Sign in before opening your documents.");
  return `${DB_NAME}:${userId}`;
}

function openVault(name = accountVaultName()) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(name, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runVaultRequest<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>, name = accountVaultName()) {
  const db = await openVault(name);
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    let result: T;
    request.onsuccess = () => { result = request.result; };
    transaction.oncomplete = () => { db.close(); resolve(result); };
    transaction.onerror = transaction.onabort = () => { db.close(); reject(transaction.error || request.error || new Error("Document transaction failed.")); };
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
  const userId = window.localStorage.getItem("myway-active-user-id");
  await runVaultRequest<undefined>("readwrite", (store) => store.clear());
  if (userId && window.localStorage.getItem(LEGACY_OWNER_KEY) === userId) {
    await runVaultRequest<undefined>("readwrite", store => store.clear(), DB_NAME);
  }
}

const LEGACY_OWNER_KEY = "myway-legacy-vault-owner-id";
export async function legacyDocumentCount() {
  const userId = window.localStorage.getItem("myway-active-user-id");
  const owner = window.localStorage.getItem(LEGACY_OWNER_KEY);
  if (!userId || (owner && owner !== userId) || window.localStorage.getItem(`myway-legacy-vault-imported:${userId}`)) return 0;
  return runVaultRequest<number>("readonly", store => store.count(), DB_NAME);
}

export async function importLegacyDocuments() {
  const target = accountVaultName();
  const userId = window.localStorage.getItem("myway-active-user-id")!;
  const owner = window.localStorage.getItem(LEGACY_OWNER_KEY);
  if (owner && owner !== userId) throw new Error("Older documents belong to another account on this device.");
  // Reserve ownership before awaiting; older files remain intact as a backup.
  window.localStorage.setItem(LEGACY_OWNER_KEY, userId);
  const stored = await runVaultRequest<StoredVaultDocument[]>("readonly", store => store.getAll(), DB_NAME);
  for (const document of stored) {
    if (window.localStorage.getItem("myway-active-user-id") !== userId) throw new Error("Account changed. Sign in again to finish importing.");
    const existing = await runVaultRequest<StoredVaultDocument | undefined>("readonly", store => store.get(document.id), target);
    if (!existing) await runVaultRequest<IDBValidKey>("readwrite", store => store.put(document), target);
  }
  window.localStorage.setItem(`myway-legacy-vault-imported:${userId}`, "complete");
  return stored.length;
}
