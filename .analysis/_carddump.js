'use strict';
const H = require('./ending_harness.js');
const { Eng, W, R, S } = H;
const Meta = H.Meta;

const s0 = Eng.createState('1919-09', 'historical', 1);
const cards = Object.keys(Eng.CARD_BY_ID).map(k => Eng.CARD_BY_ID[k]);
console.log('卡片总数:', cards.length);
const byDeck = {};
cards.forEach(c => { (byDeck[c.deck] = byDeck[c.deck] || []).push(c); });
Object.keys(byDeck).forEach(d => console.log('  deck', d, '=', byDeck[d].length));

function lit(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'function') { try { return lit(v(s0)); } catch (e) { return '«fn»'; } }
  if (Array.isArray(v)) return '[' + v.map(lit).join(', ') + ']';
  if (typeof v === 'object') return '{' + Object.keys(v).map(k => k + ':' + lit(v[k])).join(', ') + '}';
  return String(v);
}

for (const deck of Object.keys(byDeck)) {
  console.log(`\n\n################  牌堆 ${deck}  ################`);
  for (const c of byDeck[deck]) {
    console.log(`\n--- ${c.id}  «${c.name && c.name.zh}»  deck=${c.deck}${c.ministry ? ' ministry=' + c.ministry : ''} cost=${lit(c.cost)} cooldown=${lit(c.cooldown)}`);
    if (c.requireText) console.log(`    requireText: ${lit(c.requireText)}`);
    if (c.forces) console.log(`    forces: ${lit(c.forces)}`);
    (c.options || []).forEach((o, i) => {
      console.log(`    [${i}] ${o.id}  «${lit(o.text)}»`);
      if (o.subtitle) console.log(`         sub: ${lit(o.subtitle)}`);
      if (o.requireText) console.log(`         requireText: ${lit(o.requireText)}`);
      let eff;
      try { eff = typeof o.effect === 'function' ? o.effect(s0) : o.effect; } catch (e) { eff = '«error ' + e.message + '»'; }
      console.log(`         effect: ${lit(eff)}`);
    });
  }
}
