/* 逐项核实这批需求是否已落地：
   1. 经济：港口吞吐指数与六项指标并排两列
   2. 危机：两条轴并排两列、命名为「阴谋 · 法西斯的占领」、已移除人口与失业趋势
   3. 外交：与意大利力量的关系栏 + 外交关系栏并排，含六派（意共未成立不显示）
   4. 进军罗马日志：六派中至少三派 ≥ 80
   全部通过 DOM 与 computed style 核实，不靠读源码。 */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'].find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
const PORT = 9401;
const profile = path.join(os.tmpdir(), 'fiume-audit-' + Date.now());
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--window-size=1680,1400',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
const preview = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
  'preview', '--host', '127.0.0.1', '--port', '4201', '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws')); });
    const c = new CDP(ws);
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; }
      if (m.id && c.pending.has(m.id)) { const { res, rej } = c.pending.get(m.id); c.pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } };
    return c;
  }
  send(method, params) { const id = ++this.id;
    return new Promise((res, rej) => { this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params: params || {} }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); } }, 30000); }); }
  close() { try { this.ws.close(); } catch (e) {} }
}
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); return c ? 0 : 1; };
(async () => {
  let bad = 0;
  try {
    for (let i = 0; i < 120; i++) { try { const r = await fetch('http://127.0.0.1:4201/'); if (r.ok) break; } catch (e) {} await sleep(250); }
    let v; for (let i = 0; i < 120; i++) { try { v = await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json(); if (v.webSocketDebuggerUrl) break; } catch (e) {} await sleep(250); }
    const tab = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank', { method: 'PUT' })).json();
    const cdp = await CDP.connect(tab.webSocketDebuggerUrl);
    await cdp.send('Runtime.enable'); await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1680, height: 1400, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:4201/' });
    await sleep(3600);
    const ev = async x => {
      const r = await cdp.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) return 'ERR: ' + ((r.exceptionDetails.exception || {}).description || '').slice(0, 260);
      return r.result.value;
    };
    await ev(`(() => { const p = document.querySelector('.start-force__pick:not([disabled])'); if (p) p.click();
      const b = document.querySelector('.start-play-btn'); if (b) b.click(); return 1; })()`);
    await sleep(3000);
    for (let i = 0; i < 8; i++) {
      if (!(await ev(`!!document.querySelector('.inline-event')`))) break;
      await ev(`(() => { const o = document.querySelector('.inline-event .opt:not([disabled])'); if (o) o.click(); return 1; })()`);
      await sleep(900);
    }
    const goto = async (label) => {
      await ev(`(() => { const t = [...document.querySelectorAll('.navbtn')].find(b => b.textContent.indexOf(${JSON.stringify(label)}) >= 0); if (t) t.click(); return 1; })()`);
      await sleep(1100);
    };

    /* ---- 1. 经济 ---- */
    await goto('经济');
    const eco = await ev(`(() => {
      const g = document.querySelector('.ecoport-grid');
      const cs = g ? getComputedStyle(g) : null;
      return {
        hasGrid: !!g,
        columns: cs ? cs.gridTemplateColumns : null,
        children: g ? g.children.length : 0,
        leadIsTraffic: g ? (g.children[0].textContent || '').indexOf('港口吞吐指数') >= 0 : false,
        sixRows: document.querySelectorAll('.ecometrics .ecometric').length,
        trends: document.querySelectorAll('.ecotrend').length,
        donuts: document.querySelectorAll('.ecobudget svg').length
      };
    })()`);
    console.log('=== 1. 经济 ===');
    console.log('   ' + JSON.stringify(eco));
    bad += ok(eco.hasGrid, '存在 .ecoport-grid 容器');
    bad += ok(eco.children === 2, `两列（子元素 ${eco.children}）`);
    bad += ok(/\\d/.test(eco.columns || '') && (eco.columns || '').split(' ').length >= 2, `CSS 为多列：${eco.columns}`);
    bad += ok(eco.leadIsTraffic, '左列是港口吞吐指数');
    bad += ok(eco.sixRows === 6, `右列六项指标（${eco.sixRows}）`);

    /* ---- 2. 危机 ---- */
    await goto('危机');
    const cri = await ev(`(() => {
      const pair = document.querySelector('.crisis-pair');
      const cs = pair ? getComputedStyle(pair) : null;
      const titles = [...document.querySelectorAll('.crisis-axis .crisis-gauge__title, .crisis-axis .small')].map(x => x.textContent.trim());
      const pageText = (document.querySelector('.col--c') || {}).textContent || '';
      return {
        hasPair: !!pair, columns: cs ? cs.gridTemplateColumns : null,
        axes: document.querySelectorAll('.crisis-axis').length,
        titles: [...document.querySelectorAll('.crisis-axis')].map(a => (a.textContent||'').slice(0, 12)),
        hasPlotName: pageText.indexOf('阴谋 · 法西斯的占领') >= 0,
        hasOldName: pageText.indexOf('党内 · 法西斯的接管') >= 0,
        trendCharts: document.querySelectorAll('.crisis-axis .linechart, .crisis-pair .linechart').length,
        hasPopTrend: pageText.indexOf('人口与就业轨迹') >= 0
      };
    })()`);
    console.log('\n=== 2. 危机 ===');
    console.log('   ' + JSON.stringify(cri));
    bad += ok(cri.hasPair && cri.axes === 2, `两条轴并排（${cri.axes} 个面板）`);
    bad += ok((cri.columns || '').split(' ').length >= 2, `CSS 为多列：${cri.columns}`);
    bad += ok(cri.hasPlotName, '标题为「阴谋 · 法西斯的占领」');
    bad += ok(!cri.hasOldName, '旧名「党内 · 法西斯的接管」已消失');
    bad += ok(cri.trendCharts === 0, `危机页无趋势折线图（${cri.trendCharts}）`);
    bad += ok(!cri.hasPopTrend, '危机页无人口/失业趋势区块');

    /* ---- 3. 外交 ---- */
    await goto('外交');
    const dip = await ev(`(() => {
      const g = document.querySelector('.diplo-relations-grid');
      const cs = g ? getComputedStyle(g) : null;
      const names = [...document.querySelectorAll('.forze-relation__name')].map(x => x.textContent.trim());
      const pageText = (document.querySelector('.col--c') || {}).textContent || '';
      return {
        hasGrid: !!g, columns: cs ? cs.gridTemplateColumns : null,
        panels: g ? g.children.length : 0,
        forces: names,
        hasOfficer: pageText.indexOf('军官团默契') >= 0,
        mentionsPcdi: pageText.indexOf('意大利共产党尚未成立') >= 0
      };
    })()`);
    console.log('\n=== 3. 外交 ===');
    console.log('   ' + JSON.stringify(dip));
    bad += ok(dip.hasGrid && dip.panels === 2, `两栏并排（${dip.panels} 个面板）`);
    bad += ok((dip.columns || '').split(' ').length >= 2, `CSS 为多列：${dip.columns}`);
    const want = ['意大利法西斯党', '意大利社会党', '意大利无政府主义者', '意大利民族主义协会', '意大利革命工团主义者'];
    want.forEach(w => { bad += ok(dip.forces.indexOf(w) >= 0, `列出「${w}」`); });
    bad += ok(dip.mentionsPcdi, '意共未成立时给出说明而非空栏');
    bad += ok(dip.hasOfficer, '军官团作为独立条件单列');

    /* ---- 4. 日志规则 ---- */
    const jr = await ev(`(() => {
      const F = window.Fiume, W = F.World;
      const s = F.Engine.createState('1919-09', 'historical', 42);
      const front = W.FORZA_FRONT, avail = W.availableForzaFront(s);
      const j = F.Meta.JOURNAL_BY_ID.marcia_1920;
      /* 把恰好三派推到 80 之上，看 complete 是否为真 */
      const mk = n => { const t = F.Engine.createState('1919-09','historical',42);
        t.order.milizia = 12000; t.forze.forzearmate = 70;
        avail.slice(0, n).forEach(k => { t.forze[k] = 85; });
        avail.slice(n).forEach(k => { t.forze[k] = 10; });
        return j.complete(t); };
      return { front, avail, frontLen: front.length, availLen: avail.length,
               needed: W.FORZA_FRONT_NEEDED, gate: W.FORZA_BY_ID[front[0]].gate,
               complete2: mk(2), complete3: mk(3), complete4: mk(4) };
    })()`);
    console.log('\n=== 4. 进军罗马日志规则 ===');
    console.log('   ' + JSON.stringify(jr));
    bad += ok(jr.frontLen === 6, `阵线共六派（${jr.frontLen}）`);
    bad += ok(jr.needed === 3, `需要三派（${jr.needed}）`);
    bad += ok(jr.gate === 80, `门槛 80（${jr.gate}）`);
    bad += ok(jr.complete2 === false, '只有两派达标时不完成');
    bad += ok(jr.complete3 === true, '三派达标时完成');
    bad += ok(jr.complete4 === true, '四派达标时也完成');
    console.log('\n' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗'));
    cdp.close();
  } catch (e) { console.log('FATAL', e.message); }
  finally { chrome.kill(); preview.kill(); }
})();
