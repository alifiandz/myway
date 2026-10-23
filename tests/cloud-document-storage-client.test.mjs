import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { createCloudDocumentStore } from '../app/document-vault-cloud-store.ts';
const USER = '11111111-1111-4111-8111-111111111111';
const d = { id: 'sdk-test', name: 'school.pdf', type: 'application/pdf', size: 7, uploadedAt: '2026-10-23T00:00:00Z', category: 'Transcript', version: 1 };
function backend() {
  const objects = new Map(), rows = new Map(), calls = [];
  let failMetadata = false;
  const response = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
  const fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url), method = init.method || 'GET', headers = new Headers(init.headers);
    calls.push({ path: url.pathname, method, auth: headers.get('authorization') });
    assert.equal(headers.get('authorization'), 'Bearer test-user-token');
    if (url.pathname.startsWith('/rest/v1/user_documents')) {
      if (method === 'GET') { const id = url.searchParams.get('id')?.slice(3); const data = id ? rows.get(id) || null : [...rows.values()]; return response(data); }
      if (method === 'POST') { if (failMetadata) return response({ message: 'temporary record failure' }, 503); const row = JSON.parse(init.body); if (rows.has(row.id)) return response({ message: 'duplicate' }, 409); rows.set(row.id, row); return response(null, 201); }
      if (method === 'PATCH') { const id = url.searchParams.get('id').slice(3); Object.assign(rows.get(id), JSON.parse(init.body)); return response([{ id }]); }
    }
    if (url.pathname.startsWith('/storage/v1/object')) {
      if (method === 'DELETE') { for (const path of JSON.parse(init.body).prefixes) objects.delete(path); return response([]); }
      const path = url.pathname.split('/myway-documents/')[1];
      if (method === 'POST') { if (objects.has(path)) return response({ statusCode: '409', error: 'Duplicate', message: 'The resource already exists' }, 400); objects.set(path, init.body instanceof FormData ? init.body.get("") : init.body); return response({ Key: `myway-documents/${path}` }); }
      if (method === 'GET') { if (!objects.has(path)) return response({ message: 'not found' }, 404); return new Response(objects.get(path), { headers: { 'content-type': 'application/pdf' } }); }
    }
    throw new Error(`Unexpected ${method} ${url.pathname}`);
  };
  const client = createClient('https://storage-test.supabase.co', 'public-test-key', { accessToken: async () => 'test-user-token', global: { fetch }, auth: { persistSession: false, autoRefreshToken: false } });
  return { store: createCloudDocumentStore(client, USER, () => {}), rows, objects, calls, fail(v) { failMetadata = v; } };
}
test('real Supabase SDK uploads, lists and downloads original bytes using private authenticated endpoints', async () => {
 const b = backend(); await b.store.save(d, new Blob(['private']));
 assert.equal(b.rows.get(d.id).user_id, USER);
 assert.ok(b.objects.has(`${USER}/${d.id}`));
 assert.equal(b.objects.get(`${USER}/${d.id}`).type, "application/pdf");
 assert.equal((await b.store.list())[0].name, d.name);
 assert.equal(await (await b.store.get(d.id)).blob.text(), 'private');
 assert.ok(b.calls.every(c => !c.path.includes('/public/')));
});
test('metadata failure leaves an owner-only object that a retry recovers without overwriting bytes', async () => {
 const b = backend(); b.fail(true);
 await assert.rejects(b.store.save(d, new Blob(['private'])), /temporary/);
 assert.equal(b.objects.size, 1); b.fail(false);
 await b.store.save(d, new Blob(['private']));
 assert.equal(await (await b.store.get(d.id)).blob.text(), 'private');
});
test('conflicting orphan cannot be relabelled as a different file', async () => {
 const b = backend(); b.objects.set(`${USER}/${d.id}`, new Blob(['changed']));
 await assert.rejects(b.store.save(d, new Blob(['private'])), /conflicts/);
 assert.equal(b.rows.size, 0);
});
test('deletion removes file bytes, retains tombstone, and prevents a repeated save', async () => {
 const b = backend(); await b.store.save(d, new Blob(['private'])); await b.store.remove(d.id);
 assert.equal(b.objects.size, 0); assert.ok(b.rows.get(d.id).deleted_at);
 assert.equal(await b.store.get(d.id), undefined);
 await assert.rejects(b.store.save(d, new Blob(['private'])), /deleted/);
});
