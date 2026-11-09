"use client";
import { useEffect, useState } from "react";
import { startDocumentAutoSync } from "./document-auto-sync";
import { importOwnedLegacyDocuments, migrateLocalDocuments } from "./document-vault";
export function DocumentAutoSyncNotice({ userId, language }: { userId: string; language: "en" | "id" }) {
  const [state, setState] = useState<"syncing" | "synced" | "retrying">("syncing");
  useEffect(() => startDocumentAutoSync(async () => {
    if (window.localStorage.getItem("myway-active-user-id") !== userId) throw new Error("Account changed");
    await importOwnedLegacyDocuments();
    await migrateLocalDocuments();
  }, setState, window), [userId]);
  if (state === "synced") return null;
  return <p role="status" className="prototype-file-note">{language === "id" ? state === "syncing" ? "Menyinkronkan dokumen perangkat ke akun…" : "Dokumen lokal tetap aman. Sinkronisasi akan dicoba lagi secara otomatis." : state === "syncing" ? "Syncing device documents to your account…" : "Local originals are safe. Document sync will retry automatically."}</p>;
}
