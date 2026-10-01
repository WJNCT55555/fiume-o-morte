/* 日志面板验证（按真实 DOM 结构驱动）
   注意：待决事件渲染在 .inline-event（不是 modal），推进按钮文本是「推进半个月 ▸」。 */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.analysis', 'shots');
fs.mkdirSync(OUT, { recursive: true });
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'].find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
if (!CHROME) { console.error('找不到 Chrome'); process.exit(2); }
const PORT = 9343;
const profile = path.join(os.tmpdir(), 'fiume-jrn2-' + Date.now());
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--window-size=1680,1100', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'],
  { stdio: ['ignore', 'pipe', 'pipe'] });
const preview = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
  'preview', '--host', '127.0.0.1', '--port', '4176', '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = []; }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws')); });
    const c = new CDP(ws);
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; }
      if (m.id && c.pending.has(m.id)) { const { res, rej } = c.pending.get(m.id); c.pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
      else if (m.method) c.handlers.forEach(h => h(m)); };
    return c;
  }
  send(method, params) { const id = ++this.id;
    return new Promise((res, rej) => { this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params: params || {} }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); } }, 30000); }); }
  on(f) { this.handlers.push(f); }
  close() { try { this.ws.close(); } catch (e) {} }
}
(async () => {
  const problems = [];
  let cdp;
  try {
    for (let i = 0; i < 120; i++) { try { const r = await fetch('http://127.0.0.1:4176/'); if (r.ok) break; } catch (e) {} await sleep(250); }
    let v; for (let i = 0; i < 120; i++) { try { v = await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json(); if (v.webSocketDebuggerUrl) break; } catch (e) {} await sleep(250); }
    const tab = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank', { method: 'PUT' })).json();
    cdp = await CDP.connect(tab.webSocketDebuggerUrl);
    cdp.on(m => { if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails; problems.push('EXCEPTION: ' + (d.exception?.description || d.text)); } });
    await cdp.send('Runtime.enable'); await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1680, height: 1100, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:4176/' });
    await sleep(3400);
    const ev = async e => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || '').slice(0, 300)); return r.result.value; };
    const shot = async n => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(OUT, n), Buffer.from(r.data, 'base64')); };

    await ev(`(() => { const b=[...document.querySelectorAll('.btn')].find(x=>x.textContent.includes('接受指挥')); b?.click(); return !!b; })()`);
    await sleep(1600);

    // 逐回合：先解决待决事件，再推进
    let resolved = 0, advanced = 0;
    for (let i = 0; i < 26; i++) {
      const has = await ev(`!!document.querySelector('.inline-event')`);
      if (has) {
        const clicked = await ev(`(() => {
          const box = document.querySelector('.inline-event');
          if (!box) return null;
          const opts = [...box.querySelectorAll('button')].filter(b => b.offsetParent !== null && b.textContent.trim());
          // 选项按钮：排除关闭/查看类
          const pick = opts.find(b => !/^(关闭|取消|详情|查看)/.test(b.textContent.trim()));
          if (!pick) return null;
          const label = pick.textContent.trim().slice(0, 30);
          pick.click();
          return label;
        })()`);
        if (clicked) resolved++;
        await sleep(420);
      } else {
        const ok = await ev(`(() => { const b=[...document.querySelectorAll('button')].find(x=>/推进半个月/.test(x.textContent)); if(b){b.click();return true;} return false; })()`);
        if (ok) advanced++;
        await sleep(420);
      }
      const n = await ev(`document.querySelectorAll('.jrn').length`);
      if (n >= 2 && resolved >= 1) break;
    }
    console.log(`解决事件 ${resolved} 次 · 推进 ${advanced} 次`);

    const info = await ev(`(() => {
      const dets=[...document.querySelectorAll('.jrn')];
      return { count:dets.length, tags:[...new Set(dets.map(d=>d.tagName))],
        badge: document.querySelector('.banner') ? [...document.querySelectorAll('.banner')].map(b=>b.textContent.trim()) : null,
        rows: dets.map(d=>({ title:d.querySelector('.jrn__title')?.textContent,
          chip:d.querySelector('.chip')?.textContent,
          blocks:d.querySelectorAll('.jrn__block').length,
          keys:[...d.querySelectorAll('.jrn__block-k')].map(x=>x.textContent),
          items:[...d.querySelectorAll('.jrn__list li')].map(x=>x.textContent) })) };
    })()`);
    console.log('日志条目数:', info.count, '| 标签:', info.tags.join(','));
    if (info.rows[0]) {
      console.log('\n第一条:', info.rows[0].title, '[' + info.rows[0].chip + ']');
      console.log('  区块标题:', info.rows[0].keys.join(' | '));
      info.rows[0].items.forEach(x => console.log('   ·', x));
    }
    if (!info.count) problems.push('日志面板仍未渲染 .jrn（事件未解决？）');
    if (info.count && info.tags.some(t => t !== 'DETAILS')) problems.push('.jrn 不是 <details>：' + info.tags.join(','));
    if (info.count && info.rows.some(r => r.blocks !== 4)) problems.push('存在区块数≠4 的日志');
    if (info.count && !info.rows.every(r => r.items.length >= 3)) problems.push('存在展开内容为空的日志');
    await shot('jrn-collapsed.png');

    const expand = await ev(`(() => { document.querySelectorAll('.jrn').forEach(d=>d.open=true); return true; })()`);
    await sleep(400);
    const ex = await ev(`(() => {
      const d=document.querySelector('.jrn'), b=d?.querySelector('.jrn__body');
      return { open:d?.hasAttribute('open'), h:b?Math.round(b.getBoundingClientRect().height):0,
        marker:getComputedStyle(d.querySelector('.jrn__summary'),'::before').content,
        vis:[...d.querySelectorAll('.jrn__block')].filter(x=>x.getBoundingClientRect().height>0).length,
        cursor:getComputedStyle(d.querySelector('.jrn__summary')).cursor };
    })()`);
    console.log('\n展开后:', JSON.stringify(ex));
    if (!ex.open || ex.h < 40) problems.push('展开后内容高度异常：' + ex.h);
    if (ex.vis !== 4) problems.push('展开后可见区块 ' + ex.vis + ' ≠ 4');
    if (!/[\u2212-]/.test(ex.marker || '')) problems.push('展开标记未变为 −：' + ex.marker);
    if (ex.cursor !== 'pointer') problems.push('summary 光标不是 pointer');
    await shot('jrn-expanded.png');

    const layout = await ev(`(() => { const c=document.querySelector('.col--r');
      return { docOverflow:document.documentElement.scrollWidth>window.innerWidth+2,
        colScroll: c? c.scrollWidth-c.clientWidth : null, count:document.querySelectorAll('.jrn').length }; })()`);
    console.log('布局:', JSON.stringify(layout));
    if (layout.docOverflow) problems.push('展开后页面水平溢出');

    await ev(`(() => { document.querySelectorAll('.jrn').forEach(d=>d.open=false); return true; })()`);
    await sleep(250);
    const ct = await ev(`(() => { const t=document.querySelector('.jrn__title');
      return !!t && t.getBoundingClientRect().height>0 && t.textContent.length>0; })()`);
    if (!ct) problems.push('折叠态标题不可见');
    await shot('jrn-final.png');
  } catch (e) { problems.push('FATAL: ' + e.message); }
  finally { try { cdp?.close(); } catch (e) {} chrome.kill(); preview.kill(); }
  console.log('\n' + (problems.length ? '✗ 问题：\n  - ' + problems.join('\n  - ') : '✓ 日志面板验证通过'));
  process.exit(problems.length ? 1 : 0);
})();
