import type { SupabaseClient } from "@supabase/supabase-js";
import { validateDocument, type VaultCloud, type CloudDocument } from "./document-vault-types.ts";
const BUCKET = "myway-documents";
const TABLE = "user_documents";
type Row = { id: string; name: string; content_type: string; size_bytes: number; uploaded_at: string; category: string; version: number; previous_version_id: string | null; deleted_at: string | null };
function fromRow(row: Row): CloudDocument { return { id: row.id, name: row.name, type: row.content_type, size: row.size_bytes, uploadedAt: row.uploaded_at, category: row.category, version: row.version, previousVersionId: row.previous_version_id || undefined, deletedAt: row.deleted_at, storage: "cloud" }; }
function failure(error: { message?: string } | null, fallback: string): never { throw new Error(error?.message || fallback); }

export function createCloudDocumentStore(client: SupabaseClient, userId: string, assertActive: () => void): VaultCloud {
  const path = (id: string) => {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error("Invalid document identifier.");
    return `${userId}/${id}`;
  };
  const read = async (id: string) => {
    assertActive();
    const result = await client.from(TABLE).select("*").eq("user_id", userId).eq("id", id).maybeSingle();
    assertActive();
    if (result.error) failure(result.error, "Could not load the document record.");
    return result.data as Row | null;
  };
  return {
    userId, assertActive,
    async list() {
      const rows: CloudDocument[] = [];
      for (let offset = 0; ; offset += 500) {
        assertActive();
        const result = await client.from(TABLE).select("*").eq("user_id", userId).order("id").range(offset, offset + 499);
        assertActive();
        if (result.error) failure(result.error, "Could not load cloud documents. Check your connection.");
        rows.push(...(result.data as Row[]).map(fromRow));
        if (result.data.length < 500) return rows;
      }
    },
    async save(document, blob) {
      const type = validateDocument(document, blob);
      const existing = await read(document.id);
      if (existing) {
        if (existing.deleted_at) throw new Error("This document was deleted. Upload it again as a new file.");
        throw new Error("This document is already saved. Upload a new version to replace it.");
      }
      const objectPath = path(document.id);
      assertActive();
      const upload = await client.storage.from(BUCKET).upload(objectPath, blob.slice(0, blob.size, type), { contentType: type, cacheControl: "0", upsert: false });
      assertActive();
      if (upload.error) {
        // A failed prior metadata write or concurrent migration can leave an
        // object at this immutable path. Only reuse it if its bytes match.
        if (!["409", "Duplicate"].includes(String((upload.error as { statusCode?: string; error?: string }).statusCode)) && !/already exists|duplicate/i.test(upload.error.message)) failure(upload.error, "File upload failed.");
        const prior = await client.storage.from(BUCKET).download(objectPath);
        assertActive();
        if (prior.error || !prior.data || prior.data.size !== blob.size) throw new Error("An existing file conflicts with this upload. Your local original is preserved.");
        const [a,b] = await Promise.all([prior.data.arrayBuffer(), blob.arrayBuffer()]);
        assertActive();
        const left = new Uint8Array(a), right = new Uint8Array(b);
        if (!left.every((byte, index) => byte === right[index])) throw new Error("An existing file conflicts with this upload. Your local original is preserved.");
      }
      const result = await client.from(TABLE).insert({ user_id: userId, id: document.id, name: document.name, content_type: type, size_bytes: blob.size, uploaded_at: document.uploadedAt, category: document.category || "General document", version: document.version || 1, previous_version_id: document.previousVersionId || null });
      assertActive();
      if (result.error) {
        const concurrent = await read(document.id);
        if (concurrent && !concurrent.deleted_at && concurrent.name === document.name && Number(concurrent.size_bytes) === blob.size) return;
        // Keep an uploaded orphan for safe retry rather than deleting an object
        // another device may have just committed. It is accessible only to owner.
        failure(result.error, "File uploaded, but its record could not be saved. Retry to finish.");
      }
    },
    async get(id) {
      const row = await read(id);
      if (!row || row.deleted_at) return undefined;
      const result = await client.storage.from(BUCKET).download(path(id));
      assertActive();
      if (result.error) failure(result.error, "Could not download this document. Check your connection.");
      return { ...fromRow(row), blob: result.data };
    },
    async remove(id) {
      assertActive();
      // Remove bytes first. A failed removal leaves a visible record to retry.
      const removal = await client.storage.from(BUCKET).remove([path(id)]);
      assertActive();
      if (removal.error) failure(removal.error, "Could not delete the cloud file. Please retry.");
      // Retain a tombstone to stop older devices from re-importing the file.
      const row = await read(id);
      if (!row) {
        const result = await client.from(TABLE).insert({ user_id: userId, id, name: "Deleted document", content_type: "application/octet-stream", size_bytes: 0, category: "Deleted document", deleted_at: new Date().toISOString() });
        assertActive();
        if (result.error) failure(result.error, "Could not delete this document.");
      } else if (!row.deleted_at) {
        const result = await client.from(TABLE).update({ deleted_at: new Date().toISOString() }).eq("user_id", userId).eq("id", id).select("id");
        assertActive();
        if (result.error || result.data?.length !== 1) failure(result.error, "Could not delete this document.");
      }

    },
  };
}
