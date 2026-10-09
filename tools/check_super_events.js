/* Prove that acknowledging a super event does not resolve or alter game events. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  module._compile(compiled.outputText, filename);
};
const storage = new Map();
global.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
const { createGameStore } = require('../src/game/GameContext.tsx');
const { SUPER_EVENTS, syncSuperEvents, currentSuperEvent, acknowledgeSuperEvent } = require('../src/game/superEvents.ts');
const { Engine, Sel } = global.Fiume;
const gameOnly = state => { const copy = structuredClone(state); delete copy.superEvents; return copy; };
const clone = state => structuredClone(state);
function deepFreeze(value) {
  Object.freeze(value);
  for (const nested of Object.values(value)) if (nested && typeof nested === 'object' && !Object.isFrozen(nested)) deepFreeze(nested);
  return value;
}

assert.equal(SUPER_EVENTS.length, 2);
for (const event of SUPER_EVENTS) {
  assert(Engine.EVENT_BY_ID[event.triggerEvent], 'Triggers reference existing events');
  assert(!Engine.EVENT_BY_ID[event.id], 'Presentation entries never join the ordinary registry');
  assert(event.option.zh && event.option.it);
  assert(fs.existsSync(path.join(__dirname, '..', 'public', event.image)));
}
const store = createGameStore();
store.actions.start();
const opening = store.getSnapshot().state;
assert.equal(currentSuperEvent(opening).id, 'super_marcia_fiume');
assert.equal(opening.currentEvent, 'ev_1919_09_marcia');
assert.equal(Engine.EVENT_BY_ID[opening.currentEvent].options.length, 4);
store.actions.acknowledgeSuperEvent();
const closed = store.getSnapshot().state;
assert.deepEqual(gameOnly(closed), gameOnly(opening), 'Acknowledgement preserves every gameplay field, including RNG and history');
assert.equal(currentSuperEvent(closed), null);
assert.equal(currentSuperEvent(syncSuperEvents(Sel.Save.load('auto'))), null, 'Closed frame stays closed on reload');
store.actions.resolveEvent('b');
assert(store.getSnapshot().state.eventHistory.includes('ev_1919_09_marcia'), 'The existing choice still resolves the original event');

const attack = { ...Engine.createState('1919-09', 'historical', 42), currentEvent: 'ev_natale', date: { y: 1920, m: 12, d: 24 } };
const attackBefore = clone(attack);
deepFreeze(attack);
const displayed = syncSuperEvents(attack);
assert.deepEqual(attack, attackBefore, 'Sync never mutates the input');
assert.equal(currentSuperEvent(displayed).id, 'super_italian_attack');
assert.equal(Engine.EVENT_BY_ID[displayed.currentEvent].options.length, 3, 'Ordinary attack choices are intact');
const attackClosed = acknowledgeSuperEvent(deepFreeze(displayed));
assert.deepEqual(gameOnly(attackClosed), attackBefore);
assert.equal(currentSuperEvent(syncSuperEvents(attackClosed)), null, 'A repeated ordinary trigger does not replay the frame');
Sel.Save.save(displayed, 0);
assert.equal(currentSuperEvent(syncSuperEvents(Sel.Save.load(0))).id, 'super_italian_attack', 'Pending frame survives save/load');
store.actions.loadFrom(0);
assert.equal(currentSuperEvent(store.getSnapshot().state).id, 'super_italian_attack', 'Store load activates the pending frame');
store.actions.acknowledgeSuperEvent();
assert.equal(store.getSnapshot().state.currentEvent, 'ev_natale');
store.actions.resolveEvent('trattare');
assert.equal(store.getSnapshot().state.currentEvent, 'ev_natale_deal', 'Original event chain still advances');
assert.equal(currentSuperEvent(store.getSnapshot().state), null);
assert.equal(currentSuperEvent(syncSuperEvents({ ...clone(attack), currentEvent: null, eventHistory: ['ev_1919_09_marcia', 'ev_natale'] })), null, 'Old saves do not replay completed history');
assert.equal(currentSuperEvent(syncSuperEvents({ ...clone(attack), ending: 'ending_eviction' })), null, 'Endings do not open a stale frame');

// Run the same historical timeline with and without presentation metadata.
// Every ordinary dispatch must produce exactly the same game state.
let baseline = Engine.createState('1919-09', 'historical', 4242);
let decorated = syncSuperEvents(clone(baseline));
const seen = new Set();
for (let step = 0; step < 160 && !baseline.ending; step++) {
  const presentation = currentSuperEvent(decorated);
  if (presentation) { seen.add(presentation.id); decorated = acknowledgeSuperEvent(decorated); }
  let action;
  if (baseline.currentEvent) {
    const event = Engine.EVENT_BY_ID[baseline.currentEvent];
    const option = event.options.find(o => !o.condition || o.condition(baseline));
    assert(option, 'Timeline always has a valid ordinary choice');
    action = { type: 'RESOLVE_EVENT', optionId: option.id };
  } else action = { type: 'ADVANCE' };
  baseline = Engine.dispatch(baseline, action).state;
  decorated = syncSuperEvents(Engine.dispatch(decorated, action).state);
  assert.deepEqual(gameOnly(decorated), baseline, `Presentation changed gameplay at step ${step}`);
}
assert(baseline.ending, 'Historical timeline completed');
assert.deepEqual([...seen].sort(), ['super_italian_attack', 'super_marcia_fiume']);
console.log('Super-event checks passed: two presentations, save/load, unchanged choices, chains and historical timeline.');
