/* 按类别统计代码行数。
   三个口径都给出，因为它们回答不同的问题：
   - 物理行 physical：文件有多少行（含空行、注释）
   - 有效行 source  ：去掉空行与纯注释行
   - 内容行 content ：TS/JS 里字符串字面量占的行数（本项目的卡牌/事件文案是重头）
   聚合方式：卡牌/事件是「一文件一条内容」，所以这里按文件内容累加，不是文件数。 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP = /[\\/](node_modules|dist|dist-editor|\.git|build_ui|build_geo|tmp|output|\.analysis|artwork|data)[\\/]/;

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (SKIP.test(p + path.sep)) continue;
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const CATS = [
  { name: '引擎与内容（.ts/.tsx）', test: f => /\.tsx?$/.test(f) && !/tools[\\/]/.test(f) },
  { name: '引擎（.js）',           test: f => /\.js$/.test(f) && /[\\/]src[\\/]/.test(f) },
  { name: '样式（.css）',           test: f => /\.css$/.test(f) },
  { name: '工具与检查脚本（tools/）', test: f => /[\\/]tools[\\/].*\.js$/.test(f) },
  { name: '文档（.md）',            test: f => /\.md$/.test(f) }
];

const files = walk(ROOT, []);
const rows = [];

for (const cat of CATS) {
  let filesN = 0, physical = 0, source = 0, comment = 0, blank = 0, content = 0;
  for (const f of files) {
    if (!cat.test(f)) continue;
    const text = fs.readFileSync(f, 'utf8');
    const lines = text.split(/\r?\n/);
    filesN++;
    physical += lines.length;
    let inBlock = false;
    for (const raw of lines) {
      const l = raw.trim();
      if (!l) { blank++; continue; }
      if (inBlock) { comment++; if (l.includes('*/')) inBlock = false; continue; }
      if (l.startsWith('/*')) { comment++; if (!l.includes('*/')) inBlock = true; continue; }
      if (l.startsWith('//')) { comment++; continue; }
      source++;
      /* 内容行：这一行含有中文或较长的引号字符串（本项目的文案特征） */
      if (/[\u4e00-\u9fff]/.test(l) || /['"`][^'"`]{24,}/.test(l)) content++;
    }
  }
  rows.push({ cat: cat.name, filesN, physical, source, comment, blank, content });
}

const pad = (s, n) => String(s).padEnd(n, ' ');
const num = (s, n) => String(s).padStart(n, ' ');
console.log(pad('类别', 26) + num('文件', 6) + num('物理行', 8) + num('有效行', 8) + num('注释', 7) + num('空行', 7) + num('内容行', 8));
console.log('-'.repeat(72));
let t = { filesN: 0, physical: 0, source: 0, comment: 0, blank: 0, content: 0 };
rows.forEach(r => {
  console.log(pad(r.cat, 26) + num(r.filesN, 6) + num(r.physical, 8) + num(r.source, 8) + num(r.comment, 7) + num(r.blank, 7) + num(r.content, 8));
  for (const k of Object.keys(t)) t[k] += r[k];
});
console.log('-'.repeat(72));
console.log(pad('合计', 26) + num(t.filesN, 6) + num(t.physical, 8) + num(t.source, 8) + num(t.comment, 7) + num(t.blank, 7) + num(t.content, 8));

console.log('\n说明：');
console.log('  有效行 = 物理行 − 空行 − 纯注释行（行尾注释仍计入有效行）');
console.log('  内容行 = 含中文或长度 ≥24 的字符串字面量的行（卡牌/事件文案的近似量）');
console.log('  已排除 node_modules / dist / .analysis / build_* / tmp');
