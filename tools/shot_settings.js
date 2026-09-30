/* Opens the settings menu and reports what is in it. */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), { spawn } = require('child_process');
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(p => fs.existsSync(p));
const url = process.argv[2] || 'http://localhost:4188/';
const profile = path.join(os.tmpdir(), 'fiume-set-' + Date.now());
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1680,1050', url], { stdio: 'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let ws = null;
  for (let i = 0; i < 60 && !ws; i++) {
    await wait(300);
    try {
      const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim();
      const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const pg = l.find(t => t.type === 'page' && !t.url.startsWith('devtools'));
      if (pg) ws = pg.webSocketDebuggerUrl;
    } catch (e) {}
  }
  const sock = new WebSocket(ws);
  let id = 0; const pend = new Map();
  const send = (m, p) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method: m, params: p || {} })); });
  await new Promise(r => sock.addEventListener('open', r));
  sock.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      console.log('EXCEPTION:', (d.exception && (d.exception.description || d.exception.value)) || d.text);
    }
  });
  await send('Runtime.enable'); await send('Page.enable');
  const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.result.value;
  await wait(7000);
  await ev(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('接受指挥')); if(b)b.click(); return !!b; })()`);
  await wait(2500);
  await ev(`(() => { const o=document.querySelector('.inline-event button.opt'); if(o){o.click();return true;} return false; })()`);
  await wait(1500);
  await ev(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('设置')); if(b)b.click(); return !!b; })()`);
  await wait(1500);
  const info = await ev(`(() => {
    const col = document.querySelector('.setcol');
    if (!col) return { err: 'no settings panel' };
    return {
      rows: [...col.children].map(n => {
        if (n.classList.contains('setlang')) {
          const btns = [...n.querySelectorAll('.langbtn')];
          return 'LANG: ' + btns.map(b => b.textContent.replace(/\\s+/g,' ') + (b.disabled ? '[disabled]' : '[active]')).join(' | ');
        }
        return (n.disabled ? '[disabled] ' : '[enabled] ') + n.textContent.replace(/\\s+/g,' ').trim();
      }),
      icons: col.querySelectorAll('svg').length
    };
  })()`);
  console.log(JSON.stringify(info, null, 1));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, '..', 'build_ui', '12-settings.png'), Buffer.from(shot.result.data, 'base64'));
  console.log('saved build_ui/12-settings.png');
  sock.close(); proc.kill(); setTimeout(() => process.exit(0), 300);
})().catch(e => { console.error(e); proc.kill(); process.exit(1); });
