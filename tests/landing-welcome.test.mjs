import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
test('landing frame accepts only explicit actions from its same-origin child',()=>{
 const callbacks={},child={},calls=[],origin='https://mywaypath.com',module={exports:{}};
 const react={useRef:()=>({current:{contentWindow:child}}),useEffect:fn=>fn()};
 const source=fs.readFileSync(new URL('../app/landing-welcome.tsx',import.meta.url),'utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports:module.exports,require:p=>p==='react'?react:require(p),window:{location:{origin},addEventListener:(k,fn)=>callbacks[k]=fn,removeEventListener(){}}});
 const frame=module.exports.default({openAccount:()=>calls.push('account'),explore:()=>calls.push('browse')});assert.equal(frame.type,'iframe');assert.equal(frame.props.src,'/welcome/index.html');assert.match(frame.props.title,/MyWay/);
 const event={origin,source:child,data:{type:'myway-landing-action',action:'account'}};
 callbacks.message({...event,origin:'https://other.example'});callbacks.message({...event,source:{}});callbacks.message({...event,data:{type:'myway-landing-action',action:'admin'}});assert.deepEqual(calls,[]);
 callbacks.message(event);callbacks.message({...event,data:{type:'myway-landing-action',action:'browse'}});assert.deepEqual(calls,['account','browse']);
});
test('approved landing has valid scripts, local assets and connected catalogue entry',()=>{
 const root=new URL('../public/welcome/',import.meta.url),html=fs.readFileSync(new URL('index.html',root),'utf8');
 for(const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 for(const match of html.matchAll(/src="(assets\/[^"$]+)"/g))assert.ok(fs.existsSync(new URL(match[1],root)),match[1]);
 assert.match(html,/data-myway-action="browse"/);assert.match(html,/myway-landing-action/);assert.match(html,/https:\/\/mywaypath.com\//);assert.doesNotMatch(html,/chatgpt\.site/);
});
