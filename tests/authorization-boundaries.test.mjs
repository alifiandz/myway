import test from 'node:test';
import assert from 'node:assert/strict';

const context = { waitUntil() {}, passThroughOnException() {} };
const adminId = '11111111-1111-4111-8111-111111111111';

test('unconfigured and forged admin identities cannot reach feedback records or bytes', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  let storageCalls = 0;
  const forbidden = () => { storageCalls++; throw new Error('Private storage must not be reached'); };
  for (const headers of [{}, { 'oai-authenticated-user-id': adminId }, { 'x-myway-admin-key': 'wrong-synthetic-key' }]) {
    for (const [path, method] of [['/api/admin/feedback', 'GET'], ['/api/admin/feedback/synthetic', 'PATCH'], ['/api/admin/feedback/synthetic/screenshot', 'GET']]) {
      const response = await worker.fetch(new Request(`http://localhost${path}`, { method, headers }), {
        MYWAY_ADMIN_SECRET: 'synthetic-server-only-key', DB: { prepare: forbidden }, BUCKET: { get: forbidden },
      }, context);
      assert.equal(response.status, 403);
    }
  }
  assert.equal(storageCalls, 0);
});

test('Supabase admin routes reject invalid tokens and ordinary users before accessing feedback', async t => {
  const { default: worker } = await import('../dist/server/index.js');
  const calls = [];
  let role = 'student', valid = true, storageCalls = 0;
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const url = new URL(input);
    assert.equal(url.origin, 'https://synthetic.invalid');
    assert.equal(init.headers.Authorization, 'Bearer synthetic-token');
    calls.push(url.pathname);
    if (url.pathname === '/auth/v1/user') return Response.json(valid ? { id: adminId } : { error: 'invalid' }, { status: valid ? 200 : 401 });
    assert.equal(url.pathname, '/rest/v1/profiles');
    assert.equal(url.searchParams.get('user_id'), `eq.${adminId}`);
    return Response.json([{ role }]);
  });
  const env = { SUPABASE_URL: 'https://synthetic.invalid', SUPABASE_PUBLISHABLE_KEY: 'synthetic-public-key',
    DB: { prepare() { storageCalls++; return { bind() { return { all: async () => ({ results: [] }) }; } }; } } };
  const request = () => new Request('http://localhost/api/admin/feedback', { headers: { Authorization: 'Bearer synthetic-token' } });
  assert.equal((await worker.fetch(request(), env, context)).status, 403);
  valid = false;
  assert.equal((await worker.fetch(request(), env, context)).status, 403);
  assert.equal(storageCalls, 0);
  valid = true; role = 'admin';
  assert.equal((await worker.fetch(request(), env, context)).status, 200);
  assert.equal(storageCalls, 1);
  assert.equal(calls.length, 5);
});
