import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),cache=new Map();
function load(file){if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file));if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;vm.runInNewContext(js,{exports,require:name=>{if(!name.startsWith('.'))return require(name);const p=path.resolve(path.dirname(file),name);return load(['','.tsx','.ts'].map(e=>p+e).find(x=>fs.existsSync(x)));}});return exports;}
const root=path.resolve('app'),rows=JSON.parse(fs.readFileSync(path.join(root,'indonesia-catalogue.json'))),research=load(path.join(root,'indonesia-research.ts')),components=load(path.join(root,'indonesia-research-information.tsx'));
test('all public programme offerings have individual source audits and field-level provenance',()=>{
 assert.equal(Object.keys(research.universityResearch).length,9);assert.equal(Object.keys(research.programmeResearch).length,rows.length);
 for(const row of rows){const r=research.programmeResearch[row.id];assert(r,row.id);assert(r.searchLog.length,row.id);for(const key of ['degree','credits','duration','language','curriculum']){const f=r.fields[key];assert(f,row.id+key);if(f.status==='verified'){assert(f.value!==null&&f.value!=='',row.id+key);assert.match(f.sourceUrl,/^https?:\/\//,row.id+key);}}}
});
test('a historical academic year is never treated as confirmed next-intake information',()=>{
 for(const sourceYear of ['2026','2026/2027','2024','Undated','No confirmed 2027/2028 policy',null])assert.equal(research.isConfirmedTargetYear({status:'verified',sourceYear}),false);
 for(const sourceYear of ['2027','2027/2028','2027–2028'])assert.equal(research.isConfirmedTargetYear({status:'verified',sourceYear}),true);
 assert.equal(research.isConfirmedTargetYear({status:'not_announced',sourceYear:'2027/2028'}),false);assert.equal(research.isConfirmedTargetYear({status:'verified',sourceYear:'2027/2028',note:'Preliminary month-level guidance only'}),false);
});
test('researched course views and next-intake guidance render across every university without claiming all data published',()=>{
 for(const row of rows){const html=renderToStaticMarkup(React.createElement(components.ProgrammeResearchInformation,{programmeId:row.id,id:false,study:true}));assert.match(html,/Curriculum &amp; courses/,row.id);assert.match(html,/Applicability to the 2027 intake requires confirmation/,row.id);assert.doesNotMatch(html,/curriculum review pending/i,row.id);}
 for(const uid of Object.keys(research.universityResearch)){for(const id of [false,true]){const html=renderToStaticMarkup(React.createElement(components.NextIntakeResearch,{uid,id}));assert.match(html,/2027\/2028/);assert.match(html,id?/bukan konfirmasi syarat/:/does not confirm 2027 requirements/);}}
});

test('published course examples never use a rejected master curriculum',()=>{
 for(const row of rows){const r=research.programmeResearch[row.id];for(const course of r.courses??[])assert.doesNotMatch(course.sourceUrl,/kurikulum-mag-|program-magister|master-program/i,row.id);}
});
test('numeric study plans include semester units and credit facts include SKS',()=>{
 const p=Object.entries(research.programmeResearch).find(([,r])=>typeof r.fields.duration.value==='number'&&r.fields.duration.status==='verified');assert(p);
 const html=renderToStaticMarkup(React.createElement(components.ProgrammeResearchInformation,{programmeId:p[0],id:false}));assert.match(html,/\d+ semesters/);
});

test('main-campus UNAIR programmes keep their own faculties and campus offerings remain separate',()=>{
 const expected={'kedokteran':'Fakultas Kedokteran','kedokteran-hewan':'Fakultas Kedokteran Hewan','kesehatan-masyarakat':'Fakultas Kesehatan Masyarakat','akuakultur':'Fakultas Perikanan dan Kelautan'};
 for(const [slug,faculty] of Object.entries(expected))assert.equal(rows.find(r=>r.id==='id-unair-s1-'+slug).faculty,faculty);
 assert.equal(new Set(rows.map(r=>r.id)).size,530);
});
