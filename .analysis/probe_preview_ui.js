/* 浏览器验证（修正版）：
   1. .opt--card 的悬浮窗规则是否存在（用 indexOf，不用正则——上次正则被模板字符串吃掉）
   2. 面板打开时：每个效果是否各占一行（先把 display 打开再量，上次在 display:none 下量，offsetTop 全是 0）
   3. 术语是否已无缩写 */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'].find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
const PORT = 9383;
const profile = path.join(os.tmpdir(), 'fiume-prev2-' + Date.now());
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--window-size=1680,1100',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
const preview = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
  'preview', '--host', '127.0.0.1', '--port', '4189', '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
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
(async () => {
  try {
    for (let i = 0; i < 120; i++) { try { const r = await fetch('http://127.0.0.1:4189/'); if (r.ok) break; } catch (e) {} await sleep(250); }
    let v; for (let i = 0; i < 120; i++) { try { v = await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json(); if (v.webSocketDebuggerUrl) break; } catch (e) {} await sleep(250); }
    const tab = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank', { method: 'PUT' })).json();
    const cdp = await CDP.connect(tab.webSocketDebuggerUrl);
    await cdp.send('Runtime.enable'); await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1680, height: 1100, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:4189/' });
    await sleep(3600);
    const ev = async x => {
      const r = await cdp.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) return 'ERR: ' + ((r.exceptionDetails.exception || {}).description || '').slice(0, 240);
      return r.result.value;
    };
    console.log('=== 1. 相关 CSS 规则（indexOf 匹配）===');
    console.log(await ev(`(() => {
      const out = [];
      for (const sheet of Array.from(document.styleSheets)) {
        let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
        const walk = list => { for (const r of Array.from(list)) {
          if (r.cssRules && r.cssRules.length) { walk(r.cssRules); continue; }
          const sel = r.selectorText || '';
          if (sel.indexOf('opt--card') >= 0) out.push(sel + '  →  ' + (r.style.display || r.style.flexDirection || r.style.position || r.style.top || '(其他)'));
        } };
        walk(rules);
      }
      return out.join('\\n');
    })()`));

    console.log('\n=== 2. 实测：面板打开时每个效果各占一行 ===');
    console.log(JSON.stringify(await ev(`(() => {
      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:20px;top:20px;width:600px';
      const opt = document.createElement('button');
      opt.className = 'opt opt--card';
      const p = document.createElement('div'); p.className = 'opt__p';
      ['军团民意 +','政治暴力 ++','港口吞吐指数 −','有产精英支持 −−'].forEach(t => {
        const s = document.createElement('span'); s.className = 'opt__pv'; s.textContent = t; p.appendChild(s);
      });
      opt.appendChild(p); host.appendChild(opt); document.body.appendChild(host);
      const idle = getComputedStyle(p).display;
      /* 手动打开面板再量 —— 上次在 display:none 下量 offsetTop，全是 0 */
      p.style.display = 'flex';
      const tops = Array.from(p.children).map(c => c.offsetTop);
      const heights = Array.from(p.children).map(c => c.offsetHeight);
      const pvDisplay = getComputedStyle(p.children[0]).display;
      const lines = new Set(tops).size;
      const heading = getComputedStyle(p, '::before').content;
      const res = { idleDisplay: idle, openDisplay: getComputedStyle(p).display,
                    pvDisplay, effectCount: p.children.length, distinctRows: lines,
                    onePerLine: lines === p.children.length, tops, heights, heading };
      host.remove();
      return res;
    })()`), null, 1));

    console.log('\n=== 3. flip 类（面板是否会翻转到上方）===');
    console.log(JSON.stringify(await ev(`(() => {
      const host = document.createElement('div');
      host.innerHTML = '<button class="opt opt--card opt--flip"><div class="opt__p" style="display:flex"><span class="opt__pv">a</span></div></button>';
      document.body.appendChild(host);
      const p = host.querySelector('.opt__p');
      const cs = getComputedStyle(p);
      const res = { bottom: cs.bottom, top: cs.top };
      host.remove();
      return res;
    })()`)));

    console.log('\n=== 4. 术语：缩写残留 ===');
    console.log(JSON.stringify(await ev(`(() => {
      const F = window.Fiume;
      const ABBR = ['合法性','领袖权威','民族派 ','克罗地亚党','商业派'];
      const bad = [];
      F.Cards.forEach(c => (c.options||[]).forEach(o => (o.preview||[]).forEach(p => {
        const lbl = typeof p === 'string' ? p : (p.zh||p.label||'');
        ABBR.forEach(a => {
          /* 摄政领袖权威 含「领袖权威」，是完整术语，要放过 */
          if (lbl.indexOf(a) >= 0 && lbl.indexOf('摄政领袖权威') < 0) bad.push(c.id+'/'+o.id+': '+lbl);
        });
        if (/(^|[^法政])暴力/.test(lbl)) bad.push(c.id+'/'+o.id+': 裸暴力 '+lbl);
        if (lbl.indexOf('事态') === 0) bad.push(c.id+'/'+o.id+': 短事态 '+lbl);
        if (lbl.indexOf('吞吐') === 0) bad.push(c.id+'/'+o.id+': 短吞吐 '+lbl);
        if (lbl.indexOf('失业') === 0 && lbl.indexOf('失业率') < 0) bad.push(c.id+'/'+o.id+': 短失业 '+lbl);
        if (lbl.indexOf('通胀') === 0 && lbl.indexOf('通胀率') < 0) bad.push(c.id+'/'+o.id+': 短通胀 '+lbl);
        if (lbl.indexOf('热度') === 0) bad.push(c.id+'/'+o.id+': 短热度 '+lbl);
      })));
      return bad.length ? bad : '（无缩写残留）';
    })()`), null, 1));
    cdp.close();
  } catch (e) { console.log('FATAL', e.message); }
  finally { chrome.kill(); preview.kill(); }
})();
