import assert from "node:assert/strict";
import test from "node:test";

test("renders the MyWay application shell", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<title>MyWay<\/title>/i);
  assert.match(html, /Europe-first business university discovery and planning platform/i);
  assert.match(html, /MyWay/i);
  assert.match(html, /account-gate|onboarding-shell|app-shell/i);
});


test("anonymous callers cannot use admin feedback routes", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  for (const [path, method] of [["/api/admin/feedback", "GET"], ["/api/admin/feedback/example", "PATCH"], ["/api/admin/feedback/example/screenshot", "GET"]]) {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { method }), {}, ctx);
    assert.equal(response.status, 403, `${method} ${path}`);
  }
});

test("missing auth configuration fails clearly and visitor admin access is false", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const config = await worker.fetch(new Request("http://localhost/api/auth-config"), {}, ctx);
  assert.equal(config.status, 503);
  const visibility = await worker.fetch(new Request("http://localhost/api/admin-visibility"), {}, ctx);
  assert.deepEqual(await visibility.json(), { authorized: false });
});

test("public auth configuration exposes only browser-safe settings", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const response = await worker.fetch(new Request("http://localhost/api/auth-config"), {
    SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "public-key",
    SUPABASE_GOOGLE_ENABLED: "true", MYWAY_ADMIN_SECRET: "private-admin-secret",
  }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { url: "https://example.supabase.co", publishableKey: "public-key", googleEnabled: true });
});

test("invalid feedback is rejected before database or file storage access", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  for (const [category, details, attachment] of [["invalid", "message"], ["bug", ""], ["bug", "message", new Blob(["bad"], { type: "application/pdf" })]]) {
    const form = new FormData(); form.set("category", category); form.set("details", details);
    if (attachment) form.set("screenshot", attachment, "file.pdf");
    const response = await worker.fetch(new Request("http://localhost/api/feedback", { method: "POST", body: form }), {}, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.status, 400);
  }
});

test("feedback page context excludes query strings and authentication fragments", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  let stored;
  const form = new FormData();
  form.set("category", "suggestion"); form.set("details", "Test feedback");
  form.set("pageUrl", "https://example.com/path?code=private-code#access_token=private-token");
  const response = await worker.fetch(new Request("http://localhost/api/feedback", { method: "POST", body: form }), {
    DB: { prepare: () => ({ bind: (...values) => { stored = values; return { run: async () => ({ success: true }) }; } }) },
  }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  assert.equal(stored[11], "https://example.com/path");
  assert.doesNotMatch(JSON.stringify(stored), /private-code|private-token/);
  for (const pageUrl of ["", "javascript:private-token"]) {
    form.set("pageUrl", pageUrl);
    const invalid = await worker.fetch(new Request("http://localhost/api/feedback", { method: "POST", body: form }), {
      DB: { prepare: () => ({ bind: (...values) => { stored = values; return { run: async () => ({ success: true }) }; } }) },
    }, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(invalid.status, 200);
    assert.equal(stored[11], "");
  }
});

test("built Worker handles 25 concurrent shell and access-check requests", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const results = await Promise.all(Array.from({ length: 25 }, async (_, index) => {
    const path = index % 2 ? "/api/admin-visibility" : "/";
    const response = await worker.fetch(new Request(`http://localhost${path}`), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.status, 200);
    if (index % 2) assert.deepEqual(await response.json(), { authorized: false });
    else assert.match(await response.text(), /MyWay/);
  }));
  assert.equal(results.length, 25);
});
