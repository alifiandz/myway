import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const catalogue=JSON.parse(fs.readFileSync(new URL('../app/major-discovery/majors.json',import.meta.url),'utf8'));
function evaluate(source,resolve){const mod={exports:{}};const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('require','module','exports',js)(resolve,mod,mod.exports);return mod.exports;}
const model=evaluate(fs.readFileSync(new URL('../app/major-discovery/model.ts',import.meta.url),'utf8'),p=>p==='./majors.json'?catalogue:require(p));
const ui=evaluate(fs.readFileSync(new URL('../app/major-discovery/discovery.tsx',import.meta.url),'utf8')+'\nexport {ReflectionSummary};',p=>p==='./model'?model:p==='./discovery.css'?{}:require(p));
function nodes(element,predicate){if(!element||!element.props)return [];return [...(predicate(element)?[element]:[]),...React.Children.toArray(element.props.children).flatMap(child=>nodes(child,predicate))];}
function text(element){return typeof element==='string'?element:element?.props?React.Children.toArray(element.props.children).map(text).join(''):'';}
test('reflection guidance searches an explicitly selected subject and shows only actually endorsed activities',()=>{
 const state=model.emptyState();state.finished=true;state.started=true;state.answers={'0':['Biology','Visual Arts & Design'],'2.0':['Like'],'2.1':['Dislike']};
 const searches=[];const element=ui.ReflectionSummary({state,update(){},onModeChange(){},onExplore(){},onSearch:q=>searches.push(q),open(){}});
 const html=renderToStaticMarkup(element);assert.match(html,/Activities you said you would enjoy/);assert.match(html,/Study how people learn/);assert.match(html,/Start your research list/);assert.doesNotMatch(html,/\d+%|Your top matches/);
 const buttons=nodes(element,n=>n.type==='button');buttons.find(button=>text(button)==='Biology').props.onClick();buttons.find(button=>text(button)==='Design').props.onClick();assert.deepEqual(searches,['Biology','Design']);
});
test('saved research list reflects manual saves and opens the same canonical major',()=>{
 const state=model.emptyState();state.saved=['psychology'];const opened=[];const element=ui.ReflectionSummary({state,update(){},onModeChange(){},onExplore(){},onSearch(){},open:m=>opened.push(m.id)});
 const html=renderToStaticMarkup(element);assert.match(html,/These are majors you saved, not assessment recommendations/);
 nodes(element,n=>n.type==='button').find(button=>text(button)==='Psychology').props.onClick();assert.deepEqual(opened,['psychology']);
});
test('study concerns become programme research questions without removing saved majors',()=>{
 const state=model.emptyState();state.saved=['medicine'];state.answers={'7':['Direct patient-facing work','Long professional training']};
 const element=ui.ReflectionSummary({state,update(){},onModeChange(){},onExplore(){},onSearch(){},open(){}});
 const html=renderToStaticMarkup(element);assert.match(html,/Are clinical placements or direct patient contact required/);assert.match(html,/What further training or registration is needed/);assert.match(html,/Medicine/);assert.doesNotMatch(html,/excluded|ineligible|\d+%/i);
});
