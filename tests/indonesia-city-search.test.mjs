import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import vm from 'node:vm';import {createRequire} from 'node:module';import ts from 'typescript';
const file=new URL('../app/indonesia-data.ts',import.meta.url),require=createRequire(file),module={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports:module.exports,require,URL});
const {filterIndonesia,indonesiaUniversities}=module.exports;
const cities=JSON.parse(fs.readFileSync(new URL('../app/indonesia-university-locations.json',import.meta.url),'utf8'));
test('every listed university has sourced main campus location metadata',()=>{
 assert.deepEqual(Object.keys(cities).sort(),[...indonesiaUniversities].map(u=>u.id).sort());
 for(const [id,location] of Object.entries(cities)) {assert.ok(location.city&&location.label,id);assert.equal(new URL(location.sourceUrl).protocol,'https:');assert.match(new URL(location.sourceUrl).hostname,/(?:^|\.)ac\.id$/);assert.match(location.checkedOn,/^\d{4}-\d{2}-\d{2}$/);}
});
test('city browsing keeps university and faculty filters and existing catalogue results',()=>{
 assert.deepEqual([...new Set(filterIndonesia('surabaya','','').map(p=>p.university_id))].sort(),['its','unair']);
 assert.ok(filterIndonesia('depok','ui','').length>0);assert.equal(filterIndonesia('depok','itb','').length,0);
 const rows=filterIndonesia('Malang','ub','');assert.ok(rows.length>0);const faculty=rows[0].faculty;
 assert.ok(filterIndonesia('Malang','ub',faculty).every(p=>p.faculty===faculty));
 assert.equal(filterIndonesia('','','').length,530);
});
