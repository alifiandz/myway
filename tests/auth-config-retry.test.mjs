import assert from "node:assert/strict";
import test from "node:test";
import { getSupabaseClient } from "../app/supabase-client.ts";

test("auth config can retry after a temporary failure", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("Unavailable", { status: 503 }); };
  try {
    await assert.rejects(getSupabaseClient(), /not configured/);
    await assert.rejects(getSupabaseClient(), /not configured/);
    assert.equal(calls, 2);
  } finally { globalThis.fetch = original; }
});
