import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../app/admin/data/admin-overview.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, require });
const { summarizeAdminData, default: AdminOverview } = module.exports;
const fact = (status, field_key = 'tuition') => ({ status, field_key });
const university = (id, facts) => ({ id, name: id, programmes: [{ programme_facts: facts }] });

test('admin overview accounts for every status and every programme without changing records', () => {
  const records = [university('A', [fact('verified'), fact('not_yet_verified'), fact('not_published')]), university('B', [fact('under_review'), fact('outdated')])];
  records[0].programmes.push({ programme_facts: [fact('verified', 'ranking')] });
  const before = JSON.stringify(records);
  const result = summarizeAdminData(records);
  assert.equal(result.total, 6);
  assert.equal(result.verified, 2);
  assert.equal(result.unverified, 1);
  assert.equal(result.unpublished, 1);
  assert.equal(result.other, 2);
  assert.equal(result.verified + result.unverified + result.unpublished + result.other, result.total);
  assert.equal(result.categories.find((category) => category.key === 'tuition').total, 5);
  assert.equal(result.categories.find((category) => category.key === 'ranking').verified, 1);
  assert.equal(result.queue[0].open, 2);
  assert.equal(JSON.stringify(records), before);
});

test('empty and fully verified catalogues do not fabricate a review queue or invalid chart values', () => {
  for (const items of [[], [university('A', [fact('verified')])]]) {
    assert.equal(summarizeAdminData(items).queue.length, 0);
    const html = renderToStaticMarkup(React.createElement(AdminOverview, { items, language: 'en', openEditor() {} }));
    assert.doesNotMatch(html, /NaN|Infinity/);
    assert.match(html, /No unverified records/);
  }
});

test('overview renders labelled graphics, review actions and Indonesian copy without exposing private notes', () => {
  const items = [university('Example university', [fact('not_yet_verified'), fact('verified')])];
  items[0].programmes[0].programme_facts[0].note = 'PRIVATE NOTE MUST NOT APPEAR';
  const html = renderToStaticMarkup(React.createElement(AdminOverview, { items, language: 'en', openEditor() {} }));
  assert.match(html, /50%/);
  assert.match(html, /Example university/);
  assert.match(html, /Open university editor/);
  assert.match(html, /Verification status is not a publication or admissions-readiness score/);
  assert.doesNotMatch(html, /PRIVATE NOTE/);
  const id = renderToStaticMarkup(React.createElement(AdminOverview, { items, language: 'id', openEditor() {} }));
  assert.match(id, /CAKUPAN VERIFIKASI/);
  assert.match(id, /Buka editor universitas/);
});
