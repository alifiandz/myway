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
