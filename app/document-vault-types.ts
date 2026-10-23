export type VaultDocument = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  category: string;
  version: number;
  previousVersionId?: string;
  storage?: "cloud" | "local";
};
export type CloudDocument = VaultDocument & { deletedAt?: string | null };
export type StoredVaultDocument = VaultDocument & { blob: Blob };
export type VaultCloud = {
  userId: string;
  assertActive: () => void;
  list: () => Promise<CloudDocument[]>;
  save: (document: VaultDocument, blob: Blob) => Promise<void>;
  get: (id: string) => Promise<StoredVaultDocument | undefined>;
  remove: (id: string) => Promise<void>;
};
export type LocalVault = {
  list: () => Promise<VaultDocument[]>;
  get: (id: string) => Promise<StoredVaultDocument | undefined>;
  remove: (id: string) => Promise<void>;
};
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export function validateDocument(document: VaultDocument, blob: Blob) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(document.id)) throw new Error("Invalid document identifier.");
  if (!document.name || document.name.length > 255) throw new Error("Use a file name with 1–255 characters.");
  if (blob.size > MAX_DOCUMENT_BYTES) throw new Error("Choose a file smaller than 20 MB.");
  if (blob.size !== document.size) throw new Error("The file size does not match its record.");
  const types: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
  const type = types[document.name.split(".").pop()?.toLowerCase() || ""];
  if (!type) throw new Error("Use a PDF, Word, Excel, JPG, PNG, or WEBP file.");
  return type;
}
