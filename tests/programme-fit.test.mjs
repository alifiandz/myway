import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateProgramFit, selectRecommendations } from '../app/programme-fit.ts';
import { schoolStudyRows, additionalSchoolStudyRows } from '../app/school-data.ts';
const program = { title: 'Business Management', curriculum: ['Management','Exchange','Internships'], entry: 'Bachelor’s programme available', math: 'Not yet verified', location: 'France', language: 'English', tuition: 'See the current official fee schedule', experience: 'Exchange and internships' };
const profile = { fields: 'Management', countries: 'France', language: 'English' };
const study = { status: 'bachelor', areas: ['Management'] };

test('an unconfirmed must-have cannot receive Good/Strong fit or enter recommendations', () => {
 const required = calculateProgramFit(program, study, profile, { Scholarships: 'Must have' });
 const preferred = calculateProgramFit(program, study, profile, { Scholarships: 'Prefer' });
 assert.equal(required.label, 'Must-have unverified');
 assert.deepEqual(required.mustHaveGaps, ['Scholarships']);
 assert.ok(required.score < 60);
 assert.ok(preferred.score > required.score);
 assert.deepEqual(selectRecommendations([{id:'required'},{id:'preferred'}], {required,preferred}).map(x=>x.id), ['preferred']);
});
test('confirmed must-have evidence remains eligible; negative mentions do not count', () => {
 const confirmed = calculateProgramFit({...program, experience:'Scholarships available'}, study, profile, {Scholarships:'Must have'});
 const negative = calculateProgramFit({...program, experience:'Scholarships are not confirmed'}, study, profile, {Scholarships:'Must have'});
 assert.deepEqual(confirmed.mustHaveGaps, []);
 assert.deepEqual(negative.mustHaveGaps, ['Scholarships']);
 assert.deepEqual(selectRecommendations([{id:'confirmed'},{id:'negative'}], {confirmed,negative}).map(x=>x.id), ['confirmed']);
});
test('recommendations can select a programme beyond the five preset entries from the complete real catalogue', () => {
 const catalogue = [...schoolStudyRows.map((s,i)=>({id:`school:ft-school-${i+1}`,study:s})), ...Object.entries(additionalSchoolStudyRows).map(([id,s])=>({id:`school:${id}`,study:s}))].filter(x=>x.study.status==='bachelor');
 assert.equal(catalogue.length,100);
 const fits = Object.fromEntries(catalogue.map(x=>[x.id,calculateProgramFit({...program,title:x.study.title,curriculum:x.study.areas},x.study,{fields:'Management'}, {})]));
 const last = catalogue.at(-1);
 fits[last.id]={...fits[last.id],score:100,mustHaveGaps:[]};
 assert.equal(selectRecommendations(catalogue,fits)[0].id,last.id);
 assert.equal(new Set(catalogue.map(x=>x.id)).size,100);
});
test('missing profile and all unconfirmed must-haves produce no fabricated recommendations', () => {
 const blank = calculateProgramFit(program,study,{},{});
 const unknown = calculateProgramFit(program,study,profile,{Scholarships:'Must have'});
 assert.deepEqual(selectRecommendations([{id:'blank'},{id:'unknown'}],{blank,unknown}),[]);
});

test('unknown maths evidence never earns compatibility points',()=>{
 for(const math of ['Not assessed','Not yet verified','Unknown','Not confirmed','']){
  const result=calculateProgramFit({...program,math},undefined,{math:'Low'},{});
  assert(!result.breakdown.some(row=>row.label==='Math comfort'));
  assert.equal(result.score,null);assert.equal(result.label,'Not enough information');
 }
 const known=calculateProgramFit({...program,math:'High'},study,{math:'Low'},{});
 assert.equal(known.breakdown.find(row=>row.label==='Math comfort').score,25);
});
test('unknown language and ambiguous or mixed-currency tuition are excluded',()=>{
 const result=calculateProgramFit({...program,language:'Not confirmed',tuition:'IDR 2026/2027: 15000000'},study,{language:'English',budget:'EUR 20000'},{});
 assert(!result.breakdown.some(row=>row.label==='Location & language'||row.label==='Budget'));
 assert.equal(result.score,null);
});
