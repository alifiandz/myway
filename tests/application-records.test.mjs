import test from 'node:test';import assert from 'node:assert/strict';
import {applicationRecord} from '../app/application-records.ts';
test('switching UB UNDIP and international applications preserves separate records and document links after refresh',()=>{
 const applications=['id-ub-s1-sistem-informasi','id-undip-s1-statistika','aalto'];
 const records={},links={},actions=[];
 for(const [index,id] of applications.entries()){
  records[`${id}:applicationRoute`]=`route-${index}`;
  records[`${id}:file-requirements`]=`evidence-${index}.pdf`;
  links[`${id}:file-requirements`]=`document-${index}`;
  actions.push(`${id}:entry-route`);
 }
 const restored=JSON.parse(JSON.stringify({records,links,actions}));
 for(const [index,id]of applications.entries()){
  assert.equal(applicationRecord(restored.records,id,'applicationRoute'),`route-${index}`);
  assert.equal(applicationRecord(restored.records,id,'file-requirements'),`evidence-${index}.pdf`);
  assert.equal(restored.links[`${id}:file-requirements`],`document-${index}`);
  assert.equal(restored.actions.filter(action=>action.startsWith(`${id}:`)).length,1);
 }
 restored.records[`${applications[0]}:file-requirements`]='replacement.pdf';
 assert.equal(applicationRecord(restored.records,applications[1],'file-requirements'),'evidence-1.pdf');
 assert.equal(applicationRecord(restored.records,applications[2],'file-requirements'),'evidence-2.pdf');
});
test('unlinked applications never inherit unscoped filenames through the scoped reader',()=>{
 assert.equal(applicationRecord({'file-requirements':'old.pdf'},'id-ub-s1-sistem-informasi','file-requirements'),'');
});
