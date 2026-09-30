/* Capture console output and uncaught exceptions from the running app. */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), { spawn } = require('child_process');
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(p => fs.existsSync(p));
const url = process.argv[2] || 'http://localhost:5173/';
const profile = path.join(os.tmpdir(), 'fiume-err-' + Date.now());
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1400,900', url], { stdio: 'ignore' });
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
  if (!ws) { console.error('no cdp'); proc.kill(); process.exit(1); }
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
      if (d.url) console.log('   at', d.url + ':' + d.lineNumber);
    }
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) {
      console.log(m.params.type.toUpperCase() + ':', m.params.args.map(a => a.value || a.description || '').join(' ').slice(0, 400));
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await wait(9000);
  const root = await send('Runtime.evaluate', {
    expression: `(() => { const r = document.getElementById('root');
      return { children: r ? r.children.length : -1, html: r ? r.innerHTML.slice(0, 400) : 'no #root',
               bodyText: document.body.innerText.slice(0, 300) }; })()`,
    returnByValue: true
  });
  console.log('ROOT:', JSON.stringify(root.result.result.value));
  sock.close(); proc.kill(); setTimeout(() => process.exit(0), 300);
})().catch(e => { console.error(e); proc.kill(); process.exit(1); });
