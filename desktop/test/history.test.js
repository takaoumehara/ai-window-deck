import test from "node:test";
import assert from "node:assert/strict";
import { EMPTY_HISTORY, applyPatch, diffSets, record, redo, storePatchBetween, undo } from "../src/lib/history.js";

const win = (id, extra = {}) => ({ id, name: id, urls: `https://${id}.test`, visible: true, ...extra });
const set = (id, windows, extra = {}) => ({ id, name: id, windows, mode: "grid", focusedId: null, activeTabs: {}, ...extra });

test("layout-only changes and identical states leave no history entry", () => {
  const a = [set("s1", [win("a")])];
  assert.equal(diffSets(a, a), null);
  assert.equal(diffSets(a, [{ ...a[0], mode: "fill", focusedId: "a", activeTabs: { a: 1 } }]), null);
  assert.equal(record(EMPTY_HISTORY, null), EMPTY_HISTORY);
});

test("undo and redo walk an unbounded chain of edits", () => {
  let sets = [set("s1", [])];
  let history = EMPTY_HISTORY;
  const states = [sets];
  for (let n = 0; n < 150; n += 1) {
    const next = [{ ...sets[0], windows: [...sets[0].windows, win(`w${n}`)] }];
    history = record(history, diffSets(sets, next));
    sets = next;
    states.push(sets);
  }
  assert.equal(history.past.length, 150);
  for (let n = 149; n >= 0; n -= 1) {
    ({ history, sets } = undo(history, sets));
    assert.deepEqual(sets, states[n]);
  }
  assert.equal(undo(history, sets), null);
  for (let n = 1; n <= 150; n += 1) {
    ({ history, sets } = redo(history, sets));
    assert.deepEqual(sets, states[n]);
  }
  assert.equal(redo(history, sets), null);
});

test("a new edit after undo drops the redo branch", () => {
  const a = [set("s1", [win("a")])];
  const b = [set("s1", [win("a"), win("b")])];
  let history = record(EMPTY_HISTORY, diffSets(a, b));
  const undone = undo(history, b);
  history = record(undone.history, diffSets(undone.sets, [set("s1", [win("c")])]));
  assert.equal(history.future.length, 0);
  assert.equal(history.past.length, 1);
});

test("undo restores content but keeps the set's current layout", () => {
  const before = [set("s1", [win("a"), win("b")])];
  const after = [set("s1", [win("a")])];
  const history = record(EMPTY_HISTORY, diffSets(before, after));
  const moved = [{ ...after[0], mode: "spotlight", focusedId: "a" }];
  const { sets } = undo(history, moved);
  assert.deepEqual(sets[0].windows.map((w) => w.id), ["a", "b"]);
  assert.equal(sets[0].mode, "spotlight");
});

test("undo leaves sets it did not touch alone, even if they changed since", () => {
  const start = [set("s1", [win("a")]), set("s2", [win("x")])];
  const edited = [set("s1", []), start[1]];
  const history = record(EMPTY_HISTORY, diffSets(start, edited));
  const elsewhere = [edited[0], set("s2", [win("x"), win("y")])];
  const { sets } = undo(history, elsewhere);
  assert.deepEqual(sets.map((s) => s.windows.map((w) => w.id)), [["a"], ["x", "y"]]);
});

test("creating, deleting, renaming and reordering sets are undoable", () => {
  const one = [set("s1", [win("a")])];
  const two = [...one, set("s2", [win("b")], { mode: "fill" })];
  const renamed = [two[0], { ...two[1], name: "Work" }];
  const reordered = [renamed[1], renamed[0]];
  const deleted = [renamed[1]];
  let history = EMPTY_HISTORY;
  let current = one;
  for (const next of [two, renamed, reordered, deleted]) {
    history = record(history, diffSets(current, next));
    current = next;
  }
  const steps = [reordered, renamed, two, one];
  for (const expected of steps) {
    ({ history, sets: current } = undo(history, current));
    assert.deepEqual(current, expected);
  }
});

test("a set open in another window is never removed by undo", () => {
  const one = [set("s1", [])];
  const two = [...one, set("s2", [])];
  const history = record(EMPTY_HISTORY, diffSets(one, two));
  assert.deepEqual(undo(history, two, new Set(["s2"])).sets.map((s) => s.id), ["s1", "s2"]);
  assert.deepEqual(applyPatch(two, history.past[0], "before").map((s) => s.id), ["s1"]);
});

test("store patches carry only what changed, layout included", () => {
  const a = set("a", [win("x")]);
  const b = set("b", []);
  assert.equal(storePatchBetween([a, b], [a, b]), null);
  assert.deepEqual(storePatchBetween([a, b], [{ ...a, mode: "fill" }, b]), { put: [{ ...a, mode: "fill" }], remove: [] });
  const c = set("c", []);
  assert.deepEqual(storePatchBetween([a, b], [b, c]), { put: [c], remove: ["a"], order: ["b", "c"] });
  assert.deepEqual(storePatchBetween([a, b], [a, c, b]).order, ["a", "c", "b"]);
  assert.deepEqual(storePatchBetween([a, b], [b]), { put: [], remove: ["a"] });
  assert.deepEqual(storePatchBetween([a, b], [b, a]), { put: [], remove: [], order: ["b", "a"] });
});
