import test from 'node:test';
import assert from 'node:assert/strict';
import {newFocusSession,changeFocusSession,advanceFocusSession,restoreFocusSession,proofReference} from '../app/focus-session.ts';
const start=100000;
test('focus uses elapsed wall time across backgrounding and stops at the duration',()=>{
 const s=changeFocusSession(newFocusSession(),'start',start,20);
 const delayed=advanceFocusSession(s,start+90000,20);
 assert.equal(delayed.focusMs,90000);assert.equal(delayed.totalFocusMs,90000);
 const end=advanceFocusSession(s,start+40*60000,20);
 assert.equal(end.totalFocusMs,20*60000);assert.equal(end.running,false);assert.equal(end.startedAt,null);
 assert.deepEqual(advanceFocusSession(end,start+50*60000,20),end);
});
test('pause excludes idle time and resume preserves elapsed focus time',()=>{
 let s=changeFocusSession(newFocusSession(),'start',start,20);
 s=changeFocusSession(s,'pause',start+30000,20);
 assert.equal(advanceFocusSession(s,start+90000,20).focusMs,30000);
 s=changeFocusSession(s,'start',start+90000,20);
 s=changeFocusSession(s,'pause',start+100000,20);
 assert.equal(s.focusMs,40000);assert.equal(s.totalFocusMs,40000);
});
test('breaks preserve focus progress, track time separately and do not auto resume focus',()=>{
 let s=changeFocusSession(newFocusSession(),'start',start,20);
 s=changeFocusSession(s,'break',start+60000,20);
 assert.equal(s.focusMs,60000);assert.equal(s.breakCount,1);
 s=advanceFocusSession(s,start+60*60000,20);
 assert.equal(s.totalBreakMs,5*60000);assert.equal(s.totalFocusMs,60000);assert.equal(s.phase,'break');assert.equal(s.running,false);
 s=changeFocusSession(s,'focus',start+61*60000,20);
 assert.equal(s.running,false);assert.equal(s.focusMs,60000);
});
test('ending a break early, paused breaks and reset keep accurate totals and optional proof',()=>{
 let s={...newFocusSession(),proofNote:'Completed practice',proofUrl:'https://example.org/result',checkedSteps:[0]};
 s=changeFocusSession(s,'start',start,20);s=changeFocusSession(s,'break',start+10000,20);
 s=changeFocusSession(s,'pause',start+20000,20);s=changeFocusSession(s,'start',start+50000,20);
 s=changeFocusSession(s,'focus',start+55000,20);
 assert.equal(s.totalBreakMs,15000);assert.equal(s.breakCount,1);
 s=changeFocusSession(s,'reset',start+60000,20);
 assert.equal(s.focusMs,0);assert.equal(s.totalFocusMs,10000);assert.equal(s.totalBreakMs,15000);
 assert.equal(s.proofNote,'Completed practice');assert.deepEqual(s.checkedSteps,[0]);
 assert.deepEqual(restoreFocusSession(JSON.parse(JSON.stringify(s))),s);
});
test('old routines need no migration and unsafe proof links cannot become clickable',()=>{
 assert.deepEqual(restoreFocusSession(undefined),newFocusSession());
 assert.equal(proofReference('javascript:alert(1)'),null);assert.equal(proofReference('data:text/html,foo'),null);
 assert.equal(proofReference('https://user:password@example.org'),null);
 assert.equal(proofReference('https://example.org/result'),'https://example.org/result');
 assert.deepEqual(restoreFocusSession({checkedSteps:[0,0,-1,'1'],focusMs:-5,breakMinutes:999}).checkedSteps,[0]);
});
