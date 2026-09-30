/* Click through the start screen and report what the game screen renders. */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), { spawn } = require('child_process');
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(p => fs.existsSync(p));
const url = process.argv[2] || 'http://localhost:5173/';
const profile = path.join(os.tmpdir(), 'fiume-game-' + Date.now());
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
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      console.log('CONSOLE ERROR:', m.params.args.map(a => a.value || a.description || '').join(' ').slice(0, 300));
    }
  });
  await send('Runtime.enable'); await send('Page.enable');
  const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.result.value;
  await wait(7000);
  console.log('start screen:', await ev(`!!document.querySelector('.stage-full--start')`));
  // click 接受指挥, then switch to the action tab
  await ev(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('接受指挥')); if(b){b.click();return true;} return false; })()`);
  await wait(2000); const locked = await ev(`(() => [...document.querySelectorAll('.navbtn')].filter(b=>b.disabled).map(b=>b.dataset.tab).join(','))()`);
  console.log('locked tabs:', locked);
  
  await wait(1800);
  
  await wait(1800);
  console.log('locked after resolve:', await ev(`(() => [...document.querySelectorAll('.navbtn')].filter(b=>b.disabled).map(b=>b.dataset.tab).join(','))()`));
  await ev(`(() => { const b=[...document.querySelectorAll('.navbtn')].find(x=>x.dataset.tab==='assemblea'); if(b){b.click();return true;} return false; })()`); await wait(1600);
  console.log('relations cells:', await ev(`(() => document.querySelectorAll('.relmat__c').length)()`));
  console.log('advisor slots:', await ev(`(() => document.querySelectorAll('.advslot').length + ' slots, ' + document.querySelectorAll('.advdeck').length + ' deck')()`));
  console.log('nav tabs:', await ev(`(() => [...document.querySelectorAll('.navbtn')].map(b=>b.textContent.replace(/\s+/g,'')).join(' | '))()`));
  console.log('right column:', await ev(`(() => [...document.querySelectorAll('.col--r > *')].map(n=>n.querySelector('.banner__t')?n.querySelector('.banner__t').textContent:'?').join(' / '))()`));
  await wait(1500);
  console.log('population tab:', await ev(`(() => [...document.querySelectorAll('.col > .frame .banner__t')].map(n=>n.textContent).join(' / '))()`));
  const st = await ev(`(() => {
    const r = document.getElementById('root');
    const kids = r ? [...r.children].map(c => c.className || c.tagName) : [];
    return { screen: document.querySelector('.app') ? 'game' : (document.querySelector('.stage-full--start') ? 'start' : 'other'),
             rootClass: r ? r.className : '', kids,
             text: (r ? r.innerText : '').slice(0, 200),
             html: (r ? r.innerHTML : '').slice(0, 300) };
  })()`);
  console.log('after click:', JSON.stringify(st, null, 1));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, '..', 'build_ui', '11-game-black.png'), Buffer.from(shot.result.data, 'base64'));
  console.log('shot build_ui/11-game-black.png');
  sock.close(); proc.kill(); setTimeout(() => process.exit(0), 300);
})().catch(e => { console.error(e); proc.kill(); process.exit(1); });
