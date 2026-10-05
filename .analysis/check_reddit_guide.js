'use strict';
/* 校验 Reddit 版攻略文档里的数字与成就名，全部对照代码。 */
const fs = require('fs');
const H = require('./ending_harness.js');
const { Meta, Eng, W, R } = H;

const FILE = 'docs/结局与成就攻略（Reddit 版）.md';
const doc = fs.readFileSync(FILE, 'utf8');
let bad = 0, good = 0;
const ok = (c, msg) => { if (c) { good++; } else { bad++; console.log('  FAIL ' + msg); } };

console.log('=== 1. 结局与成就计数 ===');
ok(Meta.ENDINGS.length === 10, `结局 10 个（实际 ${Meta.ENDINGS.length}）`);
ok(Meta.ACHIEVEMENTS.length === 19, `成就 19 个（实际 ${Meta.ACHIEVEMENTS.length}）`);
ok(doc.indexOf('10 个结局') >= 0 && doc.indexOf('19 个成就') >= 0, '文档写明 10 个结局 / 19 个成就');

console.log('\n=== 2. 每个结局的中文名与优先级都在文档里 ===');
Meta.ENDINGS.forEach(e => {
  ok(doc.indexOf(e.zh) >= 0, `结局「${e.zh}」出现在文档里`);
  ok(doc.indexOf(String(e.priority)) >= 0, `优先级 ${e.priority}（${e.zh}）出现在文档里`);
});

console.log('\n=== 3. 19 个成就名全部出现在文档里 ===');
Meta.ACHIEVEMENTS.forEach(a => {
  ok(doc.indexOf(a.zh) >= 0, `成就「${a.zh}」出现在文档里`);
});
{
  const m = doc.match(/### 4\.\d [^\n]*（(\d+) 个）/g) || [];
  const sum = m.reduce((n, s) => n + Number(s.match(/（(\d+) 个）/)[1]), 0);
  ok(sum === 19, `成就分组计数合计 19（实际 ${sum}：${m.join(' / ')}）`);
}

console.log('\n=== 4. 关键机制数值 ===');
{
  const s = Eng.createState('1919-09', 'historical', 1);
  ok(s.forze.fascisti === 38, `forze.fascisti 开局 38（实际 ${s.forze.fascisti}）`);
  ok(doc.indexOf('38') >= 0 && doc.indexOf('60') >= 0, '文档写明 38 与 60 阈值');
  s.order.squadre = 60; s.order.subversion = 120; s.order.garrison = 22;
  const tr = Math.round(R.treatyForces(s, 'attacker'));
  const an = Math.round(R.annexationForces(s, 'attacker'));
  ok(tr === 504, `外交线攻方 504（实际 ${tr}）`);
  ok(an === 5840, `政变线攻方 5840（实际 ${an}）`);
  ok(doc.indexOf('504') >= 0 && doc.indexOf('5 840') >= 0, '文档写明 504 与 5 840');
  ok(W.BATTLE.thresholds.margin === 1 && W.BATTLE.thresholds.stalemate === 0.6,
    '文档的三态阈值 1.0 / 0.6 与代码一致');
  ok(W.FORZA_FRONT_NEEDED === 3, `进军需要 3 股力量（实际 ${W.FORZA_FRONT_NEEDED}）`);
}
{
  const j = Meta.JOURNALS.filter(x => x.id === 'marcia_1920')[0];
  const s = Eng.createState('1919-09', 'historical', 1);
  s.order.milizia = 10000; s.forze.forzearmate = 60;
  ['fascisti', 'socialisti', 'anarchici'].forEach(f => { s.forze[f] = 80; });
  ok(j.complete(s) === true, '进军日志：兵力 10000 + 军官团 60 + 三股 80 → 完成');
  s.order.milizia = 9999;
  ok(j.complete(s) === false, '兵力 9999 → 未完成（门槛确为 10000）');
}

console.log('\n=== 5. 卡牌数值 ===');
{
  const base = Eng.createState('1919-09', 'historical', 1);
  const card = Eng.CARD_BY_ID.az_forze_italia;
  const val = id => {
    const o = card.options.filter(x => x.id === id)[0];
    return (typeof o.effect === 'function' ? o.effect(base) : o.effect).forze || {};
  };
  ok(val('socialisti').socialisti === 28, 'az_forze_italia:socialisti = +28');
  ok(val('anarchici').anarchici === 28, 'az_forze_italia:anarchici = +28');
  ok(val('deambris').sindacalisti === 28, 'az_forze_italia:deambris = +28');
  ok(val('corradini').corradini === 26, 'az_forze_italia:corradini = +26');
  ok(val('fascisti').fascisti === 22, 'az_forze_italia:fascisti = +22');
  ok(val('anarchici').forzearmate === -7, 'az_forze_italia:anarchici 扣军官团 7');
  ok(doc.indexOf('+28') >= 0 && doc.indexOf('+26') >= 0 && doc.indexOf('+22') >= 0, '文档写明 +28 / +26 / +22');
  const mal = Eng.EVENT_BY_ID.ev_romafronte_malatesta.options.filter(o => o.id === 'insurrezione')[0];
  ok((typeof mal.effect === 'function' ? mal.effect(base) : mal.effect).forze.anarchici === 34,
    'ev_romafronte_malatesta:insurrezione = anarchici +34');
  const bom = Eng.EVENT_BY_ID.ev_romafronte_bombacci.options.filter(o => o.id === 'legge')[0];
  ok((typeof bom.effect === 'function' ? bom.effect(base) : bom.effect).forze.socialisti === 28,
    'ev_romafronte_bombacci:legge = socialisti +28');
  const mus = Eng.EVENT_BY_ID.ev_romafronte_mussolini.options.filter(o => o.id === 'patto')[0];
  ok((typeof mus.effect === 'function' ? mus.effect(base) : mus.effect).forze.fascisti === 26,
    'ev_romafronte_mussolini:patto = fascisti +26');
}

console.log('\n=== 6. 成就条件的文档断言 ===');
{
  const checks = [
    ['活过圣诞', 'date ≥ 1921-04'],
    ['解除侧翼的武装', 'fascio_disarmed'],
    ['港口回来了', 'traffic ≥ 75'],
    ['不印钞的政府', 'inflation < 12'],
    ['留在佩奇内', 'resistMonths ≥ 18'],
    ['Eia', 'authority ≥ 65'],
    ['一千个空房子', '5 000'],
    ['制度陷阱', 'assembly.LEG ≥ 30'],
    ['劳动的共和国', 'sindacalisti.inf ≥ 60'],
    ['自由未烬', '阜姆或死亡'],
  ];
  checks.forEach(([name, frag]) => {
    const i = doc.indexOf(name);
    ok(i >= 0 && doc.slice(i, i + 260).indexOf(frag) >= 0, `成就「${name}」的条件写明含「${frag}」`);
  });
  ok(doc.indexOf('minViolenceOK') >= 0 && doc.indexOf('minDissentOK') >= 0,
    '文档说明两个全程闸门 minViolenceOK / minDissentOK');
}

console.log('\n=== 7. 武装驱离的配平数字 ===');
{
  const mk = (mil, gar) => {
    const s = Eng.createState('1919-09', 'historical', 1);
    s.order.milizia = mil; s.order.garrison = gar; s.order.coup = 140;
    s.order.tension = R.tension(s);
    return s;
  };
  [[2000, 22, 'defeat'], [6706, 22, 'defeat'], [8000, 22, 'stalemate'],
   [11000, 22, 'stalemate'], [16000, 60, 'victory']]
    .forEach(([m, g, want]) => {
      const r = R.resolveBattle(mk(m, g));
      ok(r.state === want, `兵力 ${m} / 驻军 ${g} → ${want}（实际 ${r.state}，比 ${r.ratio.toFixed(2)}）`);
    });
}

console.log('\n' + (bad === 0 ? `Reddit 版攻略数值与代码全部一致 ✓  (${good} 项)` : bad + ' 项不符 ✗'));
process.exit(bad ? 1 : 0);
