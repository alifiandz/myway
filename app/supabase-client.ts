import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let clientPromise: Promise<SupabaseClient> | null = null;

export function getSupabaseClient() {
  if (!clientPromise) {
    clientPromise = fetch("/api/auth-config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("MyWay accounts are not configured yet.");
        return response.json() as Promise<{ url: string; publishableKey: string }>;
      })
      .then(({ url, publishableKey }) => createClient(url, publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      }))
      .catch((error) => { clientPromise = null; throw error; });
  }
  return clientPromise;
}
