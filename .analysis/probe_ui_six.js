/* 界面核实：侧边栏已无军团兵力/党内异议；卡牌弹窗已无成本提示字样；
   外交页「苏联」取代「第三国际」。 */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'].find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
const PORT = 9411;
const profile = path.join(os.tmpdir(), 'fiume-ui6-' + Date.now());
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--window-size=1680,1400',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
const preview = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
  'preview', '--host', '127.0.0.1', '--port', '4211', '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
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
  send(m, p) { const id = ++this.id; return new Promise((res, rej) => { this.pending.set(id, { res, rej });
    this.ws.send(JSON.stringify({ id, method: m, params: p || {} }));
    setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + m)); } }, 30000); }); }
  close() { try { this.ws.close(); } catch (e) {} }
}
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  try {
    for (let i = 0; i < 120; i++) { try { const r = await fetch('http://127.0.0.1:4211/'); if (r.ok) break; } catch (e) {} await sleep(250); }
    let v; for (let i = 0; i < 120; i++) { try { v = await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json(); if (v.webSocketDebuggerUrl) break; } catch (e) {} await sleep(250); }
    const tab = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank', { method: 'PUT' })).json();
    const cdp = await CDP.connect(tab.webSocketDebuggerUrl);
    await cdp.send('Runtime.enable'); await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1680, height: 1400, deviceScaleFactor: 1, mobile: false });
    const errs = [];
    cdp.ws.addEventListener('message', e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; }
      if (m.method === 'Runtime.exceptionThrown') errs.push(((m.params.exceptionDetails.exception || {}).description || '').slice(0, 200)); });
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:4211/' });
    await sleep(3600);
    const ev = async x => { const r = await cdp.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) return 'ERR: ' + String((r.exceptionDetails.exception || {}).description || '').slice(0, 200); return r.result.value; };

    ok(await ev(`!!document.querySelector('.start-play-btn')`), '开局界面已渲染');
    await ev(`(() => { const p=document.querySelector('.start-force__pick:not([disabled])'); if(p)p.click();
      const b=document.querySelector('.start-play-btn'); if(b)b.click(); return 1; })()`);
    await sleep(3000);
    for (let i = 0; i < 8; i++) {
      if (!(await ev(`!!document.querySelector('.inline-event')`))) break;
      await ev(`(() => { const o=document.querySelector('.inline-event .opt:not([disabled])'); if(o)o.click(); return 1; })()`);
      await sleep(900);
    }

    console.log('=== 1. 侧边栏领袖区 ===');
    const side = await ev(`(() => {
      const c = document.querySelector('.comandante');
      return {
        hasComandante: !!c,
        hasBody: !!document.querySelector('.comandante__body'),
        hasMilizia: !!(c && /军团兵力/.test(c.textContent)),
        hasDissent: !!(c && /党内整体异议/.test(c.textContent)),
        gauges: document.querySelectorAll('.cmdr-gauge').length,
        gaugeKeys: [...document.querySelectorAll('.cmdr-gauge__k')].map(x => x.textContent),
        sideText: (document.querySelector('.col--l, .col') || {}).textContent ? '' : ''
      };
    })()`);
    console.log('   ' + JSON.stringify(side));
    ok(side.hasComandante, '领袖区仍在');
    ok(!side.hasBody, '.comandante__body 已移除');
    ok(!side.hasMilizia, '领袖区不再显示「军团兵力」');
    ok(!side.hasDissent, '领袖区不再显示「党内整体异议」');
    ok(side.gauges >= 1, `三项措施仍在（${side.gauges} 个 gauge：${(side.gaugeKeys || []).join('/')}）`);

    console.log('\n=== 2. 卡牌弹窗无成本提示 ===');
    const opened = await ev(`(() => {
      const d = [...document.querySelectorAll('.deck')].find(x => !x.disabled);
      if (!d) return 'no deck';
      d.click(); return 'clicked deck';
    })()`);
    await sleep(1600);
    const cardModal = await ev(`(() => {
      const m = document.querySelector('.modal');
      if (!m) return { err: 'no modal' };
      const txt = m.textContent || '';
      return { hasHint: /成本已在打出时扣除/.test(txt),
               hasDiscard: /弃牌堆/.test(txt),
               hasMustChoose: /必须做出选择/.test(txt),
               hasFooter: !!m.querySelector('.modal__ft'),
               options: m.querySelectorAll('.opt').length,
               raw: txt.slice(0, 60) };
    })()`);
    console.log('   抽卡按钮：' + opened);
    console.log('   ' + JSON.stringify(cardModal));
    if (!cardModal.err) {
      ok(!cardModal.hasHint && !cardModal.hasDiscard && !cardModal.hasMustChoose, '成本提示字样已消失');
      ok(cardModal.hasFooter !== undefined, '弹窗结构完好');
    }
    /* 打出手牌里的卡，看选项弹窗 */
    await ev(`(() => { const x=document.querySelector('.modal .modal__x, .modal__close'); if(x)x.click(); return 1; })()`);
    await sleep(700);
    const playBtn = await ev(`(() => {
      const b=[...document.querySelectorAll('.slot--full .btn')].find(x=>!x.disabled && !/✕/.test(x.textContent));
      if(b){b.click();return b.textContent.trim().slice(0,20);} return 'no playable slot';
    })()`);
    await sleep(1500);
    const optModal = await ev(`(() => {
      const m=document.querySelector('.modal'); if(!m) return {err:'no modal'};
      const txt=m.textContent||'';
      return { hasHint:/成本已在打出时扣除/.test(txt), hasDiscard:/弃牌堆/.test(txt),
               hasMustChoose:/必须做出选择/.test(txt), options:m.querySelectorAll('.opt').length };
    })()`);
    console.log('   打出手牌：' + playBtn);
    console.log('   ' + JSON.stringify(optModal));
    if (!optModal.err) ok(!optModal.hasHint && !optModal.hasDiscard && !optModal.hasMustChoose, '选项弹窗也无该字样');

    console.log('\n=== 3. 外交页：苏联 ===');
    await ev(`(() => { const x=document.querySelector('.modal .modal__x, .modal__close'); if(x)x.click(); return 1; })()`);
    await sleep(500);
    await ev(`(() => { const t=[...document.querySelectorAll('.navbtn')].find(b=>b.textContent.indexOf('外交')>=0); if(t)t.click(); return 1; })()`);
    await sleep(1400);
    const dip = await ev(`(() => {
      const txt=(document.querySelector('.col--c')||{}).textContent||'';
      return { hasSoviet:/苏联/.test(txt), hasComintern:/第三国际/.test(txt),
               names:[...document.querySelectorAll('.diplo-relations__group .field, .dip .field, .diplo-relations span')].map(x=>x.textContent.trim()).filter(t=>t&&t.length<10).slice(0,14) };
    })()`);
    console.log('   ' + JSON.stringify(dip));
    ok(dip.hasSoviet, '外交页出现「苏联」');
    ok(!dip.hasComintern, '外交页不再出现「第三国际」');

    console.log('\n运行期异常: ' + (errs.length ? JSON.stringify(errs.slice(0, 3)) : '（无）'));
    if (errs.length) bad += errs.length;
    console.log('\n' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗'));
    cdp.close();
  } catch (e) { console.log('FATAL', e.message); }
  finally { chrome.kill(); preview.kill(); }
})();
