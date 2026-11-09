import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {createRequire} from 'node:module';
const file=new URL('../app/account-sync-notice.tsx',import.meta.url),require=createRequire(file),module={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports:module.exports,require});
const render=status=>renderToStaticMarkup(React.createElement(module.exports.default,{status}));
test('routine account saving does not add a status label or layout space',()=>{for(const status of ['', 'Saved to account','Saving to account…'])assert.equal(render(status),'');});
test('sync warnings and loading failures stay visible to assistive technology',()=>{for(const status of ['Sync paused · your changes are kept on this device','Account sync could not load. Your device data is preserved. Please retry.']){const html=render(status);assert.match(html,/role="status"/);assert.ok(html.includes(status));}});
