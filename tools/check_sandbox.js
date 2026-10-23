'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
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
const { Engine: E, World: W, Core, Sel } = global.Fiume;
const edit = (state, path, value) => E.dispatch(state, { type: 'SANDBOX_EDIT', path, value }).state;
const initial = E.createState('1919-09', 'sandbox', 2121);
const before = JSON.stringify(initial);
let s = edit(initial, 'funds', 987654);
assert.equal(s.funds, 987654);
assert.equal(JSON.stringify(initial), before, 'Edits never mutate the input state');
assert.equal(s.currentEvent, initial.currentEvent, 'Edits preserve pending decisions');
assert.deepEqual(s.date, initial.date);
assert.equal(s.turn, initial.turn);
assert.equal(s.rngTick, initial.rngTick, 'Editing does not consume randomness');
assert.equal(edit(s, 'funds', -1).funds, 0);
assert.equal(edit(s, 'ap', 2.6).ap, 3, 'AP edits are integers');
assert.equal(edit(s, 'order.coup', 140).order.coup, 100);
assert.equal(edit(s, 'forze.forzearmate', -100).forze.forzearmate, -40);
assert.equal(edit(s, 'laws.stampa', 99).laws.stampa, W.LAWS.find(l => l.id === 'stampa').max);
for (const [path, value] of [['funds', NaN], ['funds', Infinity], ['funds', '100'], ['difficulty', 1],
  ['flags.charter_promulgated', 1], ['__proto__.polluted', 1], ['legitimacy', 100], ['order.tension', 100]]) {
  assert.equal(edit(s, path, value), s, 'Invalid or derived fields are rejected: ' + path);
}
assert.equal({}.polluted, undefined);
for (const difficulty of ['open', 'historical']) {
  const ordinary = E.createState('1919-09', difficulty, 5);
  for (const action of [{ type: 'SANDBOX_EDIT', path: 'funds', value: 9999 },
    { type: 'SANDBOX_CLEAR_COOLDOWNS' }, { type: 'SANDBOX_ADD_CARD', cardId: E.ALL_CARDS[0].id },
    { type: 'SANDBOX_EVENT', eventId: E.sandboxEvents()[0].id }]) {
    assert.equal(E.dispatch(ordinary, action).state, ordinary, 'Cheats cannot change ordinary games');
  }
}
const faction = W.FACTIONS[0].id;
s = edit(s, 'factions.' + faction + '.inf', 100);
assert(Math.abs(s.factions[faction].inf - 100) < 1e-8);
s = edit(s, 'factions.' + faction + '.inf', 37);
assert(Math.abs(s.factions[faction].inf - 37) < 1e-8);
assert(Math.abs(Core.sum(Object.fromEntries(W.FACTIONS.map(f => [f.id, s.factions[f.id].inf]))) - 100) < 1e-8);
const cls = W.CLASSES[0].id;
s = edit(s, 'classes.' + cls + '.support.LEG', 100);
s = edit(s, 'classes.' + cls + '.support.LEG', 37);
assert(Math.abs(s.classes[cls].support.LEG - 37) < 1e-8, 'Can leave a 100% support monopoly');
assert(Math.abs(Core.sum(s.classes[cls].support) - 100) < 1e-8);
for (const c of W.CLASSES) s = edit(s, 'classes.' + c.id + '.support.LEG', 100);
assert(Math.abs(s.legitimacy - 100) < 1e-8, 'Public opinion is recalculated from social support');
assert.deepEqual(s.achievements, [], 'Sandbox edits never grant achievements');
assert(!E.sandboxFields(s).some(x => x.path === 'forze.comunisti'), 'Unfounded communist party stays hidden');
const historicalCooldown = s.monthIndex + 20;
s.eventCooldowns.ev_strike = historicalCooldown;
s.eventCooldowns['c_' + E.ALL_CARDS[0].id] = historicalCooldown;
s.advisors.lastAction = s.monthIndex;
s = E.dispatch(s, { type: 'SANDBOX_CLEAR_COOLDOWNS' }).state;
assert.equal(s.eventCooldowns.ev_strike, historicalCooldown, 'Only card cooldowns are reset');
assert.equal(s.eventCooldowns['c_' + E.ALL_CARDS[0].id], undefined);
assert.equal(E.advisorCooldown(s), 0);
const card = E.ALL_CARDS.find(c => !s.hand.includes(c.id));
s = E.dispatch(s, { type: 'SANDBOX_ADD_CARD', cardId: card.id }).state;
assert(s.hand.includes(card.id));
assert.equal(E.dispatch(s, { type: 'SANDBOX_ADD_CARD', cardId: card.id }).state, s, 'No duplicate cheat cards');
const full = { ...s, handLimit: s.hand.length };
assert.equal(E.dispatch(full, { type: 'SANDBOX_ADD_CARD', cardId: E.ALL_CARDS.find(c => !s.hand.includes(c.id)).id }).state, full);
assert.equal(edit(full, 'handLimit', 0).handLimit, full.hand.length, 'Reducing slots preserves existing cards');

const event = E.sandboxEvents().find(e => e.id !== initial.currentEvent && e.id === 'ev_strike');
assert(event);
let queued = E.dispatch(initial, { type: 'SANDBOX_EVENT', eventId: event.id }).state;
assert.equal(queued.currentEvent, initial.currentEvent);
assert(queued.eventQueue.includes(event.id), 'Manual events queue behind a pending decision');
assert.equal(E.dispatch(queued, { type: 'SANDBOX_EVENT', eventId: event.id }).state, queued);
const chain = E.ALL_EVENTS.find(e => e.chain);
assert.equal(E.dispatch(initial, { type: 'SANDBOX_EVENT', eventId: chain.id }).state, initial, 'Cannot jump into a chain node');
const active = { ...initial, currentEvent: null, phase: 'action', eventQueue: [] };
const forced = E.dispatch(active, { type: 'SANDBOX_EVENT', eventId: event.id }).state;
assert.equal(forced.currentEvent, event.id, 'Manual triggering bypasses scheduling conditions');
assert.equal(forced.phase, 'event');
const pending = { ...active, pendingCard: card.id };
assert.equal(E.dispatch(pending, { type: 'SANDBOX_EVENT', eventId: event.id }).state.pendingCard, card.id);
const ended = { ...initial, ending: 'ending_timer' };
assert.equal(edit(ended, 'funds', 99999), ended, 'Finished games stay finished');

const store = createGameStore();
store.actions.setDifficulty('sandbox');
store.actions.start();
store.actions.acknowledgeSuperEvent();
store.actions.openSandbox();
assert.equal(store.getSnapshot().ui.modal, 'sandbox');
const tick = store.getSnapshot().state.rngTick;
store.actions.sandboxEdit('funds', 876543);
assert.equal(store.getSnapshot().ui.modal, 'sandbox', 'Editing keeps the menu open');
assert.equal(Sel.Save.load('auto').funds, 876543, 'Cheats are automatically saved');
assert.equal(store.getSnapshot().state.rngTick, tick);
store.actions.closeSandbox();
assert.equal(store.getSnapshot().ui.modal, 'event', 'Closing returns to the unresolved decision');
store.actions.resolveEvent('d');
store.actions.sandboxEdit('funds', 1000000);
store.actions.sandboxAddCard('az_propaganda');
store.actions.playCard('az_propaganda');
assert.equal(store.getSnapshot().state.pendingCard, 'az_propaganda');
store.actions.openSandbox();
store.actions.closeSandbox();
assert.equal(store.getSnapshot().ui.modal, 'card', 'Closing also restores an unresolved card menu');
store.actions.restart();
store.actions.setDifficulty('open');
store.actions.start();
const ordinaryState = store.getSnapshot().state;
store.actions.openSandbox();
assert.notEqual(store.getSnapshot().ui.modal, 'sandbox');
store.actions.sandboxEdit('funds', 99999);
assert.equal(store.getSnapshot().state.funds, ordinaryState.funds);
console.log('Sandbox: permissions, bounds, conservation, RNG, cards, event queue and autosave passed.');
