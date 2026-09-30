/* 快速运行时探针：在无头 Chrome 中加载游戏并求值任意表达式。
   用法： node tools/probe.js "<js expression>"                        */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const EXPR = process.argv[2] || '1';
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
].find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
const PORT = 9344;
const profile = path.join(os.tmpdir(), 'fiume-probe-' + Date.now());
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'],
  { stdio: ['ignore', 'pipe', 'pipe'] });
const preview = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
  'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let ready = false;
  for (let i = 0; i < 100 && !ready; i++) {
    try { ready = (await fetch('http://127.0.0.1:4173/')).ok; } catch (e) { /* starting */ }
    if (!ready) await sleep(250);
  }
  if (!ready) throw new Error('Vite preview 未就绪；先运行 npm run build');
  let wsUrl = null;
  for (let i = 0; i < 100 && !wsUrl; i++) {
    try { const v = await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json(); wsUrl = v.webSocketDebuggerUrl; }
    catch (e) { await sleep(250); }
  }
  const tab = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 0; const pend = new Map(); const logs = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    else if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + JSON.stringify(m.params.exceptionDetails).slice(0, 300));
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push('ERR ' + (m.params.args || []).map(a => a.value || a.description).join(' '));
  };
  const send = (method, params) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
  await sleep(2600);
  const r = (await send('Runtime.evaluate', { expression: EXPR, returnByValue: true, awaitPromise: true })).result;
  console.log('RESULT:', JSON.stringify(r && r.result ? r.result.value : null, null, 1));
  if (r && r.exceptionDetails) console.log('EXCEPTION:', JSON.stringify(r.exceptionDetails).slice(0, 900));
  logs.forEach(l => console.log(l));
  ws.close(); chrome.kill(); preview.kill();
  await sleep(300);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  process.exit(0);
})();
