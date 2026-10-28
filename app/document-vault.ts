import { isGuestWorkspace } from "./workspace-storage.ts";
import { validateDocument, type VaultDocument as DocumentRecord } from "./document-vault-types.ts";
import * as local from "./document-vault-local.ts";
import { createDocumentVault } from "./document-vault-service.ts";
export type { VaultDocument } from "./document-vault-types";
export { newVaultDocumentId, clearVaultDocuments, legacyDocumentCount, importLegacyDocuments } from "./document-vault-local.ts";
const vault = createDocumentVault(async () => (await import("./document-vault-cloud")).openCloudVault(), { list: local.listVaultDocuments, get: local.getVaultDocument, remove: local.deleteVaultDocument });
export const listVaultDocuments = () => isGuestWorkspace() ? local.listVaultDocuments().then(items => items.map(item => ({ ...item, storage: "local" as const }))) : vault.list();
export const getVaultDocument = (id: string) => isGuestWorkspace() ? local.getVaultDocument(id) : vault.get(id);
export const saveVaultDocument = (document: DocumentRecord, blob: Blob) => {
  if (!isGuestWorkspace()) return vault.save(document, blob);
  validateDocument(document, blob);
  return local.saveVaultDocument(document, blob);
};
export const deleteVaultDocument = (id: string) => isGuestWorkspace() ? local.deleteVaultDocument(id) : vault.remove(id);
export const migrateLocalDocuments = () => isGuestWorkspace() ? Promise.resolve(0) : vault.migrate();
