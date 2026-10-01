/* 强校验：重写只允许改动 text / subtitle / 注释。
   直接解析 git diff，并**忽略空白差异**——基准文件里的 preview / effect 是多行排版，
   重写时对齐排版会产生大量"删一行加三行"的噪音，那不是改动。
   机械值一旦被实质改动（内容不同而非仅换行），就会被抓出来。
   比"对比基线快照"更可靠：不依赖基线取自哪个时刻。 */
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const DIR = 'src/game/government_affairs';
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };

const diff = execFileSync('git', ['diff', '--unified=0', '--', DIR],
  { cwd: ROOT, maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');

/* 归一：去掉所有空白。用于判断"这行是否只是排版变了" */
const squash = s => s.replace(/\s+/g, '');
const norm = l => squash(l.replace(/^\s*/, ''));

const files = {};
let cur = null;
diff.split('\n').forEach(line => {
  const m = line.match(/^\+\+\+ b\/(.+)$/);
  if (m) { cur = m[1]; files[cur] = { added: [], removed: [] }; return; }
  if (!cur) return;
  if (line.startsWith('+') && !line.startsWith('+++')) files[cur].added.push(line.slice(1));
  else if (line.startsWith('-') && !line.startsWith('---')) files[cur].removed.push(line.slice(1));
});

/* 机械关键字：出现在这些字段上的改动必须逐字一致（忽略空白） */
const MECH = /(effect|preview|ministry|cooldown|require|requireText|laws|journals|revenueBoost|cabinet|flags|diplo|economy|order|support|factions|funds|arms|militants|ap)\s*:/;

console.log('=== 逐文件审查（忽略空白差异） ===');
const suspicious = [];
Object.keys(files).sort().forEach(f => {
  const A = files[f].added, R = files[f].removed;
  /* 机械行：新增侧与删除侧的归一集合必须一致 */
  const mechA = [...new Set(A.filter(l => MECH.test(l)).map(norm))].sort();
  const mechR = [...new Set(R.filter(l => MECH.test(l)).map(norm))].sort();
  const onlyA = mechA.filter(x => mechR.indexOf(x) < 0);
  const onlyR = mechR.filter(x => mechA.indexOf(x) < 0);
  if (onlyA.length || onlyR.length) suspicious.push([f, onlyA, onlyR]);
  const name = f.replace(DIR + '/', '');
  console.log(`   ${name.padEnd(24)} 增 ${String(A.length).padStart(3)} 删 ${String(R.length).padStart(3)}`
    + ` · 机械行 增 ${mechA.length} 删 ${mechR.length}`
    + ` · 仅新增 ${onlyA.length} 仅删除 ${onlyR.length}`);
});

console.log('\n=== 机械值是否被实质改动 ===');
if (!suspicious.length) {
  ok(true, '所有机械字段（effect / preview / ministry / cooldown / require / laws / diplo …）内容逐字未变');
} else {
  suspicious.forEach(([f, onlyA, onlyR]) => {
    ok(false, `${f} 机械字段有实质差异：`);
    onlyA.slice(0, 4).forEach(l => console.log('        + ' + l.slice(0, 120)));
    onlyR.slice(0, 4).forEach(l => console.log('        - ' + l.slice(0, 120)));
  });
}

console.log('\n=== 新增/删除的正文行（应为纯文本字段） ===');
let cnDeleted = 0;
Object.keys(files).forEach(f => {
  files[f].removed.forEach(l => {
    const t = l.trim();
    if (!/[\u4e00-\u9fff]/.test(t)) return;
    if (/^(zh|it|text|subtitle|name)\s*:/.test(t)) return;   // 被替换掉的旧文本，正常
    if (/^(preview|effect|laws|journals|flags|diplo|economy|order|support|factions)\s*:/.test(t)) return;
    if (/^['"`]/.test(t) || /^\+\s*['"`]/.test(t)) return;   // 字符串续行
    cnDeleted++;
    if (cnDeleted <= 6) console.log('        - ' + t.slice(0, 110));
  });
});
ok(cnDeleted === 0, `没有误删正文（${cnDeleted} 行）`);

console.log('\n=== 净行数 ===');
let ta = 0, tr = 0;
Object.keys(files).forEach(f => { ta += files[f].added.length; tr += files[f].removed.length; });
console.log(`   合计新增 ${ta} 行，删除 ${tr} 行，净 +${ta - tr}（文本变长是预期的）`);

console.log('\n' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗'));
process.exit(bad ? 1 : 0);
