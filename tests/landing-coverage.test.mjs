import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../public/welcome/index.html',import.meta.url),'utf8');
const counter=html.match(/function runCounters\(\)[\s\S]*?(?=\nconst mapObserver)/)[0];
for(const reduced of [false,true])test(`coverage counters have exactly one plus (${reduced?'reduced':'animated'} motion)`,()=>{
 const elements=[20,85,100].map(total=>({dataset:{total:String(total)},textContent:''}));
 const frames=[];
 vm.runInNewContext('let counterRun=0;'+counter+';runCounters();',{document:{querySelectorAll:()=>elements},reduceMotion:reduced,performance:{now:()=>0},requestAnimationFrame:fn=>frames.push(fn)});
 while(frames.length)frames.shift()(2000);
 assert.deepEqual(elements.map(e=>e.textContent),['20+','85+','100+']);
});
