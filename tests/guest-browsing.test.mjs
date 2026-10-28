import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const source=fs.readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const pieces=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&['GuestExplore','AccountGate'].includes(n.name?.text)).map(n=>n.getText(ast)).join('\n');
function setup(){
 const writes=[],signins=[];
 const states=[{},'international',null,[],false,{}];let index=0;
 const component=name=>Object.assign(()=>null,{displayName:name});
 const context={require,exports:{},useState:()=>{const i=index++;return [states[i],value=>writes.push([i,value])];},initialExploreBrowseState:{},Explore:component('Explore'),SchoolDetail:component('SchoolDetail'),ComparePanel:component('ComparePanel'),PublicUniversityLogo:component('Logo'),Search:component('Search'),CircleUserRound:component('User'),ShieldCheck:component('Shield'),LockKeyhole:component('Lock'),Scale:component('Scale')};
 vm.createContext(context);vm.runInContext(ts.transpileModule(pieces+'\nexports.GuestExplore=GuestExplore;exports.AccountGate=AccountGate;', {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,context);
 return {context,writes,signins,openAccount:()=>signins.push(true)};
}
function find(node,name){if(!node)return; if(node.type?.displayName===name)return node;for(const child of React.Children.toArray(node.props?.children)){const value=find(child,name);if(value)return value;}}
test('guest catalogue starts with no account selections and personal actions request sign in',()=>{
 const s=setup(),tree=s.context.exports.GuestExplore({language:'en',openAccount:s.openAccount});
 const explore=find(tree,'Explore');assert.ok(explore);assert.equal(explore.props.saved.length,0);assert.equal(explore.props.schoolPathwayIds.length,0);assert.equal(Object.keys(explore.props.records).length,0);
 explore.props.setSaved('ui');explore.props.toggleSchoolPathway({id:'ui'});explore.props.goPathway();
 assert.equal(s.signins.length,3);assert.equal(s.writes.length,0);
 explore.props.updateRecord('indonesia-plans','private-plan');assert.equal(s.signins.length,4);assert.equal(s.writes.length,0);
 explore.props.updateRecord('indonesia-university-comparison','["ui","itb"]');assert.equal(s.writes.length,1);assert.equal(s.writes[0][0],5);
 const result=s.writes[0][1]({});assert.equal(result['indonesia-university-comparison'],'["ui","itb"]');
});
test('guest component has no persistence or account storage access',()=>{
 const guest=pieces.slice(pieces.indexOf('function GuestExplore'));
 assert.doesNotMatch(guest,/localStorage|sessionStorage|startAccountSync|fetch\(|getSupabaseClient/);
 assert.match(source,/authReady && !session && guestBrowsing/);
});
test('welcome screen offers guest entry in English and Indonesian',()=>{
 const s=setup();for(const language of ['en','id']){
 const tree=s.context.exports.AccountGate({language,ready:true,openAccount:s.openAccount,explore:()=>s.signins.push('guest')});
 const buttons=[];function collect(n){if(!n)return;if(n.type==='button')buttons.push(n);React.Children.forEach(n.props?.children,collect);}collect(tree);
 assert.equal(buttons.length,2);buttons[0].props.onClick();assert.equal(s.signins.at(-1),'guest');
 assert.ok(React.Children.toArray(buttons[0].props.children).some(x=>x===(language==='id'?'Jelajahi tanpa akun':'Explore without an account')));
 }
});
