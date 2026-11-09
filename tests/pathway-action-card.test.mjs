import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const file=new URL('../app/pathway-action-card.tsx',import.meta.url),require=createRequire(file),module={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports:module.exports,require});
const Card=module.exports.default,props={requirement:'English requirement',value:'Check official admissions page',effort:'15 min',timing:'Before booking a test',why:'Confirm the accepted test and score.',source:'Official admissions page',done:false,onToggle(){}};
test('action summary keeps current evidence and timing visible, with explanatory text in a closed disclosure',()=>{
 const html=renderToStaticMarkup(React.createElement(Card,props));
 for(const value of [props.requirement,props.value,props.effort,props.timing,props.why,props.source])assert.ok(html.includes(value));
 assert.match(html,/<details class="pathway-action-explanation">/);assert.doesNotMatch(html,/<details[^>]*\bopen/);
 assert.match(html,/Why &amp; source/);assert.match(html,/aria-label="Complete English requirement"/);assert.match(html,/aria-pressed="false"/);
 assert.equal((html.match(/<button/g)||[]).length,2);for(const button of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g))assert.doesNotMatch(button[1],/<details/);
});
test('completed actions remain explicitly reopenable and expandable independently of completion',()=>{
 const html=renderToStaticMarkup(React.createElement(Card,{...props,done:true}));
 assert.match(html,/aria-label="Reopen English requirement"/);assert.match(html,/aria-pressed="true"/);assert.match(html,/>Completed<\/button>/);assert.match(html,/<details/);
});
