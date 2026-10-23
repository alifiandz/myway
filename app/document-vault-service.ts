import type { VaultDocument, VaultCloud, LocalVault } from "./document-vault-types";

// The cloud index is authoritative, including tombstones. A stale browser must
// never resurrect a document deleted from another device.
export function createDocumentVault(cloud: () => Promise<VaultCloud>, local: LocalVault) {
  return {
    async list() {
      const account = await cloud();
      const remote = await account.list();
      account.assertActive();
      const localDocuments = await local.list().catch(() => []);
      account.assertActive();
      const known = new Set(remote.map(document => document.id));
      return [...remote.filter(document => !document.deletedAt).map(document => ({ ...document, storage: "cloud" as const })), ...localDocuments.filter(document => !known.has(document.id)).map(document => ({ ...document, storage: "local" as const }))]
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    },
    async get(id: string) {
      const account = await cloud();
      const remote = await account.list();
      account.assertActive();
      const record = remote.find(document => document.id === id);
      if (record?.deletedAt) return undefined;
      if (record) { const file = await account.get(id); account.assertActive(); return file; }
      const file = await local.get(id);
      account.assertActive();
      return file;
    },
    async save(document: VaultDocument, blob: Blob) {
      const account = await cloud();
      await account.save(document, blob);
      account.assertActive();
    },
    async remove(id: string) {
      const account = await cloud();
      await account.remove(id);
      account.assertActive();
      // Cloud deletion has succeeded. Failure to clear a stale local copy must
      // not undo it; the tombstone still prevents that copy from reappearing.
      await local.remove(id).catch(() => {});
      account.assertActive();
    },
    async migrate() {
      const account = await cloud();
      const remote = await account.list();
      account.assertActive();
      const documents = await local.list();
      account.assertActive();
      const known = new Set(remote.map(document => document.id));
      let uploaded = 0;
      for (const document of documents) {
        account.assertActive();
        if (known.has(document.id)) continue;
        const stored = await local.get(document.id);
        account.assertActive();
        if (!stored) continue;
        await account.save(document, stored.blob);
        account.assertActive();
        uploaded++;
      }
      // Originals remain on the device. Repeating this operation safely resumes
      // after a failure, without changing identifiers used by Pathway links.
      return uploaded;
    },
  };
}
