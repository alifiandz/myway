import { listVaultDocuments, type VaultDocument } from "./document-vault.ts";

const EXPORTABLE_KEYS = [
  "myway-onboarding-v1",
  "alif-pathway-business-v1",
  "myway-profile",
  "myway-preference-priorities",
  "myway-saved",
  "myway-compared",
  "myway-pathway-selection",
  "myway-pathway-actions",
  "myway-pathway-records",
  "myway-routines",
  "myway-habit-checks",
  "myway-notifications-enabled",
  "myway-product-tour-v2",
] as const;

export const MYWAY_LOCAL_KEYS = [
  ...EXPORTABLE_KEYS,
  "myway-profile-documents",
  "myway-document-links",
  "myway-profile-avatar",
] as const;

export type MyWayPrototypeExport = {
  product: "MyWay";
  formatVersion: 1;
  exportedAt: string;
  storageMode: "device-local-prototype";
  data: Record<string, string>;
  documentInventory: VaultDocument[];
  exclusions: string[];
};

export async function createPrototypeExport(): Promise<MyWayPrototypeExport> {
  const data: Record<string, string> = {};
  EXPORTABLE_KEYS.forEach((key) => {
    const value = window.localStorage.getItem(key);
    if (value !== null) data[key] = value;
  });
  let documentInventory: VaultDocument[] = [];
  try { documentInventory = await listVaultDocuments(); } catch {}
  return {
    product: "MyWay",
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    storageMode: "device-local-prototype",
    data,
    documentInventory,
    exclusions: [
      "Document file contents are excluded. Download important files separately from My Documents.",
      "Document-to-requirement links are excluded because they are invalid without the original files.",
    ],
  };
}

export function importPrototypeExport(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Invalid MyWay export");
  const candidate = value as Partial<MyWayPrototypeExport>;
  if (candidate.product !== "MyWay" || candidate.formatVersion !== 1 || !candidate.data || typeof candidate.data !== "object") throw new Error("Unsupported MyWay export");
  const allowed = new Set<string>(EXPORTABLE_KEYS);
  Object.entries(candidate.data).forEach(([key, storedValue]) => {
    if (allowed.has(key) && typeof storedValue === "string") window.localStorage.setItem(key, storedValue);
  });
}
