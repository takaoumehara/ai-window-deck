import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { migrateStore, applyStorePatch, STORE_VERSION } = createRequire(import.meta.url)("../electron/store.cjs");

test("a version 1 store becomes one set that keeps its windows and layout", () => {
  const v1 = {
    version: 1,
    windows: [{ id: "w1", name: "Claude", urls: "https://claude.ai", visible: true }],
    settings: { mode: "spotlight", focusedId: "w1", sidebarOpen: false, activeTabs: { w1: 0 }, lang: "en" },
  };
  const store = migrateStore(v1);
  assert.equal(store.version, STORE_VERSION);
  assert.deepEqual(store.sets, [{ id: "set-main", name: "", windows: v1.windows, mode: "spotlight", focusedId: "w1", activeTabs: { w1: 0 } }]);
  assert.deepEqual(store.settings, { sidebarOpen: false, lang: "en" });
});

test("a missing or empty store starts with no sets", () => {
  assert.deepEqual(migrateStore(null), { version: STORE_VERSION, sets: [], settings: {} });
  assert.deepEqual(migrateStore({ settings: { lang: "ja" } }).sets, []);
});

test("a version 2 store is kept, with missing fields filled in", () => {
  const store = migrateStore({ version: 2, sets: [{ id: "a", name: "A", windows: [] }, null], settings: { lang: "ko" } });
  assert.deepEqual(store.sets, [{ id: "a", name: "A", windows: [], mode: "grid", focusedId: null, activeTabs: {} }]);
  assert.equal(store.settings.lang, "ko");
});

test("patches upsert in place, remove, reorder and merge settings", () => {
  let store = migrateStore({ version: 2, sets: [{ id: "a" }, { id: "b" }], settings: { lang: "ja" } });
  store = applyStorePatch(store, { put: [{ id: "a", name: "Renamed" }, { id: "c", name: "New" }] });
  assert.deepEqual(store.sets.map((s) => [s.id, s.name]), [["a", "Renamed"], ["b", ""], ["c", "New"]]);
  store = applyStorePatch(store, { remove: ["b"], order: ["c", "a"], settings: { sidebarOpen: false } });
  assert.deepEqual(store.sets.map((s) => s.id), ["c", "a"]);
  assert.deepEqual(store.settings, { lang: "ja", sidebarOpen: false });
});

test("a set's arrangement survives a save; junk layouts are dropped", () => {
  const store = { version: STORE_VERSION, sets: [], settings: {} };
  const layout = { shape: "hero-left", sizes: { key: "cols:1,2", tracks: [0.6, 0.4], items: [[1], [0.5, 0.5]] } };
  const saved = applyStorePatch(store, { put: [{ id: "s1", name: "A", windows: [], layout }, { id: "s2", windows: [], layout: [1] }] });
  assert.deepEqual(saved.sets[0].layout, layout);
  assert.equal("layout" in saved.sets[1], false);
});
