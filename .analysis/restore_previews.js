/* 把工作区政府卡的 preview 数组恢复成 HEAD 版本。
   背景：重写代理把 preview 标签改短了（合法性 → 军团民意 等），而工作区在重写前
   已经把标签统一成长格式。preview 只影响界面显示、不影响玩法，但那是人工修订过的
   措辞，不应被回退。
   用 TypeScript AST 定位每个 preview 数组并整体替换，不走正则。 */
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const ts = require(path.join(__dirname, '..', 'node_modules', 'typescript'));

const ROOT = path.join(__dirname, '..');
const DIR = 'src/game/government_affairs';

/** 取出源码中所有 preview 数组的字面量文本（按出现顺序） */
function previewLiterals(source) {
  const sf = ts.createSourceFile('x.ts', source, ts.ScriptTarget.ES2022, true);
  const out = [];
  (function walk(node) {
    if (ts.isPropertyAssignment(node) && node.name && node.name.getText(sf) === 'preview') {
      out.push({ start: node.initializer.getStart(sf), end: node.initializer.getEnd(), text: node.initializer.getText(sf) });
    }
    ts.forEachChild(node, walk);
  })(sf);
  return out;
}

const files = fs.readdirSync(path.join(ROOT, 'src', 'game', 'government_affairs'))
  .filter(f => f.endsWith('.ts') && f !== 'index.ts');

let changed = 0, restored = 0;
files.forEach(f => {
  const rel = DIR + '/' + f;
  let head;
  try {
    head = execFileSync('git', ['show', 'HEAD:' + rel],
      { cwd: ROOT, maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
  } catch (e) { return; }

  const headP = previewLiterals(head);
  const curPath = path.join(ROOT, 'src', 'game', 'government_affairs', f);
  let cur = fs.readFileSync(curPath, 'utf8');
  const curP = previewLiterals(cur);

  if (headP.length !== curP.length) {
    console.log(`  !! ${f}: preview 数量不同（HEAD ${headP.length} vs 工作区 ${curP.length}），跳过`);
    return;
  }

  /* 从后往前替换，避免偏移失效 */
  const diffs = [];
  for (let i = curP.length - 1; i >= 0; i--) {
    const norm = s => s.replace(/\s+/g, '');
    if (norm(headP[i].text) === norm(curP[i].text)) continue;
    diffs.push([i, headP[i].text, curP[i].text]);
    cur = cur.slice(0, curP[i].start) + headP[i].text + cur.slice(curP[i].end);
  }
  if (diffs.length) {
    fs.writeFileSync(curPath, cur, 'utf8');
    changed++;
    restored += diffs.length;
    console.log(`  ${f}: 恢复 ${diffs.length} 个 preview`);
    diffs.reverse().forEach(([i, a, b]) => {
      console.log(`      [${i}] 回退 ${b.replace(/\s+/g, ' ')}`);
      console.log(`          → ${a.replace(/\s+/g, ' ')}`);
    });
  }
});
console.log(`\n共修改 ${changed} 个文件，恢复 ${restored} 个 preview 数组`);
