import test from 'node:test';import assert from 'node:assert/strict';
import {readUniversityComparison,toggleUniversityComparison,facultyHighlights} from '../app/indonesia-comparison.ts';
const ids=['ugm','ui','itb','unair','its'];
test('comparison restores only valid distinct university IDs with a limit of four',()=>{
 assert.deepEqual(readUniversityComparison('["ugm","ugm","bad","ui","itb","unair","its"]',ids),ids.slice(0,4));
 assert.deepEqual(readUniversityComparison('invalid',ids),[]);assert.deepEqual(readUniversityComparison('{}',ids),[]);
 const stored=JSON.stringify(['ui','its']);assert.deepEqual(readUniversityComparison(stored,ids),['ui','its']);
});
test('a fifth university is rejected, while selected universities remain removable at the limit',()=>{
 const four=ids.slice(0,4);assert.deepEqual(toggleUniversityComparison(four,'its',ids),{selection:four,limitReached:true});
 const removed=toggleUniversityComparison(four,'ui',ids);assert.deepEqual(removed.selection,['ugm','itb','unair']);assert.equal(removed.limitReached,false);
 assert.deepEqual(toggleUniversityComparison(removed.selection,'its',ids).selection,['ugm','itb','unair','its']);
});
test('card highlights use existing faculty names without adding unsupported subjects',()=>{
 assert.equal(facultyHighlights(['Fakultas Biologi','Fakultas Ekonomi dan Bisnis','Fakultas Teknik']),'Ekonomi dan Bisnis · Teknik');
 assert.equal(facultyHighlights(['Fakultas Hukum']),'Hukum');assert.equal(facultyHighlights([]),'');
});
