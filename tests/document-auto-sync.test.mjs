import test from 'node:test';
import assert from 'node:assert/strict';
import { startDocumentAutoSync } from '../app/document-auto-sync.ts';
const settle = () => new Promise(resolve => setImmediate(resolve));
test('sync starts without a click, retries after failure and reconnect, and cleans up', async () => {
  const listeners = new Map(); let tick, cancelled = false, runs = 0; const states = [];
  const stop = startDocumentAutoSync(async () => { if (++runs === 1) throw Error('offline'); }, s => states.push(s), { addEventListener: (n,f) => listeners.set(n,f), removeEventListener: n => listeners.delete(n) }, f => { tick = f; return 1; }, () => { cancelled = true; });
  await settle(); assert.equal(runs, 1); assert.equal(states.at(-1), 'retrying');
  listeners.get('online')(); await settle(); assert.equal(runs, 2); assert.equal(states.at(-1), 'synced');
  tick(); await settle(); assert.equal(runs, 3);
  stop(); tick(); await settle(); assert.equal(runs, 3); assert.equal(cancelled, true); assert.equal(listeners.size, 0);
});
test('overlapping triggers cannot start duplicate migrations and stopped work does not report success', async () => {
  let release, runs = 0, tick; const states = [];
  const stop = startDocumentAutoSync(() => { runs++; return new Promise(r => { release = r; }); }, s => states.push(s), { addEventListener() {}, removeEventListener() {} }, f => { tick = f; return 1; }, () => {});
  tick(); tick(); assert.equal(runs, 1); stop(); release(); await settle(); assert.deepEqual(states, ['syncing']);
});

test('automatic legacy import never claims unassigned or another account files', async () => {
  const { importOwnedLegacyDocuments } = await import('../app/document-vault-local.ts');
  const previous = globalThis.window;
  const values = new Map([['myway-active-user-id', 'current']]);
  globalThis.window = { localStorage: { getItem: key => values.get(key) ?? null }, get indexedDB() { throw Error('Must not open unowned files'); } };
  try {
    assert.equal(await importOwnedLegacyDocuments(), 0);
    values.set('myway-legacy-vault-owner-id', 'other');
    assert.equal(await importOwnedLegacyDocuments(), 0);
    values.set('myway-legacy-vault-owner-id', 'current');
    values.set('myway-legacy-vault-imported:current', 'complete');
    assert.equal(await importOwnedLegacyDocuments(), 0);
  } finally { globalThis.window = previous; }
});
