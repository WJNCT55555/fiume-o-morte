/* Verify the start screen title fits one line and the difficulty tooltips exist. */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), { spawn } = require('child_process');
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(p => fs.existsSync(p));
const profile = path.join(os.tmpdir(), 'fiume-chk-' + Date.now());
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1680,1100',
  'http://localhost:4178/'], { stdio: 'ignore' });
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
  sock.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
  const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.result.value;
  await wait(7000);
  console.log(JSON.stringify(await ev(`(() => {
    const t = document.querySelector('.splash__t');
    const r = t.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(t).lineHeight) || 1;
    const picks = [...document.querySelectorAll('.start-difficulty .pick')];
    return {
      titleFontSize: getComputedStyle(t).fontSize,
      titleWhiteSpace: getComputedStyle(t).whiteSpace,
      titleHeight: Math.round(r.height),
      titleLineHeight: lh,
      titleApproxLines: Math.round(r.height / lh),
      titleWidth: Math.round(r.width),
      difficultyLabels: picks.map(p => p.querySelector('.pick__n') ? p.querySelector('.pick__n').textContent : '?'),
      hasInlineDesc: picks.map(p => !!p.querySelector('.pick__d')),
      tooltips: picks.map(p => (p.getAttribute('data-tip') || '').slice(0, 30)),
    };
  })()`), null, 1));
  sock.close(); proc.kill(); setTimeout(() => process.exit(0), 300);
})().catch(e => { console.error(e); proc.kill(); process.exit(1); });
