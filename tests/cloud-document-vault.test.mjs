import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocumentVault } from '../app/document-vault-service.ts';
import { validateDocument, MAX_DOCUMENT_BYTES } from '../app/document-vault-types.ts';
const document = (id = 'transcript') => ({ id, name: `${id}.pdf`, type: 'application/pdf', size: 7, uploadedAt: '2026-10-23T00:00:00.000Z', category: 'Transcript', version: 1 });
function setup() {
  const files = new Map();
  function device(initialUser = 'a') {
    let user = initialUser;
    const locals = new Map();
    let fail = false, saves = 0, switchOnList = false;
    const local = () => { if (!locals.has(user)) locals.set(user, new Map()); return locals.get(user); };
    const vault = createDocumentVault(async () => {
      const captured = user;
      const active = () => { if (!captured || user !== captured) throw new Error('Account changed'); };
      active();
      const key = id => `${captured}/${id}`;
      return {
        userId: captured, assertActive: active,
        async list() { if (fail) throw new Error('offline'); const rows = [...files].filter(([k]) => k.startsWith(`${captured}/`)).map(([,v]) => v); if (switchOnList) user = 'b'; return rows; },
        async save(d, blob) { active(); if (fail || ++saves === 2 && d.id === 'fail-once') throw new Error('offline'); if (files.get(key(d.id))?.deletedAt) throw new Error('Deleted'); files.set(key(d.id), { ...d, blob }); },
        async get(id) { active(); return files.get(key(id)); },
        async remove(id) { active(); const row = files.get(key(id)) || document(id); files.set(key(id), { ...row, blob: undefined, deletedAt: '2026-10-23' }); },
      };
    }, { list: async () => [...local().values()], get: async id => local().get(id), remove: async id => local().delete(id) });
    return { vault, seed(d) { local().set(d.id, { ...d, blob: new Blob(['private']) }); }, setUser(v) { user = v; }, offline(v) { fail = v; }, switchOnList() { switchOnList = true; }, originals: locals };
  }
  return { files, device };
}
test('uploaded file bytes are available to the same account on a clean second device', async () => {
  const { device } = setup(), first = device(), second = device();
  await first.vault.save(document(), new Blob(['private']));
  assert.equal((await second.vault.list())[0].storage, 'cloud');
  assert.equal(await (await second.vault.get('transcript')).blob.text(), 'private');
});
test('another account cannot list or download files and cannot delete the owner copy', async () => {
  const { device } = setup(), a = device(), b = device('b');
  await a.vault.save(document(), new Blob(['private']));
  assert.deepEqual(await b.vault.list(), []);
  assert.equal(await b.vault.get('transcript'), undefined);
  await b.vault.remove('transcript');
  assert.equal(await (await a.vault.get('transcript')).blob.text(), 'private');
});
test('migration preserves IDs, bytes, versions and the original local copies', async () => {
  const { device } = setup(), first = device(), second = device();
  first.seed({ ...document(), version: 2, previousVersionId: 'v1' });
  assert.equal((await first.vault.list())[0].storage, 'local');
  assert.equal(await first.vault.migrate(), 1);
  assert.equal(await first.vault.migrate(), 0);
  assert.equal((await second.vault.list())[0].version, 2);
  assert.equal((await second.vault.list())[0].previousVersionId, 'v1');
  assert.equal(await (await second.vault.get('transcript')).blob.text(), 'private');
  assert.equal(first.originals.get('a').size, 1);
});
test('a deletion on another device suppresses stale originals and migration does not resurrect them', async () => {
  const { device } = setup(), old = device(), other = device();
  old.seed(document()); await old.vault.migrate(); await other.vault.remove('transcript');
  assert.deepEqual(await old.vault.list(), []);
  assert.equal(await old.vault.get('transcript'), undefined);
  assert.equal(await old.vault.migrate(), 0);
  assert.equal(old.originals.get('a').size, 1);
});
test('partial migration is resumable and retains every original', async () => {
  const { device } = setup(), d = device(); d.seed(document()); d.seed(document('fail-once'));
  await assert.rejects(d.vault.migrate(), /offline/);
  assert.equal(d.originals.get('a').size, 2);
  assert.equal(await d.vault.migrate(), 1);
  assert.equal((await d.vault.list()).filter(x => x.storage === 'cloud').length, 2);
});
test('cloud errors are visible, with no misleading local-only success', async () => {
  const { device } = setup(), d = device(); d.seed(document()); d.offline(true);
  await assert.rejects(d.vault.list(), /offline/);
  await assert.rejects(d.vault.save(document(), new Blob(['private'])), /offline/);
  assert.equal(d.originals.get('a').size, 1);
});
test('account switch during a pending read aborts before showing or migrating data', async () => {
  const { device } = setup(), d = device(); d.seed(document()); d.switchOnList();
  await assert.rejects(d.vault.list(), /Account changed/);
});
test('cloud records win over stale browser metadata', async () => {
  const { device } = setup(), d = device(); d.seed({ ...document(), name: 'old.pdf' });
  await d.vault.save(document(), new Blob(['private']));
  assert.equal((await d.vault.list()).length, 1);
  assert.equal((await d.vault.list())[0].name, 'transcript.pdf');
});
test('upload validation enforces the storage limit, supported formats, safe IDs and matching bytes', () => {
  assert.equal(validateDocument(document(), new Blob(['private'])), 'application/pdf');
  assert.throws(() => validateDocument({ ...document(), id: '../other-account/file' }, new Blob(['private'])), /identifier/);
  assert.throws(() => validateDocument({ ...document(), name: 'bad.html' }, new Blob(['private'])), /PDF/);
  assert.throws(() => validateDocument({ ...document(), size: 6 }, new Blob(['private'])), /size/);
  assert.throws(() => validateDocument({ ...document(), size: MAX_DOCUMENT_BYTES + 1 }, { size: MAX_DOCUMENT_BYTES + 1 }), /20 MB/);
});
