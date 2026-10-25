import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('app/indonesia-structured-curricula.json','utf8'));
const baseline=JSON.parse(fs.readFileSync('app/indonesia-deep-research.json','utf8'));
const previous=JSON.parse(fs.readFileSync('docs/research/indonesia-bulk-curriculum-2026-10-25/batch-report.json','utf8'));
const records=Object.assign({},...Object.values(baseline).map(u=>u.programmes));
const targets=previous.fullyVerifiedCurriculumSources.filter(id=>!records[id].curriculumEvidence.serializedCoursesComplete);
test('structured extension targets exactly the20 incomplete v148 extracts and preserves51 source gaps',()=>{
 assert.deepEqual(Object.keys(data).sort(),targets.sort());
 assert.equal(Object.values(records).filter(r=>r.fields.curriculum.status!=='verified').length,51);
 for(const id of Object.keys(data))assert.equal(records[id].fields.curriculum.status,'verified',id);
});
test('structured rows retain programme-specific provenance and no exact duplicate objects',()=>{
 for(const [id,curriculum]of Object.entries(data)){
  assert.equal(curriculum.programmeId,id);assert.equal(curriculum.sourceUrl,records[id].fields.curriculum.sourceUrl);
  assert.equal(curriculum.curriculumYear,records[id].fields.curriculum.sourceYear);
  assert.match(curriculum.sourceDocumentSha256,/^[a-f0-9]{64}$/);
  assert(curriculum.courses.length>0,id);const keys=curriculum.courses.map(c=>JSON.stringify(c));assert.equal(new Set(keys).size,keys.length,id);
  for(const row of curriculum.courses){if(typeof row.sks==='number')assert(row.sks>=0&&row.sks<=30,id+JSON.stringify(row));if(row.sourcePage!==undefined)assert(row.sourcePage>0,id);}
 }
});
test('source verification completeness and current cohort applicability remain distinct',()=>{
 for(const [id,curriculum]of Object.entries(data)){
  assert.equal(curriculum.sourceVerification,'verified');assert.equal(curriculum.currentCohortApplicability,'not_established');
  assert(['complete','partial'].includes(curriculum.completeness));
  if(curriculum.completeness==='complete'){
   assert(curriculum.courses.every(c=>typeof c.name==='string'&&c.name.trim()),id);
   assert(curriculum.validation||curriculum.extraction,id);
  }else assert(curriculum.blocker||curriculum.blockers?.length,id);
 }
});
test('full tables reconcile representative source totals without summing alternative requirements',()=>{
 const gizi=data['id-ub-s1-ilmu-gizi'];assert.equal(gizi.courses.length,85);assert.equal(gizi.completeness,'complete');
 const fkh=data['id-ub-s1-pendidikan-dokter-hewan'];assert.equal(fkh.courses.filter(c=>c.classification==='elective').reduce((n,c)=>n+c.sks,0),28);
 const stat=data['id-undip-s1-statistika'];assert.equal(stat.courses.length,88);
 const si=data['id-ub-s1-sistem-informasi'];assert.equal(si.validation.regularTotalSKS,145);
});
