/* 经济界面验证：进入游戏 → 切到「经济」标签 → 检查结构与渲染，并截图。 */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'].find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
const PORT = 9395;
const profile = path.join(os.tmpdir(), 'fiume-eco-' + Date.now());
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--window-size=1680,1400',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
const preview = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
  'preview', '--host', '127.0.0.1', '--port', '4195', '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
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
    for (let i = 0; i < 120; i++) { try { const r = await fetch('http://127.0.0.1:4195/'); if (r.ok) break; } catch (e) {} await sleep(250); }
    let v; for (let i = 0; i < 120; i++) { try { v = await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json(); if (v.webSocketDebuggerUrl) break; } catch (e) {} await sleep(250); }
    const tab = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank', { method: 'PUT' })).json();
    const cdp = await CDP.connect(tab.webSocketDebuggerUrl);
    await cdp.send('Runtime.enable'); await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1180, height: 1500, deviceScaleFactor: 2, mobile: false });
    const errs = [];
    cdp.ws.addEventListener('message', e => {
      let m; try { m = JSON.parse(e.data); } catch (x) { return; }
      if (m.method === 'Runtime.exceptionThrown') errs.push(((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text || '').slice(0, 240));
    });
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:4195/' });
    await sleep(3600);
    const ev = async x => {
      const r = await cdp.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) return 'ERR: ' + ((r.exceptionDetails.exception || {}).description || '').slice(0, 260);
      return r.result.value;
    };
    await ev(`(() => { const p = document.querySelector('.start-force__pick:not([disabled])'); if (p) p.click();
      const b = document.querySelector('.start-play-btn'); if (b) b.click(); return 1; })()`);
    await sleep(3000);
    /* 事件可能待决 —— 先处理掉，才能看到标签页 */
    for (let i = 0; i < 6; i++) {
      const pending = await ev(`!!document.querySelector('.inline-event')`);
      if (!pending) break;
      await ev(`(() => { const o = document.querySelector('.inline-event .opt:not([disabled])'); if (o) o.click(); return 1; })()`);
      await sleep(900);
    }
    console.log('切到经济标签:', await ev(`(() => {
      const t = [...document.querySelectorAll('.navbtn')].find(b => /经济|Economia/.test(b.textContent));
      if (!t) return '找不到经济标签: ' + [...document.querySelectorAll('.navbtn')].map(b=>b.textContent.trim()).join('|');
      t.click(); return t.textContent.trim();
    })()`));
    await sleep(1200);
    console.log('\n=== 经济界面结构 ===');
    console.log(JSON.stringify(await ev(`(() => ({
      趋势块: document.querySelectorAll('.ecotrend').length,
      趋势标题: [...document.querySelectorAll('.ecotrend__k')].map(x=>x.textContent),
      趋势数值: [...document.querySelectorAll('.ecotrend__v')].map(x=>x.textContent),
      折线图svg: document.querySelectorAll('.linechart').length,
      折线路径: document.querySelectorAll('.linechart path').length,
      六项格子: document.querySelectorAll('.ecometric').length,
      六项标签: [...document.querySelectorAll('.ecometric__k')].map(x=>x.textContent),
      预算块: document.querySelectorAll('.ecobudget').length,
      甜甜圈: document.querySelectorAll('.ecobudget svg').length,
      图例行: document.querySelectorAll('.ecoleg').length,
      读数格: document.querySelectorAll('.econstat').length,
      读数标签: [...document.querySelectorAll('.econstat__k')].map(x=>x.textContent)
    }))()`), null, 1));

    console.log('\n=== 是否还有旧的裸数字行（应已消失）===');
    console.log(JSON.stringify(await ev(`(() => {
      const eco = document.querySelector('.col--c');
      const leftovers = [...document.querySelectorAll('.field')].map(f => f.textContent.trim().slice(0,40));
      return { fieldRows: leftovers.length, sample: leftovers.slice(0, 6) };
    })()`), null, 1));

    console.log('\n=== 截图 ===');
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    const out = path.join(ROOT, 'tmp', 'eco.png');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
    console.log('已保存 ' + out + ' (' + Math.round(Buffer.from(shot.data, 'base64').length / 1024) + ' KB)');
    console.log('\n运行期异常:', errs.length ? errs.slice(0, 3) : '（无）');
    cdp.close();
  } catch (e) { console.log('FATAL', e.message); }
  finally { chrome.kill(); preview.kill(); }
})();
