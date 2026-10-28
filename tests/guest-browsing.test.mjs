import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {configureWorkspace,planningStorage,GUEST_PREFIX} from '../app/workspace-storage.ts';
import {readPlanning} from '../app/account-sync.ts';
import {importPrototypeExport,createPrototypeExport} from '../app/prototype-data.ts';

test('guest planning survives reopening without reading, changing or syncing account data',async()=>{
 const original=globalThis.window,values=new Map([['myway-active-user-id','owner'],['myway-profile','{"name":"Private owner"}'],['myway-saved','["owner-school"]']]);
 globalThis.window={localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
 try {
 configureWorkspace('guest');assert.equal(planningStorage().getItem('myway-profile'),null);
 planningStorage().setItem('myway-profile','{"name":"Guest"}');planningStorage().setItem('myway-saved','["hec"]');
 configureWorkspace('account');assert.equal(planningStorage().getItem('myway-profile'),'{"name":"Private owner"}');
 const sync=readPlanning(window.localStorage);assert.equal(sync['myway-saved'],'["owner-school"]');assert.ok(!Object.keys(sync).some(k=>k.startsWith(GUEST_PREFIX)));
 configureWorkspace('guest');assert.equal(planningStorage().getItem('myway-profile'),'{"name":"Guest"}');
 const backup=await createPrototypeExport();assert.equal(backup.data['myway-saved'],'["hec"]');assert.equal(backup.data['myway-active-user-id'],undefined);
 importPrototypeExport({product:'MyWay',formatVersion:1,data:{'myway-saved':'["ui"]'}});
 assert.equal(values.get('myway-saved'),'["owner-school"]');assert.equal(planningStorage().getItem('myway-saved'),'["ui"]');
 planningStorage().removeItem('myway-profile');assert.equal(values.get('myway-profile'),'{"name":"Private owner"}');
 assert.equal(values.get('myway-active-user-id'),'owner');
 }finally{configureWorkspace('account');globalThis.window=original;}
});
test('guest rendering waits for isolated hydration and hides admin',()=>{
 const s=fs.readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
 assert.match(s,/session \? !accountDisplayReady : !guestHydrated/);
 assert.match(s,/adminVisible=\{!!session && adminVisible\}/);
 assert.match(s,/workspaceUser !== undefined && workspaceUser !== nextUser/);
 assert.doesNotMatch(s,/function GuestExplore/);
});
test('guest storage reports quota failures without falling back to account keys',()=>{
 const original=globalThis.window,events=[];
 try {
 configureWorkspace('guest');globalThis.window={localStorage:{getItem:()=>null,setItem:()=>{throw new Error('quota')},removeItem:()=>{}},dispatchEvent:e=>events.push(e.type)};
 assert.throws(()=>planningStorage().setItem('myway-profile','{}'),/quota/);
 assert.deepEqual(events,['myway-guest-storage-error']);
 }finally{configureWorkspace('account');globalThis.window=original;}
});
