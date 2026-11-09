import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { paginateResults, EXPLORE_PAGE_SIZE } from '../app/explore-pagination.ts';
const file = new URL('../app/browse-pagination.tsx', import.meta.url), require = createRequire(file), module = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports:module.exports,require});
const Pagination = module.exports.default;
test('the full directory is reachable in bounded pages without duplicates or changing source order',()=>{
 const source=Array.from({length:100},(_,id)=>({id})), original=JSON.stringify(source), seen=[];
 for(let page=1;page<=5;page++){ const result=paginateResults(source,page);assert.equal(result.items.length,EXPLORE_PAGE_SIZE);assert.equal(result.page,page);seen.push(...result.items.map(x=>x.id)); }
 assert.deepEqual(seen,source.map(x=>x.id));assert.equal(new Set(seen).size,100);assert.equal(JSON.stringify(source),original);
});
test('changed result counts clamp stale pages and handle empty, partial and invalid requests',()=>{
 assert.deepEqual(paginateResults([],9),{items:[],total:0,pages:1,page:1,start:0,end:0});
 const source=Array.from({length:23},(_,i)=>i);
 assert.deepEqual(paginateResults(source,9).items,[20,21,22]);assert.equal(paginateResults(source,9).start,21);assert.equal(paginateResults(source,9).end,23);
 for(const page of [-1,0,NaN,Infinity]) assert.equal(paginateResults(source,page).page,1);
 assert.equal(paginateResults(source.slice(0,4),5).page,1);
});
test('pagination announces ranges in both languages with correct boundary controls',()=>{
 const props={...paginateResults(Array.from({length:43}),1),onPage(){}};
 let html=renderToStaticMarkup(React.createElement(Pagination,{...props,language:'en'}));
 assert.match(html,/Showing 1–20 of 43/);assert.match(html,/Page 1 of 3/);assert.equal((html.match(/disabled=""/g)||[]).length,1);assert.match(html,/aria-live="polite"/);
 html=renderToStaticMarkup(React.createElement(Pagination,{...props,...paginateResults(Array.from({length:43}),3),language:'id'}));
 assert.match(html,/Menampilkan 41–43 dari 43/);assert.match(html,/Sebelumnya/);assert.match(html,/Berikutnya/);assert.equal((html.match(/disabled=""/g)||[]).length,1);
 assert.equal(renderToStaticMarkup(React.createElement(Pagination,{...paginateResults([],1),language:'en',onPage(){}})),'');
});
