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
function setup(previewTab){
 const writes=[],signins=[];
 const states=[{},'international',null,[],false,{},previewTab,''];let index=0;
 const component=name=>Object.assign(()=>null,{displayName:name});
 const context={window:{scrollTo(){}},require,exports:{},useState:()=>{const i=index++;return [states[i],value=>writes.push([i,value])];},initialExploreBrowseState:{},Discovery:component('Discovery'),LandingWelcome:component('LandingWelcome'),Explore:component('Explore'),SchoolDetail:component('SchoolDetail'),ComparePanel:component('ComparePanel'),PublicUniversityLogo:component('Logo'),Search:component('Search'),CircleUserRound:component('User'),ShieldCheck:component('Shield'),LockKeyhole:component('Lock'),Scale:component('Scale')};
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
test('welcome gate opens the approved landing with real sign in and guest actions',()=>{
 const s=setup(),tree=s.context.exports.AccountGate({language:'en',ready:true,openAccount:s.openAccount,explore:()=>s.signins.push('guest')});
 assert.equal(tree.type.displayName,'LandingWelcome');tree.props.openAccount();tree.props.explore();assert.deepEqual(s.signins,[true,'guest']);
 const loading=s.context.exports.AccountGate({language:'en',ready:false,openAccount:s.openAccount,explore(){}});assert.equal(loading.type,'main');
});

test('private discovery preview uses the existing guest catalogue without leaving its shell',()=>{
 const s=setup('explorer');
 const tree=s.context.exports.GuestExplore({language:'en',openAccount:s.openAccount,initialDiscovery:'explorer'});
 const discovery=find(tree,'Discovery');assert.ok(discovery);assert.equal(discovery.props.mode,'explorer');
 assert.equal(find(tree,'Explore'),undefined);
 discovery.props.onExplore('Biology');
 assert.ok(s.writes.some(([i,value])=>i===7&&value==='Biology'));
 assert.ok(s.writes.some(([i,value])=>i===6&&value==='universities'));
 assert.equal(s.signins.length,0);
 const catalogue=setup('universities');
 const universityTree=catalogue.context.exports.GuestExplore({language:'en',openAccount:catalogue.openAccount,initialDiscovery:'explorer'});
 assert.ok(find(universityTree,'Explore'));assert.equal(find(universityTree,'Discovery'),undefined);
});
