/* 统一卡牌冷却为 3 / 4 / 6 / 9 四档。
   分档依据：.analysis/card_power.js 的实测影响分数（开日志、法律等级、永久收入、
   军械、兵力、现金），再补上分数测不到的维度——派系影响力与 forze（进军线）。
   用 AST 精确定位卡级 cooldown 属性并替换，不动选项内的任何东西。 */
'use strict';
const path = require('path');
const fs = require('fs');
const ts = require(path.join(__dirname, '..', 'node_modules', 'typescript'));

const DIRS = ['action_affairs', 'government_affairs', 'party_affairs']
  .map(d => path.join(__dirname, '..', 'src', 'game', d))
  .filter(d => fs.existsSync(d));

/* 目标冷却 —— 按「影响」分档 */
const CD = {
  /* ── 9：改变局势的引擎。开启日志、印钞、军械、成建制征兵、永久财政。 ── */
  gv_fisco: 9,                 // 唯一永久抬高经常性收入的卡（+12%/+26%）
  az_legione_finanziaria: 9,   // 现金 +820、军械、债券
  az_uscocchi: 9,              // 军械 +45、现金 +520
  az_reclutamento: 9,          // 兵力 +1000，进军线的产能核心
  /* ── 6：重大立法与制度动作 ── */
  gv_portofranco: 6,           // 自由港 +1 且开港口日志
  gv_guardia: 6,               // 公共秩序 +2 且开卫队日志
  gv_cittadinanza: 6,          // 公民法一次 +2
  gv_lingua: 6,                // 语言法 + 学校法
  gv_dogana_yu: 6,             // 关税法 +2
  gv_arengo: 6,                // 宪章 +1 且开宪章日志
  gv_disarco: 6,               // 一次性拆除法西斯武力
  gv_amnistia: 6,              // 大幅改变暴力与事态
  az_fiume_league: 6,          // 国际网络：forze 与外交的多面手
  az_forze_italia: 6,          // 进军线的核心卡
  /* ── 4：中等强度的常规手段 ── */
  gv_bilancio: 4, gv_stampa: 4, gv_nota_roma: 4, gv_lavori: 4,
  az_propaganda: 4, az_arditi: 4, az_cervo_doro: 4, az_fazioni: 4,
  az_intrighi: 4, gv_disoccupazione: 4, gv_nave: 4,
  /* ── 3：轻量、可反复的小手段 ── */
  az_testa: 3                  // 原为 2，抬到本档下限
};

let changed = 0, missing = [];
DIRS.forEach(dir => {
  fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts').forEach(f => {
    const p = path.join(dir, f);
    const src = fs.readFileSync(p, 'utf8');
    const sf = ts.createSourceFile(f, src, ts.ScriptTarget.ES2022, true);
    /* Read ONLY the card's own top-level properties. Walking the whole tree and
       taking the last assignment found the last OPTION's `id` instead of the
       card's, so every lookup missed. */
    const cardObj = (() => {
      let found = null;
      (function walk(node) {
        if (ts.isVariableDeclaration(node) && node.initializer
            && ts.isObjectLiteralExpression(node.initializer)
            && node.initializer.properties.some(pr => ts.isPropertyAssignment(pr)
                 && pr.name.getText(sf) === 'deck')) {
          found = node.initializer;
          return;
        }
        ts.forEachChild(node, walk);
      })(sf);
      return found;
    })();
    if (!cardObj) return;
    const props = {};
    cardObj.properties.forEach(pr => {
      if (ts.isPropertyAssignment(pr)) props[pr.name.getText(sf)] = pr;
    });
    const id = props.id && ts.isStringLiteral(props.id.initializer) ? props.id.initializer.text : null;
    const cdNode = props.cooldown || null;
    if (!id || CD[id] == null) return;
    const want = CD[id];
    if (!cdNode) { missing.push(id); return; }
    if (cdNode.initializer.getText(sf) === String(want)) return;
    const out = src.slice(0, cdNode.initializer.getStart(sf)) + String(want) + src.slice(cdNode.initializer.getEnd());
    const chk = ts.createSourceFile(f, out, ts.ScriptTarget.ES2022, true);
    if ((chk.parseDiagnostics || []).length || out.indexOf('\uFFFD') >= 0) { console.log('  !! ' + f + ' 跳过'); return; }
    fs.writeFileSync(p, out, 'utf8');
    changed++;
    console.log(`  ${id.padEnd(24)} ${cdNode.initializer.getText(sf)} → ${want}`);
  });
});
console.log(`\n调整 ${changed} 张卡的冷却`);
if (missing.length) console.log('!! 未找到卡片: ' + missing.join(', '));
const covered = Object.keys(CD).length;
console.log(`计划覆盖 ${covered} 张`);
