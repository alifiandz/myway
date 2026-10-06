import test from "node:test";
import assert from "node:assert/strict";
import { saveVaultDocument, getVaultDocument, listVaultDocuments, clearVaultDocuments, legacyDocumentCount, importLegacyDocuments } from "../app/document-vault.ts";

// Model asynchronous requests and transaction completion separately.
function device() {
  const databases = new Map(), storage = new Map();
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  const indexedDB = { open(name) {
    const fresh = !databases.has(name);
    if (fresh) databases.set(name, new Map());
    const rows = databases.get(name), request = {};
    request.result = { objectStoreNames: { contains: () => !fresh }, createObjectStore() {}, close() {}, transaction() {
      const transaction = { objectStore() {
        function run(action) {
          const result = {};
          queueMicrotask(() => { result.result = action(); result.onsuccess?.(); queueMicrotask(() => transaction.oncomplete?.()); });
          return result;
        }
        return { put: value => run(() => { rows.set(value.id, value); return value.id; }), get: key => run(() => rows.get(key)), getAll: () => run(() => [...rows.values()]), count: () => run(() => rows.size), clear: () => run(() => rows.clear()), delete: key => run(() => rows.delete(key)) };
      } };
      return transaction;
    } };
    queueMicrotask(() => { if (fresh) request.onupgradeneeded?.(); request.onsuccess?.(); });
    return request;
  } };
  return { window: { localStorage, indexedDB }, databases };
}

test("accounts on one device cannot read or clear each other's document files", async () => {
  const original = globalThis.window, d = device();
  try {
    globalThis.window = d.window;
    d.window.localStorage.setItem("myway-active-user-id", "a");
    await saveVaultDocument({ id: "transcript", name: "A.pdf", uploadedAt: "2026-10-06", version: 1 }, new Blob(["private A"]));
    d.window.localStorage.setItem("myway-active-user-id", "b");
    assert.deepEqual(await listVaultDocuments(), []);
    assert.equal(await getVaultDocument("transcript"), undefined);
    await clearVaultDocuments();
    d.window.localStorage.setItem("myway-active-user-id", "a");
    assert.equal(await (await getVaultDocument("transcript")).blob.text(), "private A");
  } finally { globalThis.window = original; }
});

test("older device files remain hidden until import and cannot be imported into another account", async () => {
  const original = globalThis.window, d = device();
  d.databases.set("myway-document-vault", new Map([["old", { id: "old", name: "old.pdf", uploadedAt: "2026-09-01", blob: new Blob(["original"]) }]]));
  try {
    globalThis.window = d.window;
    d.window.localStorage.setItem("myway-active-user-id", "a");
    assert.deepEqual(await listVaultDocuments(), []);
    assert.equal(await legacyDocumentCount(), 1);
    await importLegacyDocuments();
    assert.equal(await (await getVaultDocument("old")).blob.text(), "original");
    assert.equal(d.databases.get("myway-document-vault").size, 1);
    d.window.localStorage.setItem("myway-active-user-id", "b");
    assert.equal(await legacyDocumentCount(), 0);
    await assert.rejects(importLegacyDocuments(), /another account/);
    assert.deepEqual(await listVaultDocuments(), []);
    await clearVaultDocuments();
    assert.equal(d.databases.get("myway-document-vault").size, 1);
    d.window.localStorage.setItem("myway-active-user-id", "a");
    await clearVaultDocuments();
    assert.equal(d.databases.get("myway-document-vault").size, 0);
    assert.equal(await getVaultDocument("old"), undefined);
  } finally { globalThis.window = original; }
});
