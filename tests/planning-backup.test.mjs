import assert from "node:assert/strict";
import test from "node:test";
import { createPrototypeExport, importPrototypeExport } from "../app/prototype-data.ts";

test("planning backup restores choices and progress without changing account identity", async () => {
  const original = globalThis.window, values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  try {
    globalThis.window = { localStorage: storage };
    storage.setItem("myway-active-user-id", "account-a");
    storage.setItem("myway-pathway-selection", '[{"id":"escp","role":"Dream"}]');
    storage.setItem("myway-pathway-actions", '["transcript"]');
    const backup = await createPrototypeExport();
    assert.equal(backup.data["myway-active-user-id"], undefined);
    assert.ok(backup.exclusions.some(value => /file contents are excluded/i.test(value)));
    storage.setItem("myway-pathway-selection", "[]");
    storage.setItem("myway-pathway-actions", "[]");
    importPrototypeExport(backup);
    assert.equal(storage.getItem("myway-pathway-selection"), '[{"id":"escp","role":"Dream"}]');
    assert.equal(storage.getItem("myway-pathway-actions"), '["transcript"]');
    assert.equal(storage.getItem("myway-active-user-id"), "account-a");
  } finally { globalThis.window = original; }
});

test("backup import rejects unsupported formats and ignores account identifiers", () => {
  const original = globalThis.window, values = new Map([["myway-active-user-id", "account-a"]]);
  try {
    globalThis.window = { localStorage: { setItem: (key, value) => values.set(key, value) } };
    assert.throws(() => importPrototypeExport({ product: "Other", formatVersion: 1, data: { "myway-saved": "[]" } }), /Unsupported/);
    assert.equal(values.has("myway-saved"), false);
    importPrototypeExport({ product: "MyWay", formatVersion: 1, data: { "myway-active-user-id": "account-b", "myway-saved": '["escp"]' } });
    assert.equal(values.get("myway-active-user-id"), "account-a");
    assert.equal(values.get("myway-saved"), '["escp"]');
  } finally { globalThis.window = original; }
});

test("malformed backup is rejected before any planning values change", () => {
  const original = globalThis.window, values = new Map([["myway-saved", '["original"]']]);
  try {
    globalThis.window = { localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } };
    for (const data of [[], { "myway-saved": '["replacement"]', "myway-profile": '{broken' }, { "myway-saved": '{}' }, { "myway-pathway-selection": '[{"id":"a","role":"Admin"}]' }, {}]) {
      assert.throws(() => importPrototypeExport({ product: "MyWay", formatVersion: 1, data }));
      assert.equal(values.get("myway-saved"), '["original"]');
    }
  } finally { globalThis.window = original; }
});

test("storage failure rolls back earlier successful backup writes", () => {
  const original = globalThis.window, values = new Map([["myway-saved", '["original"]']]);
  try {
    globalThis.window = { localStorage: {
      getItem: key => values.get(key) ?? null,
      removeItem: key => values.delete(key),
      setItem: (key, value) => { if (key === "myway-profile") throw new Error("Quota exceeded"); values.set(key, value); },
    } };
    assert.throws(() => importPrototypeExport({ product: "MyWay", formatVersion: 1, data: { "myway-saved": '["replacement"]', "myway-profile": '{}' } }), /device storage/);
    assert.equal(values.get("myway-saved"), '["original"]');
    assert.equal(values.has("myway-profile"), false);
  } finally { globalThis.window = original; }
});
