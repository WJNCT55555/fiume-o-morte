/* 统一 preview 标签术语：缩写 → 完整术语（以 src/lib/i18n.js 为准）。
   只改 preview 数组内的字符串，不动其它文本。
   两个陷阱已处理：
   1. 「法西斯暴力」本身已是完整术语，必须在替换「暴力」之前先保护起来，否则会被改成
      「法西斯政治暴力」。
   2. 脚本必须可重复运行（幂等）：「领袖权威」→「摄政权威」之后，第二轮不能再被
      「摄政领袖权威」的规则二次替换。做法是按「先长后短」排序，且每条规则用负向断言
      排除已经是完整术语的情况。 */
'use strict';
const path = require('path');
const fs = require('fs');
const ts = require(path.join(__dirname, '..', 'node_modules', 'typescript'));

const DIRS = ['action_affairs', 'government_affairs', 'party_affairs']
  .map(d => path.join(__dirname, '..', 'src', 'game', d))
  .filter(d => fs.existsSync(d));

/* 替换规则：按 from 长度降序应用。sentinel 用于保护例外。 */
const SENTINEL = '\u0001';
const RULES = [
  /* 保护：法西斯暴力是完整术语（i18n cri.squadre），不能拆 */
  ['法西斯暴力', SENTINEL + 'SQ' + SENTINEL],
  /* 派系 */
  ['民族派', '法西斯派'],
  ['法西斯异议', '法西斯派异议'],
  ['工团派异议', '工团派异议'],            // 已是完整
  /* 政党（display 名） */
  ['克罗地亚党', '人民委员会'],
  ['民族主义协会', '意大利国民委员会'],
  /* 状态：缩写 → i18n 权威术语 */
  ['合法性', '军团民意'],                  // cmd.legittimita
  ['领袖权威', '摄政领袖权威'],            // cri.authority
  ['热度', '民众热忱'],                    // cri.fervour
  ['失业', '失业率'],                      // cri.unemp
  ['通胀', '通胀率'],
  ['暴力', '政治暴力'],                    // cri.violence（法西斯暴力已保护）
  ['吞吐', '港口吞吐指数'],                // eco.traffic
  ['商业派', '有产精英'],
  ['事态', '事态累积'],                    // cri.coup 的完整写法
  ['军械', '军械'],
  /* 恢复保护项 */
  [SENTINEL + 'SQ' + SENTINEL, '法西斯暴力']
];

/* 幂等：如果一段文本已含更长形式，不要把它再拆短。
   具体地，「摄政领袖权威」含「领袖权威」，第二轮必须跳过。 */
const GUARD = [
  { from: '领袖权威', skipIfContains: '摄政领袖权威' },
  { from: '暴力', skipIfContains: '政治暴力' },
  { from: '吞吐', skipIfContains: '港口吞吐指数' },
  { from: '事态', skipIfContains: '事态累积' },
  { from: '失业', skipIfContains: '失业率' },
  { from: '通胀', skipIfContains: '通胀率' }
];

function convert(label) {
  let s = label;
  /* 1. 保护 */
  s = s.split('法西斯暴力').join(SENTINEL + 'SQ' + SENTINEL);
  /* 2. 按规则替换，带守卫 */
  for (const [from, to] of RULES) {
    if (from.indexOf(SENTINEL) >= 0) continue;
    const g = GUARD.find(x => x.from === from);
    if (g && s.indexOf(g.skipIfContains) >= 0) continue;
    s = s.split(from).join(to);
  }
  /* 3. 恢复 */
  s = s.split(SENTINEL + 'SQ' + SENTINEL).join('法西斯暴力');
  return s;
}

/* 统计 */
let filesChanged = 0, labelsChanged = 0;
const report = new Map();

DIRS.forEach(dir => {
  fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts').forEach(f => {
    const p = path.join(dir, f);
    const src = fs.readFileSync(p, 'utf8');
    const sf = ts.createSourceFile(f, src, ts.ScriptTarget.ES2022, true);
    const edits = [];
    (function walk(node) {
      if (ts.isPropertyAssignment(node) && node.name && node.name.getText(sf) === 'preview'
          && ts.isArrayLiteralExpression(node.initializer)) {
        node.initializer.elements.forEach(el => {
          if (!ts.isStringLiteral(el)) return;
          const oldVal = el.text;
          const newVal = convert(oldVal);
          if (newVal !== oldVal) {
            edits.push({ start: el.getStart(sf) + 1, end: el.getEnd() - 1, oldVal, newVal });
          }
        });
      }
      ts.forEachChild(node, walk);
    })(sf);
    if (!edits.length) return;
    let out = src;
    edits.slice().sort((a, b) => b.start - a.start).forEach(e => {
      out = out.slice(0, e.start) + e.newVal + out.slice(e.end);
      report.set(e.oldVal + '  →  ' + e.newVal, (report.get(e.oldVal + '  →  ' + e.newVal) || 0) + 1);
      labelsChanged++;
    });
    /* 写盘前验证可解析 */
    const chk = ts.createSourceFile(f, out, ts.ScriptTarget.ES2022, true);
    if ((chk.parseDiagnostics || []).length) {
      console.log('  !! ' + f + ': 改动后语法错误，跳过');
      return;
    }
    if (out.indexOf('\uFFFD') >= 0) { console.log('  !! ' + f + ': 出现 U+FFFD，跳过'); return; }
    fs.writeFileSync(p, out, 'utf8');
    filesChanged++;
    console.log(`  ${f}: ${edits.length} 个标签`);
  });
});

console.log(`\n改动 ${filesChanged} 个文件 · ${labelsChanged} 个标签`);
console.log('\n映射（旧 → 新，计数）：');
[...report.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + String(v).padStart(3) + '  ' + k));
