import { planningStorage } from "./workspace-storage.ts";
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
    const value = planningStorage().getItem(key);
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
  if (candidate.product !== "MyWay" || candidate.formatVersion !== 1 || !candidate.data || typeof candidate.data !== "object" || Array.isArray(candidate.data)) throw new Error("Unsupported MyWay export");
  const allowed = new Set<string>(EXPORTABLE_KEYS);
  const entries = Object.entries(candidate.data).filter(([key]) => allowed.has(key));
  if (!entries.length) throw new Error("Empty MyWay export");
  const arrays = new Set(["myway-saved", "myway-compared", "myway-pathway-selection", "myway-pathway-actions", "myway-routines"]);
  const flags = new Set(["myway-onboarding-v1", "alif-pathway-business-v1", "myway-notifications-enabled", "myway-product-tour-v2"]);
  let total = 0;
  for (const [key, storedValue] of entries) {
    if (typeof storedValue !== "string") throw new Error("Invalid backup value");
    total += storedValue.length;
    if (total > 5 * 1024 * 1024) throw new Error("Backup too large");
    if (flags.has(key)) {
      if (!["complete", "true", "false"].includes(storedValue)) throw new Error("Invalid backup flag");
      continue;
    }
    const parsed: unknown = JSON.parse(storedValue);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) !== arrays.has(key)) throw new Error("Invalid backup structure");
    if (["myway-saved", "myway-compared", "myway-pathway-actions"].includes(key) && !(parsed as unknown[]).every(item => typeof item === "string")) throw new Error("Invalid backup list");
    if (key === "myway-pathway-selection" && !(parsed as { id?: unknown; role?: unknown }[]).every(item => item && typeof item.id === "string" && ["Dream", "Target", "Alternative"].includes(String(item.role)))) throw new Error("Invalid pathway choice");
    const values = Object.values(parsed);
    if (key === "myway-profile" && !values.every(item => typeof item === "string")) throw new Error("Invalid profile field");
    if (key === "myway-preference-priorities" && !values.every(item => ["Must have", "Prefer", "No preference"].includes(String(item)))) throw new Error("Invalid preference");
    if (key === "myway-pathway-records" && !values.every(item => typeof item === "string")) throw new Error("Invalid pathway record");
    if (key === "myway-habit-checks" && !values.every(item => Array.isArray(item) && item.every(day => Number.isInteger(day) && day >= 1 && day <= 31))) throw new Error("Invalid habit check");
    if (key === "myway-routines" && !values.every(item => item && typeof item === "object" && typeof item.id === "string" && typeof item.title === "string" && typeof item.focus === "string" && Number.isFinite(item.weeklyGoal) && item.weeklyGoal > 0 && Number.isFinite(item.minutes) && item.minutes > 0)) throw new Error("Invalid routine");
  }
  const storage = planningStorage();
  const previous = new Map(entries.map(([key]) => [key, storage.getItem?.(key) ?? null]));
  const written: string[] = [];
  try {
    for (const [key, storedValue] of entries) { storage.setItem(key, storedValue); written.push(key); }
  } catch {
    for (const key of written.reverse()) {
      try { const value = previous.get(key); if (value == null) storage.removeItem(key); else storage.setItem(key, value); } catch { /* Storage may remain unavailable; preserve all recoverable values. */ }
    }
    throw new Error("Backup could not be restored to device storage");
  }
}
