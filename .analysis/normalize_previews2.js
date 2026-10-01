/* 收尾：把剩下两处不统一也归一。
   摄政权威 → 摄政领袖权威（i18n cri.authority）
   工团派 → 工团派异议（当它单独作为异议标签出现时）
   同样只动 preview 数组内的字符串，且写盘前验证可解析。 */
'use strict';
const path = require('path');
const fs = require('fs');
const ts = require(path.join(__dirname, '..', 'node_modules', 'typescript'));

const DIRS = ['action_affairs', 'government_affairs', 'party_affairs']
  .map(d => path.join(__dirname, '..', 'src', 'game', d))
  .filter(d => fs.existsSync(d));

/* 逐条精确匹配整段标签，避免误伤 */
const EXACT = {
  '摄政权威 +': '摄政领袖权威 +',
  '摄政权威 ++': '摄政领袖权威 ++',
  '摄政权威 −': '摄政领袖权威 −',
  '摄政权威 −−': '摄政领袖权威 −−',
  '摄政权威 +3': '摄政领袖权威 +3',
  '工团派 +': '工团派异议 +',
  '工团派 ++': '工团派异议 ++',
  '工团派 −': '工团派异议 −'
};

let files = 0, labels = 0;
const seen = new Map();
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
          const nv = EXACT[el.text];
          if (nv) {
            edits.push({ start: el.getStart(sf) + 1, end: el.getEnd() - 1, oldVal: el.text, newVal: nv });
            seen.set(el.text + '  →  ' + nv, (seen.get(el.text + '  →  ' + nv) || 0) + 1);
          }
        });
      }
      ts.forEachChild(node, walk);
    })(sf);
    if (!edits.length) return;
    let out = src;
    edits.slice().sort((a, b) => b.start - a.start).forEach(e => { out = out.slice(0, e.start) + e.newVal + out.slice(e.end); labels++; });
    const chk = ts.createSourceFile(f, out, ts.ScriptTarget.ES2022, true);
    if ((chk.parseDiagnostics || []).length || out.indexOf('\uFFFD') >= 0) { console.log('  !! ' + f + ' 跳过'); return; }
    fs.writeFileSync(p, out, 'utf8');
    files++;
    console.log('  ' + f + ': ' + edits.length);
  });
});
console.log(`\n改动 ${files} 个文件 · ${labels} 个标签`);
[...seen.entries()].forEach(([k, v]) => console.log('  ' + String(v).padStart(3) + '  ' + k));
