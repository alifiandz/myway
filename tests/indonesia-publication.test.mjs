import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),root=path.resolve('app'),cache=new Map();
function load(file){if(cache.has(file))return cache.get(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));const exports={};cache.set(file,exports);const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;vm.runInNewContext(js,{exports,require:name=>{if(!name.startsWith('.'))return require(name);const base=path.resolve(path.dirname(file),name),resolved=['','.ts','.tsx'].map(ext=>base+ext).find(p=>fs.existsSync(p));return load(resolved);}});return exports;}
const {summarizePublishedIndonesia}=load(path.join(root,'indonesia-publication.ts'));
const {default:Catalogue}=load(path.join(root,'admin/data/indonesia-live-catalogue.tsx'));
const rows=JSON.parse(fs.readFileSync(path.join(root,'indonesia-catalogue.json')));
test('admin publication counts use public data and keep publication separate from curriculum review',()=>{
 const x=summarizePublishedIndonesia();assert.equal(x.universities.length,9);assert.equal(x.programmeCount,530);assert.equal(x.facultyCount,111);assert.equal(x.reviewedSummaries,6);assert.equal(x.summariesToReview,524);assert.equal(x.sourceAudits,530);assert(x.curriculumSources>6);assert(x.programmeGaps<=530);assert(!x.universities.some(u=>u.id==='amikom'));
 const subset=rows.filter(p=>p.university_id==='its'),y=summarizePublishedIndonesia(subset);assert.equal(y.universities.length,1);assert.equal(y.programmeCount,subset.length);assert.equal(y.reviewedSummaries,0);assert.equal(y.summariesToReview,subset.length);
});
test('published admin catalogue shows real logos, view-only controls and review scope in both languages',()=>{
 for(const language of ['en','id']){const html=renderToStaticMarkup(React.createElement(Catalogue,{language}));assert.match(html,/530/);assert.match(html,/Programme source reviews|Tinjauan sumber program/);assert.match(html,/indonesia-its-emblem/);assert.doesNotMatch(html,/AMIKOM|Save this section/);assert.match(html,language==='en'?/View only/:/Hanya tampilan/);}
});
test('each published university has a usable admin detail with programme evidence and explicit unreviewed status',()=>{
 for(const u of summarizePublishedIndonesia().universities){const html=renderToStaticMarkup(React.createElement(Catalogue,{language:'en',universityId:'indonesia-'+u.id}));assert(html.includes(u.name));assert.match(html,/Official source/);assert.match(html,/cannot yet be edited/);assert.match(html,/curriculum source checked|Curriculum evidence gap/);assert.doesNotMatch(html,/Save this section/);}
});
