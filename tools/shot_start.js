/* Screenshot the Vite preview start screen to verify the layer stack. */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), { spawn } = require('child_process');
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(p => fs.existsSync(p));
if (!CHROME) { console.error('no chrome'); process.exit(1); }
const url = process.argv[2] || 'http://localhost:4178/';
const profile = path.join(os.tmpdir(), 'fiume-start-' + Date.now());
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1680,1100', url], { stdio: 'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let ws = null;
  for (let i = 0; i < 60 && !ws; i++) {
    await wait(300);
    try {
      const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim();
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const pg = list.find(t => t.type === 'page' && !t.url.startsWith('devtools'));
      if (pg) ws = pg.webSocketDebuggerUrl;
    } catch (e) {}
  }
  if (!ws) { console.error('no cdp'); proc.kill(); process.exit(1); }
  const sock = new WebSocket(ws);
  let id = 0; const pend = new Map();
  const send = (m, p) => new Promise(res => { const i = ++id; pend.set(i, res); sock.send(JSON.stringify({ id: i, method: m, params: p || {} })); });
  await new Promise(r => sock.addEventListener('open', r));
  sock.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
  const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.result.value;
  await wait(7000);
  const info = await ev(`(() => {
    const s = document.querySelector('.stage-full--start') || document.querySelector('.stage-full');
    if (!s) return { err: 'no start screen', body: document.body.innerText.slice(0,200) };
    const cs = el => { if(!el) return null; const c = getComputedStyle(el); return c.zIndex + ' / ' + c.position; };
    return {
      stageBefore: getComputedStyle(s, '::before').backgroundImage.slice(0, 60),
      stageBeforeZ: getComputedStyle(s, '::before').zIndex,
      splashArt: cs(document.querySelector('.stage-full--start .splash__art')),
      frame: getComputedStyle(document.querySelector('.stage-full--start .stage-full__in'), '::after').zIndex,
      leftFrame: cs(document.querySelector('.stage-full--start .splash > .frame')),
      setup: cs(document.querySelector('.stage-full--start .start-setup')),
    };
  })()`);
  console.log(JSON.stringify(info, null, 1));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.mkdirSync(path.join(__dirname, '..', 'build_ui'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'build_ui', '10-start-layers.png'), Buffer.from(shot.result.data, 'base64'));
  console.log('saved build_ui/10-start-layers.png');
  sock.close(); proc.kill(); setTimeout(() => process.exit(0), 300);
})().catch(e => { console.error(e); proc.kill(); process.exit(1); });
