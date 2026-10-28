import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('MyWay mark is a high resolution PNG with transparency',()=>{
 const png=fs.readFileSync(new URL('../public/myway-mark.png',import.meta.url));assert.equal(png.toString('ascii',1,4),'PNG');assert.ok(png.readUInt32BE(16)>=1500);assert.ok(png.readUInt32BE(20)>=700);assert.equal(png[25],6);
});
test('landing uses the updated mark and separates the footer tagline with responsive layout',()=>{
 const html=fs.readFileSync(new URL('../public/welcome/index.html',import.meta.url),'utf8');assert.doesNotMatch(html,/>myway<span>✱<\/span>/);assert.match(html,/hero \.eyebrow\{background:#e8eeff/);assert.match(html,/footer\{display:grid;grid-template-columns:max-content/);assert.match(html,/product-brand-overlay/);assert.match(html,/myway-mark\.png\?v=brand-20261028/);
 for(const file of ['page.tsx','auth-modal.tsx','layout.tsx','admin/data/university-data-review.tsx','admin/feedback/feedback-inbox.tsx'])assert.match(fs.readFileSync(new URL('../app/'+file,import.meta.url),'utf8'),/myway-mark\.png\?v=brand-20261028/);
});
