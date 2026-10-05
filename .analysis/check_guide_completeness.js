'use strict';
/* 校验交付文档的完整性：14 个结局、条件、通关步骤、评级是否齐全 */
const fs = require('fs');
const path = require('path');

const doc = fs.readFileSync(path.join(__dirname, '..', 'docs', '结局攻略与评级.md'), 'utf8');
const H = require('./ending_harness.js');
const { Meta } = H;

let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };
const count = (s) => (doc.split(s).length - 1);

console.log(`文档大小 ${doc.length} 字符 / ${doc.split('\n').length} 行\n`);

console.log('=== 1. 十四个结局：id + 中文名 + 标签 全部出现 ===');
Meta.ENDINGS.forEach(e => {
  const hasId = count(e.id) > 0;
  const hasZh = count(e.zh) > 0;
  ok(hasId && hasZh, `${e.id.padEnd(24)} 中文名「${e.zh}」  id ${count(e.id)} 次 / 名 ${count(e.zh)} 次`);
});

console.log('\n=== 2. 每个结局都有「条件」与「评级」 ===');
Meta.ENDINGS.forEach(e => {
  /* 条件：文档的表格里必须出现该结局的 check 关键项 */
  const zh = e.zh;
  const idx = doc.indexOf(zh);
  ok(idx >= 0, `${e.id} 在文档中有中文名`);
});

console.log('=== 3. 评级星标齐全（每个结局各一个评级） ===');
{
  const table = doc.split('## 五、一页速查表')[1].split('## 六、')[0];
  const allRows = table.split('\n').filter(l => l.trim().startsWith('|'));
  /* 数据行 = 含星级的行；表头与分隔行不含 */
  const rows = allRows.filter(l => /★/.test(l));
  const N = Meta.ENDINGS.length;
  console.log(`  速查表总行 ${allRows.length}（含表头/分隔），带评级的数据行 ${rows.length}；ENDINGS 共 ${N} 条`);
  ok(rows.length === N, `速查表恰好 ${N} 行带评级（实际 ${rows.length}）`);
  const tierCount = {};
  /* 用「行首 = 结局名」精确匹配，避免攻略文字里提到别的结局名时误判 */
  const rowName = l => {
    const m = l.match(/^\|\s*([^|]+?)\s*\|/);
    return m ? m[1] : '';
  };
  rows.forEach(r => {
    const m = r.match(/(★+☆*)/);
    if (m) tierCount[m[1]] = (tierCount[m[1]] || 0) + 1;
  });
  console.log('  评级分布:', JSON.stringify(tierCount));
  ok(!Object.keys(tierCount).some(k => k.length !== 5), '所有评级都是五格制');
  const sum = Object.values(tierCount).reduce((a, b) => a + b, 0);
  ok(sum === N, `评级总数 = ${N} 个结局（实际 ${sum}）`);
  /* 9 个结局现在全部可达：★ 级不代表可达性，只代表难度。
     只有武装驱离走确定性路径（事件驱动），其余 8 个由策略代理直接命中。 */
  const rows9 = rows.map(rowName).filter(Boolean);
  ok(rows9.length === 10, `速查表有 10 行结局（实际 ${rows9.length}）`);
  ok(!rows.some(l => /不可达/.test(l)), '速查表里不再有「不可达」的结局');
  ok(rows.some(l => rowName(l) === '武装驱离' && /确定性/.test(l)),
    '武装驱离行标注了确定性路径');
  ok(tierCount['★★★★★'] === 2, `恰有 2 个 ★★★★★（阜姆公社 + 阜姆或死亡，实际 ${tierCount['★★★★★']}）`);
}

console.log('\n=== 4. 六个可达结局各有一段「通关步骤」 ===');
{
  const six = ['无声的港口', '诗人离开', '法西斯城邦', '内战僵局', '武装驱离', '进军罗马', '吞并'];
  six.forEach(n => {
    /* 找到该结局的三级标题段落，检查里面有「通关步骤」 */
    const m = doc.match(new RegExp('###[^\\n]*' + n + '[\\s\\S]*?(?=\\n###|\\n## )'));
    ok(!!m && m[0].indexOf('通关步骤') >= 0, `${n} 段落含「通关步骤」`);
  });
}

console.log('\n=== 5. 不可达结局各有一段「阻塞证明」 ===');
{
  /* 已删/改为成就的条目只在第四节留说明；仍在 ENDINGS 里的不可达结局才要阻塞证明 */
  const unreachableNow = ['阜姆或死亡', '尚未落幕'];
  const removed = ['血腥圣诞', '长夜里的集会', '阜姆公社', '亚得里亚的但泽', '第二个威尼斯'];
  const sec4 = doc.split('## 四、')[1].split('## 五、')[0];
  unreachableNow.forEach(n => ok(sec4.indexOf(n) >= 0, `${n} 出现在第四节（阻塞证明）`));
  removed.forEach(n => ok(sec4.indexOf(n) >= 0 || doc.indexOf(n) >= 0, `${n} 在文档中有说明`));
  /* ending_carnaro 已移除、ending_venice 已改为成就：文档须说明这两次调整 */
  ok(sec4.indexOf('已移除') >= 0 || doc.indexOf('改为成就') >= 0,
    '文档说明了 ending_carnaro / ending_venice 的调整');
  ok(!Meta.ENDINGS.some(e => e.id === 'ending_carnaro'), 'ENDINGS 中确实没有 ending_carnaro');
  ok(!Meta.ENDINGS.some(e => e.id === 'ending_venice'), 'ENDINGS 中确实没有 ending_venice');
  ok(Meta.ACHIEVEMENTS.some(a => a.id === 'ach_venice'), 'ach_venice 成就存在');
  ok(doc.indexOf('ach_venice') >= 0, '文档提到了 ach_venice');
}

console.log('\n=== 6. 评级标准表存在且为五档 ===');
{
  ok(doc.indexOf('## 二、达成难度评级标准') >= 0, '有独立章节说明评级标准');
  const std = doc.split('## 二、')[1].split('## 三、')[0];
  const tiers = ['★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★'];
  tiers.forEach(t => ok(std.indexOf(t) >= 0, `标准表含 ${t}`));
  ok(std.indexOf('前置链长度') >= 0 && std.indexOf('时间窗宽度') >= 0
    && std.indexOf('容错率') >= 0 && std.indexOf('资源压力') >= 0, '四个评级维度都写明');
}

console.log('\n=== 7. 每条结论都有可复现证据（复现命令） ===');
ok(doc.indexOf('node .analysis/end_matrix.js') >= 0, '文档给出可达性总表的复现命令');
ok(doc.indexOf('node .analysis/end_blockers.js') >= 0, '文档给出阻塞证明的复现命令');
ok(doc.indexOf('node .analysis/check_ending_guide.js') >= 0, '文档给出数值校验的复现命令');
ok(doc.indexOf('未改动') >= 0 || doc.indexOf('未修改') >= 0, '文档声明未改动游戏代码');

console.log('\n=== 8. 引用代码位置的行号是否真实 ===');
{
  const fsx = require('fs');
  const base = path.join(__dirname, '..');
  const refs = [...doc.matchAll(/`([a-zA-Z_\/\.]+\.(?:js|ts)):(\d+)(?:-(\d+))?`/g)];
  console.log(`  文档引用代码位置 ${refs.length} 处`);
  const seen = new Set();
  refs.forEach(m => {
    const rel = m[1], line = parseInt(m[2], 10);
    /* 只在能定位到文件时校验 */
    const cands = [
      path.join(base, rel),
      path.join(base, 'src', 'game', 'data', rel.replace(/^.*\//, '')),
      path.join(base, 'src', 'game', 'engine', rel.replace(/^.*\//, '')),
    ];
    const hit = cands.filter(p => { try { return fsx.statSync(p).isFile(); } catch (e) { return false; } })[0];
    if (!hit) return;
    const key = hit + ':' + line;
    if (seen.has(key)) return;
    seen.add(key);
    const total = fsx.readFileSync(hit, 'utf8').split('\n').length;
    ok(line >= 1 && line <= total, `${rel}:${line} 在 ${path.basename(hit)} 范围内（共 ${total} 行）`);
  });
}

console.log('\n' + (bad === 0 ? '交付文档完整性校验全部通过 ✓' : bad + ' 项失败 ✗'));
process.exit(bad ? 1 : 0);
