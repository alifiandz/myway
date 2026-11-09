import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const file=new URL('../app/indonesia-compare-panel.tsx',import.meta.url),require=createRequire(file),module={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports:module.exports,require:path=>path==='./dialog-focus'?{useDialogFocus:()=>React.createRef()}:require(path)});
const props={language:'en',items:[{id:'ui',name:'Universitas Indonesia',city:'Depok',citySource:'https://international.ui.ac.id/contact/',logo:'/institution-logos/indonesia-ui.png',programmes:65,faculties:['Fakultas Teknik','Fakultas Ekonomi dan Bisnis'],directory:'https://ui.ac.id'}],close(){},remove(){},open(){}};
test('comparison has labelled table rows, individual removal and source links',()=>{
 const html=renderToStaticMarkup(React.createElement(module.exports.default,props));
 for(const value of ['Depok','65','Fakultas Teknik','Fakultas Ekonomi dan Bisnis','Listed S1 programmes','Programme directory'])assert.ok(html.includes(value));
 assert.match(html,/role="dialog"/);assert.match(html,/aria-modal="true"/);assert.match(html,/<table>/);assert.match(html,/scope="row"/);assert.match(html,/aria-label="Remove Universitas Indonesia"/);assert.match(html,/href="https:\/\/international.ui.ac.id\/contact\/"/);assert.match(html,/Counts are not rankings/);
});
test('comparison supports Indonesian labels and preserves the same counts',()=>{
 const html=renderToStaticMarkup(React.createElement(module.exports.default,{...props,language:'id'}));assert.match(html,/Bandingkan universitas/);assert.match(html,/Program S1 tercatat/);assert.match(html,/>65</);assert.match(html,/Kembali ke hasil/);
});
