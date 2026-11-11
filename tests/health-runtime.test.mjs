import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import ts from 'typescript';

test('health works in the configured Cloudflare runtime and refuses upstream redirects', async () => {
  const source = ts.transpileModule(await readFile(new URL('../worker/health.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  const requests = [];
  // Handle every outbound request locally; never fall through to the network.
  const outboundService = async request => {
    requests.push(request.url);
    const url = new URL(request.url);
    if (url.origin !== 'https://example.supabase.co' || !url.pathname.startsWith('/rest/')) return new Response('Unexpected upstream', {status: 500});
    if (requests.length === 1) return Response.json(['tuition','application_deadline','entry_requirement','ranking'].map(field_key=>({field_key,status:'verified'})));
    return new Response('', {status:302,headers:{location:'https://untrusted.example/'}});
  };
  const mf = new Miniflare(convertV4MiniflareOptions({modules:true,script:source+'\nexport default {fetch(request){return healthRequest(request,{SUPABASE_URL:"https://example.supabase.co",SUPABASE_PUBLISHABLE_KEY:"dummy-key"})}}',compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],outboundService}));
  try {
    const good = await mf.dispatchFetch('http://localhost/api/health');
    assert.equal(good.status,200);
    assert.deepEqual(await good.json(),{service:'MyWay',status:'ok'});
    const redirected = await mf.dispatchFetch('http://localhost/api/health');
    assert.equal(redirected.status,503);
    assert.equal(requests.length, 2);
    assert.ok(requests.every(url => url.startsWith('https://example.supabase.co/rest/')));
  } finally { await mf.dispose(); }
});
