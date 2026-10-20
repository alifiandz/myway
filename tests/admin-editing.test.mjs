import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { publicMyWayUrl } from '../app/myway-url.ts';
import { validateUniversityLogo, saveUniversityLogo } from '../app/admin/data/logo-policy.ts';
function component(relative) {
  const file = new URL(relative, import.meta.url), require = createRequire(file), loadedModule = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(js, { exports: loadedModule.exports, require }); return loadedModule.exports;
}
const { default: AdminNavigation } = component('../app/admin/admin-navigation.tsx');
const { default: UniversityCards, universityEditorPath } = component('../app/admin/data/university-cards.tsx');

test('every admin section retains all four navigation destinations and marks one active', () => {
  for (const active of ['overview','universities','logos','feedback']) {
    const html = renderToStaticMarkup(React.createElement(AdminNavigation, { active }));
    for (const path of ['/admin/data','/admin/universities','/admin/logos','/admin/feedback']) assert.ok(html.includes(`href="${path}"`));
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
  }
});
test('university cards open individual data and logo routes without changing stored records', () => {
  const items = [{ id: 'university / test', name: 'Test University', city: 'City', country: 'Country', logo_url: null, programmes: [{ title:'Programme', programme_facts:[{status:'verified'},{status:'not_published'}] }] }];
  const before = JSON.stringify(items);
  for (const logos of [false,true]) {
    const html = renderToStaticMarkup(React.createElement(UniversityCards,{items,logos,language:'en'}));
    assert.ok(html.includes(universityEditorPath(items[0].id, logos)));
    assert.match(html, /Test University/);assert.doesNotMatch(html,/NaN/);
  }
  assert.equal(JSON.stringify(items), before);
});
test('archived MyWay page context uses the canonical origin while keeping path and hash', () => {
  assert.equal(publicMyWayUrl('https://alif-pathway.smalhi2025.chatgpt.site/#dashboard'),'https://mywaypath.com/#dashboard');
  assert.equal(publicMyWayUrl('https://university.example/path'),'https://university.example/path');
  assert.equal(publicMyWayUrl('javascript:alert(1)'),'');assert.equal(publicMyWayUrl('not a URL'),'');
});
test('logo URLs allow public HTTPS/local assets and reject executable, credentialed and traversal inputs', () => {
  assert.equal(validateUniversityLogo(' /institution-logos/ft-school-2.png '),'/institution-logos/ft-school-2.png');
  assert.equal(validateUniversityLogo('https://example.edu/logo.svg'),'https://example.edu/logo.svg');
  for (const input of ['','data:image/png;base64,AAA','javascript:alert(1)','http://example.edu/logo.png','https://user:secret@example.edu/logo.png','//example.edu/logo.png','/institution-logos/../x.png']) assert.throws(()=>validateUniversityLogo(input));
});
function logoClient(result, calls) { return { from(table) { calls.push(['table',table]); return { update(value) { calls.push(['update',value]); return { eq(key,id) { calls.push(['filter',key,id]); return { select(columns) { calls.push(['select',columns]); return { async single() { return result; } }; } }; } }; } }; } }; }
test('logo save updates only the chosen university logo and requires confirmed readback', async () => {
  const calls=[],url='https://example.edu/logo.png';
  assert.equal(await saveUniversityLogo(logoClient({data:{id:'school-1',logo_url:url},error:null},calls),'school-1',url),url);
  assert.deepEqual(calls,[['table','universities'],['update',{logo_url:url}],['filter','id','school-1'],['select','id,logo_url']]);
  await assert.rejects(saveUniversityLogo(logoClient({data:null,error:{message:'denied'}},[]),'school-1',url));
  await assert.rejects(saveUniversityLogo(logoClient({data:{id:'other',logo_url:url},error:null},[]),'school-1',url));
});
