import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import * as focus from '../app/focus-session.ts';
const file=new URL('../app/focused-task-workspace.tsx',import.meta.url),require=createRequire(file),module={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports:module.exports,require:path=>path==='./focus-session'?focus:require(path)});
const Card=module.exports.default,props={routine:{id:'research',title:'Programme research',focus:'Check one official source',minutes:20},guide:{source:'Official page',sourceDetail:'Check the exact programme',outcome:'Record one fact',steps:['Open the source','Record the result'],materials:['Notes'],doneWhen:['Result recorded']},isDone:false,close(){},toggleTask(){throw new Error('Completion must be explicit');},onSave(){}};
test('proof remains optional and safe, with break controls and explicit completion',()=>{
 const html=renderToStaticMarkup(React.createElement(Card,props));
 assert.match(html,/Proof is optional and does not change task completion/);assert.match(html,/Take a break/);assert.match(html,/5 minutes/);assert.match(html,/10 minutes/);assert.match(html,/15 minutes/);assert.match(html,/Mark complete/);assert.match(html,/aria-pressed="false"/);assert.match(html,/Focus time/);assert.match(html,/Break time/);assert.doesNotMatch(html,/<(?:input|textarea)[^>]*required/);
});
test('stored proof and steps restore independently of completion and unsafe URLs are not linked',()=>{
 const html=renderToStaticMarkup(React.createElement(Card,{...props,routine:{...props.routine,focusSession:{...focus.newFocusSession(),proofNote:'My result',proofUrl:'javascript:alert(1)',checkedSteps:[0]}}}));
 assert.match(html,/My result/);assert.match(html,/aria-pressed="true"/);assert.match(html,/1 of 2/);assert.doesNotMatch(html,/href="javascript:/);assert.match(html,/Mark complete/);
});

test('optional proof starts as a compact closed disclosure while saved proof remains available',()=>{
 const html=renderToStaticMarkup(React.createElement(Card,props));
 assert.match(html,/<details class="card task-proof">/);assert.doesNotMatch(html,/<details class="card task-proof"[^>]*open/);assert.match(html,/>Add proof<\/strong>/);
 const saved=renderToStaticMarkup(React.createElement(Card,{...props,routine:{...props.routine,focusSession:{...focus.newFocusSession(),proofNote:'Saved result'}}}));
 assert.match(saved,/>Your proof<\/strong>/);assert.match(saved,/Saved result/);assert.match(saved,/Mark complete<\/button>/);
});
