import test from 'node:test';
import assert from 'node:assert/strict';
import { healthResponse } from '../worker/health.ts';
const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test-key' };
test('health validates public catalogue, uses bounded read and excludes keys/rows', async () => {
  const response = await healthResponse(env, async (url, options) => {
    assert.equal(url.searchParams.get('limit'),'4');
    assert.equal(options.headers.apikey,'test-key');
    assert.equal(options.redirect,'manual');
    assert.ok(options.signal);
    return Response.json(['tuition','application_deadline','entry_requirement','ranking'].map(field_key => ({field_key,status:'not_yet_verified'})));
  });
  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual(await response.json(),{service:'MyWay',status:'ok'});
});
test('health fails closed on missing settings, denial, timeout and invalid catalogue', async () => {
  assert.equal((await healthResponse({})).status,503);
  for (const fetcher of [async()=>new Response('',{status:403}),async()=>{throw new Error('private-token')},async()=>Response.json([]),async()=>Response.json({message:'private details'})]) {
    const response = await healthResponse(env,fetcher);
    assert.equal(response.status,503);
    assert.doesNotMatch(await response.text(),/private|test-key/);
  }
});
