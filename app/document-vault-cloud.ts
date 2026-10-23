import { getSupabaseClient } from "./supabase-client";
import { createCloudDocumentStore } from "./document-vault-cloud-store";
export async function openCloudVault() {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to access your documents.");
  const userId = data.user.id;
  const assertActive = () => { if (window.localStorage.getItem("myway-active-user-id") !== userId) throw new Error("Account changed. Reopen My Documents."); };
  assertActive();
  return createCloudDocumentStore(client, userId, assertActive);
}
