/* 第一步（重做）：修类型错误。
   1. 删掉政府卡的**卡级** subtitle（Card 类型无此字段 → TS2353 ×15）
   2. 给每个选项加 `subtitle` 字段（占位，第二步填文学化文本）

   上一次失败的两个原因，这次都避开了：
   - 用 getFullStart() 删除会把前一行的换行一起吃掉 → 产生 `},,`。改为整行删除
     （从行首到换行符之后）。
   - 每次改动后**先重新解析验证**，解析通过才写盘；不通过就跳过并报告。 */
'use strict';
const path = require('path');
const fs = require('fs');
const ts = require(path.join(__dirname, '..', 'node_modules', 'typescript'));
const DIR = path.join(__dirname, '..', 'src', 'game', 'government_affairs');

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.ts') && f !== 'index.ts');
let touched = 0, removedCardSub = 0, addedOptSub = 0, skipped = 0;

files.forEach(f => {
  const p = path.join(DIR, f);
  const original = fs.readFileSync(p, 'utf8');
  let src = original;
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.ES2022, true);

  /* 解析前先确认原文件本身没有语法错误 */
  const preDiag = sf.parseDiagnostics || [];
  if (preDiag.length) {
    console.log('  !! ' + f + ': 原文件已有语法错误，跳过');
    skipped++; return;
  }

  const edits = [];

  /* ---- 卡级 subtitle：整行删除 ---- */
  (function walk(node) {
    if (ts.isPropertyAssignment(node) && node.name && node.name.getText(sf) === 'subtitle'
        && ts.isObjectLiteralExpression(node.parent)) {
      const parentNames = node.parent.properties
        .filter(pr => ts.isPropertyAssignment(pr)).map(pr => pr.name.getText(sf));
      if (parentNames.indexOf('options') >= 0) {
        /* 行首：往回找到上一个 \n 之后 */
        let start = node.getStart(sf);
        while (start > 0 && src[start - 1] !== '\n') start--;
        /* 行尾：包含该行的换行 */
        let end = node.getEnd();
        while (end < src.length && src[end] !== '\n') end++;
        if (end < src.length) end++;              // 吃掉换行
        edits.push({ start, end, text: '', kind: 'cardSub', id: 'card' });
      }
    }
    ts.forEachChild(node, walk);
  })(sf);

  /* ---- 选项 subtitle：插在 text 之后 ---- */
  (function walk(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const props = node.properties.filter(pr => ts.isPropertyAssignment(pr));
      const names = props.map(pr => pr.name.getText(sf));
      const isOption = names.indexOf('id') >= 0 && names.indexOf('text') >= 0 && names.indexOf('effect') >= 0;
      if (isOption && names.indexOf('subtitle') < 0) {
        const textProp = props.find(pr => pr.name.getText(sf) === 'text');
        const oid = props.find(pr => pr.name.getText(sf) === 'id').initializer.getText(sf);
        edits.push({
          start: textProp.getEnd(), end: textProp.getEnd(),
          text: ",\n        subtitle: { zh: '待写', it: 'da scrivere' }",
          kind: 'optSub', id: oid
        });
      }
    }
    ts.forEachChild(node, walk);
  })(sf);

  if (!edits.length) { console.log('  ' + f + ': 无改动'); return; }

  edits.sort((a, b) => b.start - a.start);
  edits.forEach(e => { src = src.slice(0, e.start) + e.text + src.slice(e.end); });

  /* ---- 写盘前验证：必须能解析且无诊断 ---- */
  const check = ts.createSourceFile(f, src, ts.ScriptTarget.ES2022, true);
  const diag = check.parseDiagnostics || [];
  if (diag.length) {
    console.log('  !! ' + f + ': 改动后语法错误，未写盘');
    diag.slice(0, 3).forEach(d => {
      const pos = check.getLineAndCharacterOfPosition(d.start);
      console.log('       行 ' + (pos.line + 1) + ': ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));
    });
    skipped++; return;
  }
  /* 再确认没引入替换字符 */
  if (src.indexOf('\uFFFD') >= 0) { console.log('  !! ' + f + ': 出现 U+FFFD，未写盘'); skipped++; return; }

  fs.writeFileSync(p, src, 'utf8');
  touched++;
  const nc = edits.filter(e => e.kind === 'cardSub').length;
  const no = edits.filter(e => e.kind === 'optSub').length;
  removedCardSub += nc; addedOptSub += no;
  console.log('  ' + f + ': 删卡级 ' + nc + ' · 加选项 ' + no);
});

console.log('\n改文件 ' + touched + ' · 删卡级 subtitle ' + removedCardSub + ' · 加选项 subtitle ' + addedOptSub + ' · 跳过 ' + skipped);
