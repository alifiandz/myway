import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, createFetchMock } from 'miniflare';
import ts from 'typescript';

test('health works in the configured Cloudflare runtime and refuses upstream redirects', async () => {
  const source = ts.transpileModule(await readFile(new URL('../worker/health.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  const agent = createFetchMock();
  agent.disableNetConnect();
  const upstream = agent.get('https://example.supabase.co');
  upstream.intercept({path:/rest/}).reply(200,JSON.stringify(['tuition','application_deadline','entry_requirement','ranking'].map(field_key=>({field_key,status:'verified'}))),{headers:{'content-type':'application/json'}});
  upstream.intercept({path:/rest/}).reply(302,'',{headers:{location:'https://untrusted.example/'}});
  const mf = new Miniflare({modules:true,script:source+'\nexport default {fetch(){return healthResponse({SUPABASE_URL:"https://example.supabase.co",SUPABASE_PUBLISHABLE_KEY:"dummy-key"})}}',compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],fetchMock:agent});
  try {
    const good = await mf.dispatchFetch('http://localhost/api/health');
    assert.equal(good.status,200);
    assert.deepEqual(await good.json(),{service:'MyWay',status:'ok'});
    const redirected = await mf.dispatchFetch('http://localhost/api/health');
    assert.equal(redirected.status,503);
    agent.assertNoPendingInterceptors();
  } finally { await mf.dispose(); }
});
