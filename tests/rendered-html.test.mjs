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
  assert.match(html, /Explore\. Plan\. Go Further\./);
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

test("built health route fails closed without configuration and rejects writes", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  assert.equal((await worker.fetch(new Request("http://localhost/api/health"), {}, ctx)).status,503);
  const head = await worker.fetch(new Request("http://localhost/api/health",{method:"HEAD"}), {}, ctx);
  assert.equal(head.status,503);
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("cache-control"), "no-store");
  const response = await worker.fetch(new Request("http://localhost/api/health",{method:"POST"}), {}, ctx);
  assert.equal(response.status,405);
  assert.equal(response.headers.get("allow"),"GET, HEAD");
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

const auditPng = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aAZsAAAAASUVORK5CYII=','base64'));

test('feedback rejects SVG, renamed SVG, invalid raster bytes and oversized screenshots before storage', async () => {
 const { default: worker } = await import('../dist/server/index.js');
 for (const [type, bytes] of [['image/svg+xml','<svg><script>audit</script></svg>'],['image/png','<svg>renamed</svg>'],['image/jpeg','not a jpeg'],['image/webp','not a webp'],['image/png',new Uint8Array(8*1024*1024+1)]]) {
  let stored=false;
  const form=new FormData();form.set('category','bug');form.set('details','local test');form.set('screenshot',new Blob([bytes],{type}),'audit.png');
  const response=await worker.fetch(new Request('http://localhost/api/feedback',{method:'POST',body:form}),{BUCKET:{put:async()=>{stored=true}},DB:{prepare:()=>{stored=true;throw new Error('Storage must not be reached')}}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(response.status,400,type);assert.equal(stored,false);
 }
});
test('valid raster screenshots upload, while downloads reject legacy SVG and use safe attachment headers', async () => {
 const { default: worker } = await import('../dist/server/index.js');
 let uploaded=false;
 const form=new FormData();form.set('category','bug');form.set('details','local test');form.set('screenshot',new Blob([auditPng],{type:'image/png'}),'audit.png');
 const uploadedResponse=await worker.fetch(new Request('http://localhost/api/feedback',{method:'POST',body:form}),{BUCKET:{put:async()=>{uploaded=true}},DB:{prepare:()=>({bind:()=>({run:async()=>({success:true})})})}},{waitUntil(){},passThroughOnException(){}});
 assert.equal(uploadedResponse.status,200);assert.equal(uploaded,true);
 for (const type of ['image/png','image/svg+xml']) {
  const response=await worker.fetch(new Request('http://localhost/api/admin/feedback/example/screenshot',{headers:{'oai-authenticated-user-id':'11111111-1111-4111-8111-111111111111'}}),{MYWAY_ADMIN_ACCOUNT_IDS:'11111111-1111-4111-8111-111111111111',DB:{prepare:()=>({bind:()=>({first:async()=>({screenshot_key:'mock',screenshot_name:'untrusted.svg'})})})},BUCKET:{get:async()=>({size:auditPng.length,httpMetadata:{contentType:type},arrayBuffer:async()=>auditPng.buffer})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(response.status,type==='image/png'?200:415);
  if(type==='image/png') {assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.match(response.headers.get('content-disposition'),/^attachment;/);assert.match(response.headers.get('content-security-policy'),/sandbox/);}
 }
});

test("admin university and logo routes preserve shared navigation and a back route", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  for (const path of ["/admin/universities", "/admin/universities/ft-school-2", "/admin/logos", "/admin/logos/ft-school-2", "/admin/feedback"]) {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, ctx);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    for (const href of ["/admin/data", "/admin/universities", "/admin/logos", "/admin/feedback"]) assert.ok(html.includes(`href="${href}"`), `${path} retains ${href}`);
    if (path.endsWith("ft-school-2")) assert.match(html, /Back to all universities/);
    assert.doesNotMatch(html, /name="note"/, "Private notes are not rendered before authentication and loading");
  }
});


test("platform admin identity requires an explicitly configured allowlist", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const id = "11111111-1111-4111-8111-111111111111";
  const request = () => new Request("http://localhost/api/admin-visibility", { headers: { "oai-authenticated-user-id": id } });
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const unconfigured = await worker.fetch(request(), {}, ctx);
  assert.deepEqual(await unconfigured.json(), { authorized: false });
  const configured = await worker.fetch(request(), { MYWAY_ADMIN_ACCOUNT_IDS: id }, ctx);
  assert.deepEqual(await configured.json(), { authorized: true });
});
