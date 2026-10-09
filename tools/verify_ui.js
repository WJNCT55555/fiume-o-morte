/* UI 验证：用无头 Chrome 通过 CDP 加载页面，收集控制台错误、模拟操作、截图。
   用法： node tools/verify_ui.js [outDir]                                  */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'build_ui');
fs.mkdirSync(OUT, { recursive: true });

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });

if (!CHROME) { console.error('找不到 Chrome/Edge'); process.exit(2); }

const PORT = 9333;
const profile = path.join(os.tmpdir(), 'fiume-verify-' + Date.now());
const args = [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--allow-file-access-from-files',
  '--window-size=1680,1100',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + profile,
  'about:blank'
].filter(a => !(process.env.FIUME_STRICT_FILE && a === '--allow-file-access-from-files'));

const chrome = spawn(CHROME, args, { stdio: ['ignore', 'pipe', 'pipe'] });
const preview = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
  'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'],
  { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
let chromeErr = '';
chrome.stderr.on('data', d => { chromeErr += d.toString(); });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function httpJson(url) {
  const res = await fetch(url);
  return res.json();
}

async function waitForDevtools(timeoutMs = 25000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const v = await httpJson('http://127.0.0.1:' + PORT + '/json/version');
      if (v && v.webSocketDebuggerUrl) return v;
    } catch (e) { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('DevTools 未就绪');
}

async function waitForPreview(timeoutMs = 25000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { const r = await fetch('http://127.0.0.1:4173/'); if (r.ok) return; } catch (e) { /* starting */ }
    await sleep(250);
  }
  throw new Error('Vite preview 未就绪');
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = []; }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = e => rej(new Error('ws error')); });
    const c = new CDP(ws);
    ws.onmessage = ev => {
      let msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.id && c.pending.has(msg.id)) {
        const { res, rej } = c.pending.get(msg.id); c.pending.delete(msg.id);
        msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
      } else if (msg.method) {
        c.handlers.forEach(h => h(msg));
      }
    };
    return c;
  }
  send(method, params) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params: params || {} }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); } }, 30000);
    });
  }
  on(fn) { this.handlers.push(fn); }
  close() { try { this.ws.close(); } catch (e) {} }
}

(async () => {
  const problems = [];
  let cdp;
  try {
    await waitForPreview();
    await waitForDevtools();
    const tab = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank', { method: 'PUT' })).json();
    cdp = await CDP.connect(tab.webSocketDebuggerUrl);

    cdp.on(msg => {
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        problems.push('EXCEPTION: ' + (d.exception && d.exception.description ? d.exception.description : d.text) +
          ' @' + (d.url || '') + ':' + (d.lineNumber + 1));
      } else if (msg.method === 'Runtime.consoleAPICalled' && /error|warning/.test(msg.params.type)) {
        const txt = (msg.params.args || []).map(a => a.value != null ? a.value : (a.description || a.type)).join(' ');
        if (!/DevTools|Autofill|font/i.test(txt)) problems.push('CONSOLE.' + msg.params.type + ': ' + txt);
      } else if (msg.method === 'Log.entryAdded') {
        const e = msg.params.entry;
        if (e.level === 'error' && !/fonts\.googleapis|fonts\.gstatic|net::ERR_INTERNET|Failed to load resource/i.test(e.text)) {
          problems.push('LOG: ' + e.text + ' ' + (e.url || ''));
        }
      }
    });

    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1680, height: 1100, deviceScaleFactor: 1, mobile: false });

    const url = 'http://127.0.0.1:4173/';
    await cdp.send('Page.navigate', { url });
    await sleep(3200);

    async function evalJs(expr) {
      const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails).slice(0, 400));
      return r.result.value;
    }
    async function shot(name, clip) {
      const r = await cdp.send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip, captureBeyondViewport: true } : {}) });
      fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data, 'base64'));
    }

    // 1. 启动画面
    let boot;
    for (let attempt = 0; attempt < 40; attempt++) {
      boot = await evalJs(`(() => {
        const r = document.getElementById('root');
        return { booted: !!window.Fiume?.Engine && !!r?.firstElementChild, rootChildren: r ? r.children.length : -1,
                 bootErr: r && r.querySelector('.boot') ? r.querySelector('.boot').textContent : null,
                 title: (document.querySelector('.splash__t')||{}).textContent || null,
                 modes: [...document.querySelectorAll('.start-difficulty .pick')].map(x => ({ name: x.querySelector('.pick__n')?.textContent, selected: x.getAttribute('aria-pressed') })),
                 force: document.querySelector('.start-force__pick.is-on .start-force__name')?.textContent || null,
                 forces: document.querySelectorAll('.start-force__pick').length,
                 lockedForces: document.querySelectorAll('.start-force__pick:disabled').length,
                 emblems: [...document.querySelectorAll('.start-force__emblem')].filter(img => img.complete && img.naturalWidth > 0).length,
                 leader: document.querySelector('.start-leader__plaque')?.textContent || null,
                 leaderPortrait: (() => { const img = document.querySelector('.start-leader__portrait img'); return !!img && img.complete && img.naturalWidth > 0 && img.getAttribute('src')?.includes('Portrait_gabriele_d_annunzio.png'); })(),
                 leaderFrame: (() => { const f = document.querySelector('.start-leader__frame'); return !!f && getComputedStyle(f).backgroundImage.includes('leader_frame.png'); })(),
                 columns: (() => { const f = document.querySelector('.start-force')?.getBoundingClientRect(), l = document.querySelector('.start-leader')?.getBoundingClientRect(), d = document.querySelector('.start-difficulty')?.getBoundingClientRect(); return !!f && !!l && !!d && f.right <= l.left && l.right <= d.left; })(),
                 removedTextVisible: /意大利卡尔纳罗摄政 · 1920|史实起点|52 000 人|史实线：|史料与致谢|史料基线：/.test(document.querySelector('.stage-full')?.textContent || '') };
      })()`);
      if (boot.booted || boot.bootErr) break;
      await sleep(250);
    }
    console.log('启动检查:', JSON.stringify(boot));
    if (!boot.booted || boot.bootErr) problems.push('BOOT: ' + (boot.bootErr || 'start screen did not load'));
    if (boot.removedTextVisible || boot.force !== '军团' || boot.forces !== 3 || boot.lockedForces !== 2 || boot.emblems !== 3 || !boot.leader?.includes('邓南遮') || !boot.leaderPortrait || !boot.leaderFrame || !boot.columns || boot.modes?.length !== 2 || boot.modes[0]?.name !== '普通' || boot.modes[0]?.selected !== 'true' || boot.modes[1]?.name !== '沙盒') problems.push('START: faction, emblem, leader, or mode layout is incorrect');
    await shot('01-start.png');

    /* The Autonomists and the Socialists are modelled but locked: they must still
       be on screen (the roster shows the whole spectrum) and must not be
       selectable, and clicking one must leave the Legion selected. */
    for (const [index, name, filename] of [[1, '自治党', '01-start-aut.png'], [2, '社会党', '01-start-psi.png']]) {
      const probe = await evalJs(`(() => {
        const pick = document.querySelectorAll('.start-force__pick')[${index}];
        if (!pick) return { missing: true };
        const emblem = pick.querySelector('.start-force__emblem');
        const before = document.querySelector('.start-force__pick.is-on .start-force__name')?.textContent || '';
        pick.click();
        return { disabled: pick.disabled === true, locked: pick.classList.contains('is-locked'),
                 label: pick.querySelector('.start-force__name')?.textContent || '',
                 emblemLoaded: !!emblem && emblem.complete && emblem.naturalWidth > 0,
                 before, after: document.querySelector('.start-force__pick.is-on .start-force__name')?.textContent || '' };
      })()`);
      console.log(`   锁定席位 ${index} (${name}):`, JSON.stringify(probe));
      if (probe.missing || !probe.disabled || !probe.locked) problems.push('START: ' + name + ' must be shown as locked');
      if (!probe.label?.includes(name)) problems.push('START: ' + name + ' locked label is missing the party name');
      if (!probe.emblemLoaded) problems.push('START: ' + name + ' emblem must still render while locked');
      if (probe.before !== probe.after || !probe.after.includes('军团')) {
        problems.push('START: clicking locked ' + name + ' must not change the selected force');
      }
      await shot(filename);
    }

    await evalJs(`(() => { document.querySelectorAll('.start-difficulty .pick')[1]?.click(); return true; })()`);
    await sleep(100);
    const sandboxSelected = await evalJs(`document.querySelectorAll('.start-difficulty .pick')[1]?.getAttribute('aria-pressed') === 'true'`);
    if (!sandboxSelected) problems.push('START: sandbox mode cannot be selected');
    await evalJs(`(() => { document.querySelectorAll('.start-difficulty .pick')[0]?.click(); document.querySelector('.start-force__pick')?.click(); return true; })()`);
    await sleep(100);

    // 2. 开始游戏
    await evalJs(`(() => { const b=[...document.querySelectorAll('.btn')].find(x=>x.textContent.includes('接受指挥')); if(b) b.click(); return !!b; })()`);
    await sleep(900);
    await shot('02a-event.png');
    // 处理初始事件：先关事件看板，再选第一个可用项
    let evCount = 0;
    for (let i = 0; i < 8; i++) {
      const ok = await evalJs(`(() => {
        const m = document.querySelector('.scrim.show .modal');
        if (!m) return false;
        // 事件看板 → 点第一条待决事件
        const row = m.querySelector('.evrow.is-current:not([disabled])') || m.querySelector('.evrow:not([disabled])');
        if (row) { row.click(); return 'board'; }
        // 决策弹窗 → 选第一个可用项
        const o = [...m.querySelectorAll('button.opt')].find(b => !b.disabled);
        if (o) { o.click(); return 'opt'; }
        // 兜底关闭
        const close = [...m.querySelectorAll('.btn')].find(b => b.textContent.trim() === '关闭');
        if (close) { close.click(); return 'close'; }
        return false;
      })()`);
      if (!ok) break;
      if (ok === 'opt') evCount++;
      await sleep(650);
    }
    console.log('已解决初始事件数:', evCount);
    await shot('02-game.png');

    const g1 = await evalJs(`(() => {
      const t = document.querySelector('.resbar');
      return { hasTopbar: !!t, stats: [...document.querySelectorAll('.resslot')].map(s=>s.textContent.trim().slice(0,30)),
               leftPanels: document.querySelectorAll('.col--l .frame').length,
               rightPanels: document.querySelectorAll('.col--r .frame').length,
               nav: [...document.querySelectorAll('.navbtn')].map(t=>t.getAttribute('data-tab')),
               tagArtwork: getComputedStyle(document.querySelector('.navbtn')).backgroundImage.includes('tag_header.png') };
    })()`);
    console.log('主界面:', JSON.stringify(g1));
    /* Nine tabs, in this order: the event board and the action panel were added
       to the strip, and the seventh is `popolazione` rather than `archivio` (the
       archive moved into the left column). Both expectations were stale.
       The old `hasAction` clause is gone with it: it looked for `.action-trigger`,
       which exists nowhere in the codebase — the action panel became a tab, and
       the class survives only as an unused CSS rule. */
    if (g1.nav.join(',') !== 'eventi,azioni,mappa,crisi,economia,arengo,diplomazia,leggi,popolazione' || !g1.tagArtwork) problems.push('GAME: nine tag-header navigation tabs are missing or misordered');

    // Use a state with every active spirit to catch clipped values and ensure
    // the numbers shown by the side panel match the selector output.
    const spiritFixture = await evalJs(`(() => {
      const F=window.Fiume, s=F.Engine.createState('1919-09','historical',91);
      Object.assign(s.laws,{orario:2,lavoro:3,ordine:2,portofranco:2,lingua:2,scuola:2});
      Object.assign(s.flags,{charter_promulgated:true,worker_control:true,smuggle:true});
      const wrap=document.createElement('div'); wrap.id='spirit-fixture'; wrap.className='col col--r';
      wrap.style.cssText='position:fixed;z-index:8500;top:20px;right:20px;width:360px;max-height:calc(100vh - 40px);overflow:auto;background:#17120f';
      wrap.appendChild(F.UI.SidePanel.spiritsBlock(s)); document.body.appendChild(wrap);
      wrap.querySelector('.sec__hd').click();
      const rows=[...wrap.querySelectorAll('.spirit__effect')].map(x=>({label:x.querySelector('.spirit__label')?.textContent,value:x.querySelector('.spirit__v')?.textContent,clipped:x.scrollWidth>x.clientWidth+2}));
      return {count:wrap.querySelectorAll('.spirit').length,markerCount:wrap.querySelectorAll('.spirit__marker').length,rows};
    })()`);
    console.log('国家精神数值:', JSON.stringify(spiritFixture));
    if (spiritFixture.count !== 7 || spiritFixture.markerCount !== 2 ||
        spiritFixture.rows.some(x => x.clipped || !/[+−]\d/.test(x.value || '')) ||
        !spiritFixture.rows.some(x => x.label === '救济支出' && x.value === '+6.0 K£/半月'))
      problems.push('SPIRITS: numeric effects or layout are incorrect');
    await shot('02d-national-spirits.png');
    await evalJs(`document.querySelector('#spirit-fixture')?.remove()`);

    // The same preview overlay serves an inline historical event and a card
    // menu. Exercise real pointer movement: the panel should track X while
    // staying attached directly below the hovered choice.
    const eventFixture = await evalJs(`(() => {
      const F=window.Fiume, s=F.Engine.createState('1919-09','historical',7);
      s.currentEvent='ev_1919_09_marcia';
      const wrap=document.createElement('div'); wrap.id='effect-preview-fixture';
      wrap.className='inline-event';
      wrap.style.cssText='position:fixed;z-index:8500;top:185px;left:50%;transform:translateX(-50%);width:calc(100vw - 360px)';
      wrap.appendChild(F.Views.eventModal(s,{resolveEvent:function(){}}));
      document.body.appendChild(wrap);
      const r=wrap.querySelector('.modal').getBoundingClientRect();
      const o=wrap.querySelector('button.opt').getBoundingClientRect();
      return {sheetWidth:r.width, x:o.left+45, x2:o.left+145, y:o.top+o.height/2, bottom:o.bottom};
    })()`);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: eventFixture.x, y: eventFixture.y });
    await sleep(100);
    const eventHover1 = await evalJs(`(() => { const e=document.querySelector('.effect-float'); const r=e.getBoundingClientRect();
      return {shown:getComputedStyle(e).display!=='none', left:r.left, top:r.top,
        sourceHidden:getComputedStyle(document.querySelector('#effect-preview-fixture .opt__p')).display==='none'}; })()`);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: eventFixture.x2, y: eventFixture.y });
    await sleep(100);
    const eventHover2 = await evalJs(`document.querySelector('.effect-float').getBoundingClientRect().left`);
    if (eventFixture.sheetWidth > 822 || !eventHover1.shown || !eventHover1.sourceHidden ||
        Math.abs(eventHover1.top - eventFixture.bottom - 4) > 2 || eventHover2 < eventHover1.left + 45)
      problems.push('16:9 事件宽度或鼠标跟随效果预览错误');
    await shot('02b-event-hover.png');
    await evalJs(`document.querySelector('#effect-preview-fixture')?.remove()`);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });

    const cardFixture = await evalJs(`(() => {
      const F=window.Fiume, s=F.Engine.createState('1919-09','historical',7);
      s.pendingCard='az_legione_finanziaria'; s.hand=['az_legione_finanziaria'];
      const node=F.Views.cardModal(s,{resolveCardOption:function(){}});
      node.id='effect-card-fixture'; document.body.appendChild(node);
      const o=node.querySelector('button.opt').getBoundingClientRect();
      return {x:o.left+45,y:o.top+o.height/2,bottom:o.bottom};
    })()`);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cardFixture.x, y: cardFixture.y });
    await sleep(100);
    const cardHover = await evalJs(`(() => { const e=document.querySelector('.effect-float'), r=e.getBoundingClientRect();
      return {shown:getComputedStyle(e).display!=='none', top:r.top,
        sourceHidden:getComputedStyle(document.querySelector('#effect-card-fixture .opt__p')).display==='none'}; })()`);
    if (!cardHover.shown || !cardHover.sourceHidden || Math.abs(cardHover.top - cardFixture.bottom - 4) > 2)
      problems.push('卡牌效果预览未接在选项下方');
    await shot('02c-card-hover.png');
    await evalJs(`document.querySelector('#effect-card-fixture')?.remove()`);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });

    for (const width of [1280, 960, 390]) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      await sleep(600);
      await shot('02-game-' + width + '.png');
      const overflow = await evalJs(`document.documentElement.scrollWidth > window.innerWidth + 2`);
      if (overflow) problems.push(width + 'px viewport has horizontal overflow');
      const controlsVisible = await evalJs(`(() => [...document.querySelectorAll('.resbar__motto button')].length === 3 &&
        [...document.querySelectorAll('.resbar__motto button')].every(b => b.getBoundingClientRect().width > 0 &&
          b.getBoundingClientRect().right <= window.innerWidth + 2 && getComputedStyle(b).visibility !== 'hidden'))()`);
      if (!controlsVisible) problems.push(width + 'px viewport hides agenda/settings controls');
      const mastheadVisible = await evalJs(`(() => { const e=document.querySelector('.masthead__t');
        const r=e.getBoundingClientRect(); return r.width > 0 && r.left >= -2 && r.right <= innerWidth + 2 &&
          getComputedStyle(e).visibility !== 'hidden'; })()`);
      if (!mastheadVisible) problems.push(width + 'px viewport clips title');
    }
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1680, height: 1100, deviceScaleFactor: 1, mobile: false });

    // 3. 逐页签截图
    const svgInfo = {};
    for (const key of ['mappa','economia','azioni','arengo','diplomazia','leggi','crisi','archivio']) {
      await evalJs(`(() => { const b=document.querySelector('${key === 'azioni' ? '.action-trigger' : '.navbtn[data-tab="' + key + '"]'}'); if(b) b.click(); return !!b; })()`);
      await sleep(650);
      await shot('03-tab-' + key + '.png');
      if (key === 'economia') {
        const economyOverview = await evalJs(`(() => ({
          kpis: document.querySelectorAll('.eco-kpi').length,
          measures: document.querySelectorAll('.ecoport-grid .ecometric').length,
          formulas: document.querySelectorAll('.eco-formula').length,
          income: document.querySelector('.eco-formulas')?.textContent.includes('有效所得税率')
        }))()`);
        if (economyOverview.kpis !== 4 || economyOverview.measures !== 6 || economyOverview.formulas < 12 || !economyOverview.income)
          problems.push('经济概览、六项指标或结算公式缺失');
        await evalJs(`document.querySelector('.eco-formulas summary')?.click()`);
        await sleep(130);
        await shot('03-tab-economia-formulas.png');
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: false });
        await sleep(180);
        const economyMobile = await evalJs(`(() => { const r=document.querySelector('.eco-dashboard').getBoundingClientRect();
          return { width:r.width, right:r.right, formulas:document.querySelector('.eco-formulas')?.open }; })()`);
        if (economyMobile.right > 392 || !economyMobile.formulas) problems.push('390px 经济页面或公式面板溢出');
        await evalJs(`document.querySelector('.eco-formulas')?.scrollIntoView({ block: 'start', behavior: 'instant' })`);
        await shot('03-tab-economia-mobile.png');
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1680, height: 1100, deviceScaleFactor: 1, mobile: false });
      }
      if (key === 'diplomazia') {
        const diplomacy = await evalJs(`(() => ({
          countries: document.querySelectorAll('.relation-entry--state').length,
          movements: document.querySelectorAll('.forze-pillar').length,
          postures: document.querySelectorAll('.diplo-posture').length,
          meters: document.querySelectorAll('.diplo-dossier [role="meter"]').length,
          selected: document.querySelectorAll('.forze-pillar[aria-pressed="true"]').length,
          current: document.querySelectorAll('.diplo-posture[aria-pressed="true"]').length
        }))()`);
        if (diplomacy.countries !== 9 || diplomacy.movements !== 5 || diplomacy.postures !== 4 ||
          diplomacy.meters !== 15 || diplomacy.current !== 1 || diplomacy.selected !== 1)
          problems.push('外交关系分组、政治力量刻度或姿态未完整显示');
        await evalJs(`document.querySelector('.forze-pillar[data-force="sindacalisti"]').click()`);
        await sleep(120); // React applies the UI-only selection on the next render.
        const pillarSelection = await evalJs(`(() => {
          const target=document.querySelector('.forze-pillar[data-force="sindacalisti"]');
          return {selected:target.getAttribute('aria-pressed'),name:document.querySelector('.forze-dossier__identity strong')?.textContent,
            distance:document.querySelector('.forze-dossier__distance strong')?.textContent};
        })()`);
        console.log('政治力量详情选择:', JSON.stringify(pillarSelection));
        if (pillarSelection.selected !== 'true' || pillarSelection.name !== '意大利革命工团主义者' ||
            !pillarSelection.distance?.includes('还差')) problems.push('政治力量柱子的详情选择错误');
        await evalJs(`scrollTo(0,0)`);
        await shot('03-tab-diplomazia-pillars.png');
        await evalJs(`document.querySelector('.forze-pillar[data-force="sindacalisti"]').focus()`);
        await cdp.send('Input.dispatchKeyEvent', {type:'keyDown',key:'ArrowLeft',code:'ArrowLeft'});
        await cdp.send('Input.dispatchKeyEvent', {type:'keyUp',key:'ArrowLeft',code:'ArrowLeft'});
        await sleep(120);
        const pillarKeyboard = await evalJs(`({selected:document.querySelector('.forze-pillar[aria-pressed="true"]')?.getAttribute('data-force'),focused:document.activeElement?.getAttribute('data-force')})`);
        if (pillarKeyboard.selected !== 'corradini' || pillarKeyboard.focused !== 'corradini')
          problems.push('政治力量柱子的键盘焦点或选择错误');
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: false });
        await sleep(220);
        const diplomacyMobile = await evalJs(`(() => {
          const grid = document.querySelector('.diplo-relations-grid').getBoundingClientRect();
          const posture = document.querySelector('.diplo-postures').getBoundingClientRect();
          return { gridRight:grid.right, postureRight:posture.right,
            porticoRight:document.querySelector('.forze-portico').getBoundingClientRect().right,
            pillarsFit:[...document.querySelectorAll('.forze-pillar')].every(p=>p.scrollWidth<=p.clientWidth+2),
            gridColumns:getComputedStyle(document.querySelector('.diplo-relations-grid')).gridTemplateColumns.split(' ').length,
            postureColumns:getComputedStyle(document.querySelector('.diplo-postures__grid')).gridTemplateColumns.split(' ').length };
        })()`);
        if (diplomacyMobile.gridRight > 392 || diplomacyMobile.postureRight > 392 ||
          diplomacyMobile.gridColumns !== 1 || diplomacyMobile.postureColumns !== 1 ||
          diplomacyMobile.porticoRight > 392 || !diplomacyMobile.pillarsFit)
          problems.push('390px 外交关系或外交姿态布局溢出');
        await evalJs(`document.querySelector('.diplo-dossier')?.scrollIntoView({ block: 'start', behavior: 'instant' })`);
        await shot('03-tab-diplomazia-390.png');
        // The founded communist movement, zero, both endpoints, and gate values
        // must share one scale without changing the underlying game state.
        const pillarEdges = await evalJs(`(() => {
          const F=window.Fiume,s=F.Engine.createState('1919-09','historical',37);
          s.flags.comintern_door=true;
          Object.assign(s.forze,{fascisti:80,socialisti:-40,anarchici:0,comunisti:100,corradini:60,sindacalisti:79.5});
          const before=JSON.stringify(s),original=document.querySelector('.diplo-dossier');
          const node=F.Views.game(s,{tab:'diplomazia'},{}).querySelector('.diplo-dossier');
          window.__forzeOriginal=original; original.replaceWith(node);
          const read=id=>{const p=node.querySelector('.forze-pillar[data-force="'+id+'"]');
            return {value:p.querySelector('[role="meter"]').getAttribute('aria-valuenow'),
              height:parseFloat(p.querySelector('.forze-pillar__fill').style.height),
              bottom:parseFloat(p.querySelector('.forze-pillar__fill').style.bottom)};};
          const first=node.querySelector('.forze-pillar');first.focus();
          first.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
          return {count:node.querySelectorAll('.forze-pillar').length,negative:read('socialisti'),zero:read('anarchici'),
            maximum:read('comunisti'),atGate:node.querySelectorAll('.forze-pillar.is-at-gate').length,
            keyboard:node.querySelector('.forze-pillar[aria-pressed="true"]')?.getAttribute('data-force'),
            unchanged:JSON.stringify(s)===before,
            fits:[...node.querySelectorAll('.forze-pillar')].every(p=>p.scrollWidth<=p.clientWidth+2)};
        })()`);
        console.log('政治力量柱图边界:',JSON.stringify(pillarEdges));
        if (pillarEdges.count !== 6 || pillarEdges.negative.value !== '-40' ||
          Math.abs(pillarEdges.negative.height - 28.5714) > .01 || pillarEdges.negative.bottom !== 0 ||
          pillarEdges.zero.height !== 0 || Math.abs(pillarEdges.maximum.height - 71.4286) > .01 ||
          pillarEdges.atGate !== 2 || pillarEdges.keyboard !== 'socialisti' || !pillarEdges.unchanged || !pillarEdges.fits)
          problems.push('政治力量柱图的负值、零点、达标线、键盘选择或六派布局错误');
        await evalJs(`document.querySelector('.forze-relations')?.scrollIntoView({block:'start',behavior:'instant'})`);
        await shot('03-tab-diplomazia-six-390.png');
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1680, height: 1100, deviceScaleFactor: 1, mobile: false });
        await evalJs(`scrollTo(0,0)`);
        await sleep(150);
        await shot('03-tab-diplomazia-six.png');
        await evalJs(`(() => {document.querySelector('.diplo-dossier').replaceWith(window.__forzeOriginal);delete window.__forzeOriginal;})()`);
      }
      if (key === 'leggi') {
        const lawOverview = await evalJs(`(() => ({
          tiles: document.querySelectorAll('.law-tile').length,
          levels: document.querySelectorAll('.law-course__item').length,
          current: document.querySelectorAll('.law-course__item--current').length,
          selected: document.querySelector('.law-tile[aria-pressed="true"] .law-tile__name')?.textContent
        }))()`);
        if (lawOverview.tiles !== 11 || lawOverview.levels !== 4 || lawOverview.current !== 1 ||
          lawOverview.selected !== '选举法' ||
          await evalJs(`document.querySelectorAll('.charter-board__requirement').length`) !== 0)
          problems.push('法律目录或默认等级路径显示错误');
        await evalJs(`Array.from(document.querySelectorAll('.law-tile')).find(tile => tile.querySelector('.law-tile__name')?.textContent === '劳动保障')?.click()`);
        await sleep(150);
        const lawSelection = await evalJs(`(() => ({
            title: document.querySelector('.law-dossier h2')?.textContent,
            levels: document.querySelectorAll('.law-course__item').length,
            stances: document.querySelectorAll('.law-stance').length,
            selected: document.querySelector('.law-tile[aria-pressed="true"] .law-tile__name')?.textContent
        }))()`);
        if (lawSelection.title !== '劳动保障' || lawSelection.levels !== 4 || lawSelection.stances !== 0 || lawSelection.selected !== '劳动保障')
          problems.push('选择法律后条款档案未更新');
        await shot('03-tab-leggi-selected.png');
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: false });
        await sleep(250);
        const lawMobileOverflow = await evalJs(`document.documentElement.scrollWidth > window.innerWidth + 2`);
        if (lawMobileOverflow) problems.push('390px 法律页面有横向溢出');
        await evalJs(`document.querySelector('.laws-atlas')?.scrollIntoView({ block: 'start', behavior: 'instant' })`);
        await sleep(100);
        await shot('03-tab-leggi-390.png');
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1680, height: 1100, deviceScaleFactor: 1, mobile: false });
      }
      if (key === 'crisi') {
        const crisis = await evalJs(`(() => ({
          meters:document.querySelectorAll('.crisis-hourglass[role="meter"]').length,
          charts:document.querySelectorAll('.crisis-axis svg').length,
          oldBars:document.querySelectorAll('.crisis-axis .bar').length,
          milestones:document.querySelectorAll('.crisis-axis__milestone').length,
          next:document.querySelectorAll('.crisis-axis__next').length,
          layout:[...document.querySelectorAll('.crisis-axis')].every(axis=>{
            const glass=axis.querySelector('.crisis-hourglass').getBoundingClientRect(),
              row=axis.querySelector('.crisis-axis__title-row').getBoundingClientRect(),
              value=axis.querySelector('.crisis-axis__value').getBoundingClientRect();
            return value.top>=row.top && value.bottom<=row.bottom+1 &&
              [...axis.querySelectorAll('.crisis-axis__milestone')].every(m=>m.getBoundingClientRect().left>glass.right);
          }),
          curved:[...document.querySelectorAll('.crisis-hourglass__outline')].every(p=>p.getAttribute('d').includes('C')),
          values:[...document.querySelectorAll('.crisis-hourglass')].map(m=>({min:m.getAttribute('aria-valuemin'),max:m.getAttribute('aria-valuemax'),value:m.getAttribute('aria-valuenow')}))
        }))()`);
        if(crisis.meters!==2 || crisis.charts!==2 || crisis.oldBars!==0 || crisis.milestones!==8 ||
          crisis.next!==0 || !crisis.layout || !crisis.curved ||
          crisis.values.some(m=>m.min!=='0'||m.max!=='100')) problems.push('危机沙漏、右侧里程碑、标题读数或旧提示移除错误');
        await evalJs(`scrollTo(0,0)`);
        const clip = await evalJs(`(() => {const r=document.querySelector('.crisis-pair').getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1};})()`);
        await shot('03-crisis-hourglasses.png',clip);
        // Multiple history samples must not bring the removed sparklines back.
        // Check actual chamber areas at every milestone and both endpoints.
        let chamberArea;
        for(const pressure of [0,25,50,75,100]) {
          const edge = await evalJs(`(() => {
            const F=window.Fiume,s=F.Engine.createState('1919-09','historical',41);
            s.order.coup=${pressure};s.order.subversion=100-${pressure};
            s.series.coup=[5,10,20,${pressure}];s.series.subversion=[0,30,70,100-${pressure}];
            if(${pressure}===50)s.order.coupMilestones=['i25','i50'];
            const before=JSON.stringify(s),temp=F.Views.game(s,{tab:'crisi'},{});
            const pair=temp.querySelector('.crisis-pair');
            function area(poly){const str=poly.getAttribute('points').trim();if(!str)return 0;
              const pts=str.split(/\\s+/).map(p=>p.split(',').map(Number));
              return Math.abs(pts.reduce((sum,p,i)=>{const q=pts[(i+1)%pts.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;}
            return {unchanged:JSON.stringify(s)===before,charts:pair.querySelectorAll('svg').length,
              passed:pair.querySelectorAll('.crisis-axis__milestone.is-passed').length,
              next:pair.querySelectorAll('.crisis-axis__next').length,
              fills:[...pair.querySelectorAll('.crisis-hourglass')].map(m=>{const a=area(m.querySelector('.crisis-hourglass__sand--upper')),b=area(m.querySelector('.crisis-hourglass__sand--lower'));
                return {pressure:Number(m.getAttribute('aria-valuenow')),ratio:b/(a+b),total:a+b};})};
          })()`);
          console.log('危机沙漏边界 '+pressure+':',JSON.stringify(edge));
          if(chamberArea===undefined)chamberArea=edge.fills[0].total;
          if(!edge.unchanged || edge.charts!==2 || edge.next!==0 ||
            edge.fills.some(f=>Math.abs(f.ratio-f.pressure/100)>1e-6 || Math.abs(f.total-chamberArea)>1e-5) ||
            (pressure===50 && edge.passed!==2)) problems.push('沙漏沙量比例、历史节点或状态隔离错误：'+pressure);
        }
        // A representative pair also shows the reached milestone treatment.
        await evalJs(`(() => {
          const F=window.Fiume,s=F.Engine.createState('1919-09','historical',41);
          s.order.coup=50;s.order.subversion=75;
          s.order.coupMilestones=['i25','i50'];s.order.subversionMilestones=['s25','s50','s75'];
          window.__crisisOriginal=document.querySelector('.crisis-pair');
          window.__crisisOriginal.replaceWith(F.Views.game(s,{tab:'crisi'},{}).querySelector('.crisis-pair'));
        })()`);
        await shot('03-crisis-hourglasses-milestones.png',clip);
        await evalJs(`document.querySelector('.crisis-pair').replaceWith(window.__crisisOriginal);delete window.__crisisOriginal;`);
        await cdp.send('Emulation.setDeviceMetricsOverride', {width:390,height:900,deviceScaleFactor:1,mobile:false});
        await sleep(180);
        const mobileCrisis = await evalJs(`(() => {const pair=document.querySelector('.crisis-pair');return {
          right:pair.getBoundingClientRect().right,columns:getComputedStyle(pair).gridTemplateColumns.split(' ').length,
          fits:[...pair.querySelectorAll('.crisis-axis__instrument')].every(x=>x.scrollWidth<=x.clientWidth+2),
          layout:[...pair.querySelectorAll('.crisis-axis')].every(axis=>{
            const glass=axis.querySelector('.crisis-hourglass').getBoundingClientRect();
            return axis.querySelectorAll('.crisis-axis__milestone').length===4 &&
              [...axis.querySelectorAll('.crisis-axis__milestone')].every(m=>m.getBoundingClientRect().left>glass.right);
          })};})()`);
        if(mobileCrisis.right>392 || mobileCrisis.columns!==1 || !mobileCrisis.fits || !mobileCrisis.layout) problems.push('390px 危机沙漏或右侧里程碑布局溢出');
        await evalJs(`document.querySelector('.crisis-pair').scrollIntoView({block:'start',behavior:'instant'})`);
        await shot('03-tab-crisi-390.png');
        await cdp.send('Emulation.setDeviceMetricsOverride', {width:1680,height:1100,deviceScaleFactor:1,mobile:false});
      }
      svgInfo[key] = await evalJs(`(() => ({
        parlSeats: document.querySelectorAll('.parl__seat').length,
        mapPolys: document.querySelectorAll('g.mp').length,
        markers: document.querySelectorAll('g.mk').length,
        svgs: document.querySelectorAll('.board svg').length,
        texts: document.querySelectorAll('.col .banner').length
      }))()`);
    }
    console.log('图表:', JSON.stringify(svgInfo));
    if (!svgInfo.mappa || !svgInfo.mappa.mapPolys) problems.push('地图未渲染多边形');
    await evalJs(`(() => { const b=document.querySelector('.navbtn[data-tab="mappa"]'); if(b)b.click(); })()`);
    await sleep(200);
    const zoomBefore = await evalJs(`document.querySelector('.mapcanvas svg')?.getAttribute('viewBox')`);
    await evalJs(`document.querySelector('.mapcanvas__zoom')?.click()`);
    await sleep(150);
    const zoomCheck = await evalJs(`(() => {
      const map=document.querySelector('.mapcanvas svg');
      const context=!!document.querySelector('.mapcanvas .context-place');
      return { after:map?.getAttribute('viewBox'), context };
    })()`);
    console.log('地图缩放:', JSON.stringify(zoomCheck));
    if (!zoomBefore || zoomBefore === zoomCheck.after || !zoomCheck.context) problems.push('地图缩放或周边地名未生效');
    const periodLayers = await evalJs(`(() => {
      const view=window.Fiume.MapView;
      const first=view.render({date:{y:1919,m:9,d:12}});
      const later=view.render({date:{y:1921,m:6,d:1}});
      return {coastPoints:window.FIUME_GEO_COAST?.shoreline?.length,
        shs1919:!!first.querySelector('.context-territory--shs'),
        italy1921:!!later.querySelector('.context-territory--italy')};
    })()`);
    if (periodLayers.coastPoints < 900 || !periodLayers.shs1919 || !periodLayers.italy1921)
      problems.push('精密海岸或 1921 年卡斯塔夫控制区切换未生效');
    await evalJs(`(() => { const m=document.querySelector('.mapcanvas svg'); const r=m.getBoundingClientRect();
      m.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:-120,
        clientX:r.left+r.width*.72,clientY:r.top+r.height*.55})); })()`);
    await sleep(150);
    const wheelAfter = await evalJs(`document.querySelector('.mapcanvas svg')?.getAttribute('viewBox')`);
    if (wheelAfter === zoomCheck.after) problems.push('地图滚轮缩放未生效');
    await evalJs(`document.querySelector('g.mp[data-id="srdoci"]')?.dispatchEvent(new MouseEvent('click', { bubbles:true }))`);
    await sleep(150);
    const districtSelected = await evalJs(`document.querySelector('.district-detail')?.textContent.includes('瑟尔多齐')`);
    if (!districtSelected) problems.push('缩放后地图地区点选未生效');
    

    // 4. 推进几个月
    await evalJs(`(() => { document.querySelector('.action-trigger')?.click(); return true; })()`);
    await sleep(300);
    for (let m = 0; m < 10; m++) {
      // 出牌
      for (let k = 0; k < 4; k++) {
        const played = await evalJs(`(() => {
          const m = document.querySelector('.scrim.show .modal');
          if (m) { const o=[...m.querySelectorAll('button.opt')].find(b=>!b.disabled); if(o){o.click();return true;} }
          const t=document.querySelector('.deck:not(.is-off)');
          if(t){t.click();return 'deck';}
          const b=[...document.querySelectorAll('.slot--full .btn')].find(x=>!x.disabled);
          if(!b) return false; b.click(); return true; })()`);
        if (!played) break;
        await sleep(300);
        // Deck picker: take the first drawable card.
        await evalJs(`(() => { const r=document.querySelector('.deckrow'); if(r){r.click();return true;} return false; })()`);
        await sleep(300);
        // A multi-option card opens a second modal: pick an option.
        await evalJs(`(() => { const m=document.querySelector('.scrim.show .modal');
          if(!m) return false; const o=[...m.querySelectorAll('button.opt')].find(b=>!b.disabled);
          if(o){o.click();return true;} return false; })()`);
        await sleep(200);
      }
      // 先把事件看板 / 决策清干净
      for (let e = 0; e < 10; e++) {
        const r = await evalJs(`(() => {
          const m = document.querySelector('.scrim.show .modal');
          if (!m) return false;
          const row = m.querySelector('.evrow.is-current:not([disabled])') || m.querySelector('.evrow:not([disabled])');
          if (row) { row.click(); return 'board'; }
          const o = [...m.querySelectorAll('button.opt')].find(b => !b.disabled);
          if (o) { o.click(); return 'opt'; }
          const close = [...m.querySelectorAll('.btn')].find(b => b.textContent.trim() === '关闭');
          if (close) { close.click(); return 'close'; }
          return false;
        })()`);
        if (!r) break;
        await sleep(420);
      }
      // 再看板可能重新弹出（关闭看板后直入决策），循环清一次
      await evalJs(`(() => {
        const m = document.querySelector('.scrim.show .modal');
        if (!m) return false;
        const close = [...m.querySelectorAll('.btn')].find(b => b.textContent.trim() === '关闭');
        if (close) close.click();
        return true; })()`);
      await sleep(200);
      const advanced = await evalJs(`(() => {
        const b=[...document.querySelectorAll('.btn--primary')].find(x=>x.textContent.includes('推进到下一周'));
        if(!b||b.disabled) return 'blocked'; b.click(); return 'ok'; })()`);
      await sleep(520);
      // 解决事件
      for (let e = 0; e < 4; e++) {
        const ok = await evalJs(`(() => {
          const m=document.querySelector('.scrim.show .modal'); if(!m) return false;
          const o=[...m.querySelectorAll('button.opt')].find(b=>!b.disabled); if(!o) return false;
          o.click(); return true; })()`);
        if (!ok) break;
        await sleep(420);
      }
      if (advanced === 'blocked') break;
    }
    const g2 = await evalJs(`(() => ({
      date: (document.querySelector('.resbar__d1')||{}).textContent,
      ending: !!document.querySelector('.ending__t'),
      endingTitle: (document.querySelector('.ending__t')||{}).textContent || null,
      traffic: window.Fiume.Sel.Save.load('auto')?.economy?.traffic ?? null,
      coup: window.Fiume.Sel.Save.load('auto')?.order?.coup ?? null,
      logLines: document.querySelectorAll('.logline').length
    }))()`);
    console.log('推进后:', JSON.stringify(g2));
    await shot('04-advanced.png');

    // React settings and save manager must remain interactive after the migration.
    const settingsOpened = await evalJs(`(() => { const b=document.querySelector('.resbar__motto button:last-child'); if (!b) return false; b.click(); return true; })()`);
    await sleep(120);
    const savesOpened = await evalJs(`(() => { const b=[...document.querySelectorAll('.setbtn')].find(x=>x.textContent.includes('存档')); if (!b) return false; b.click(); return true; })()`);
    await sleep(120);
    const saved = await evalJs(`(() => { const b=document.querySelector('.save-list .opt:nth-child(2) button:first-child'); if (!b) return false; b.click(); return true; })()`);
    await sleep(120);
    const loaded = await evalJs(`(() => { const b=document.querySelector('.save-list .opt:nth-child(2) button:nth-child(2)'); if (!b || b.disabled) return false; b.click(); return true; })()`);
    const saveFlow = settingsOpened && savesOpened && saved && loaded ? 'ok' : 'failed';
    console.log('设置与存档:', saveFlow);
    if (saveFlow !== 'ok') problems.push('SAVE FLOW: ' + saveFlow);
    await sleep(400);

    // 5. 打开"关于"
    await evalJs(`(() => { const b=[...document.querySelectorAll('.btn')].find(x=>x.textContent.trim()==='关于'); if(b) b.click(); return !!b; })()`);
    await sleep(500);
    await shot('05-about.png');
    await evalJs(`(() => { const b=[...document.querySelectorAll('.btn')].find(x=>x.textContent.trim()==='关闭'); if(b) b.click(); return !!b; })()`);
    await sleep(300);

    // 6. 跑到结局（快速模式只验证前述关键交互）
    if (!process.env.FIUME_VERIFY_QUICK) {
    let reachedEnding = false;
    for (let m = 0; m < 270; m++) {
      const isEnd = await evalJs(`!!document.querySelector('.ending__t')`);
      if (isEnd) { reachedEnding = true; break; }
      for (let k = 0; k < 4; k++) {
        const played = await evalJs(`(() => {
          const m = document.querySelector('.scrim.show .modal');
          if (m) { const o=[...m.querySelectorAll('button.opt')].find(b=>!b.disabled); if(o){o.click();return true;} }
          const t=document.querySelector('.deck:not(.is-off)');
          if(t){t.click();return 'deck';}
          const b=[...document.querySelectorAll('.slot--full .btn')].find(x=>!x.disabled);
          if(!b) return false; b.click(); return true; })()`);
        if (!played) break;
        await sleep(220);
        await evalJs(`(() => { const r=document.querySelector('.deckrow'); if(r){r.click();return true;} return false; })()`);
        await sleep(200);
        await evalJs(`(() => { const m=document.querySelector('.scrim.show .modal');
          if(!m) return false; const o=[...m.querySelectorAll('button.opt')].find(b=>!b.disabled);
          if(o){o.click();return true;} return false; })()`);
        await sleep(140);
      }
      // 清事件看板 / 决策
      for (let e = 0; e < 4; e++) {
        const r = await evalJs(`(() => {
          const m = document.querySelector('.scrim.show .modal');
          if (!m) return false;
          const row = m.querySelector('.evrow.is-current:not([disabled])') || m.querySelector('.evrow:not([disabled])');
          if (row) { row.click(); return 'board'; }
          const o = [...m.querySelectorAll('button.opt')].find(b => !b.disabled);
          if (o) { o.click(); return 'opt'; }
          const close = [...m.querySelectorAll('.btn')].find(b => b.textContent.trim() === '关闭');
          if (close) { close.click(); return 'close'; }
          return false;
        })()`);
        if (!r) break;
        await sleep(300);
      }
      await evalJs(`(() => {
        const b=[...document.querySelectorAll('.btn--primary')].find(x=>x.textContent.includes('推进到下一周'));
        if(b&&!b.disabled) b.click(); return true; })()`);
      await sleep(240);
      for (let e = 0; e < 5; e++) {
        const ok = await evalJs(`(() => {
          const m=document.querySelector('.scrim.show .modal'); if(!m) return false;
          const o=[...m.querySelectorAll('button.opt')].find(b=>!b.disabled); if(!o) return false;
          o.click(); return true; })()`);
        if (!ok) break;
        await sleep(200);
      }
    }
    const g3 = await evalJs(`(() => ({
      ending: !!document.querySelector('.ending__t'),
      title: (document.querySelector('.ending__t')||{}).textContent || null,
      tag: (document.querySelector('.ending__tag')||{}).textContent || null,
      turn: window.Fiume.Sel.Save.load('auto')?.turn ?? null,
      date: (() => { const d=window.Fiume.Sel.Save.load('auto')?.date; return d ? d.y+'-'+d.m : null; })()
    }))()`);
    console.log('结局:', JSON.stringify(g3));
    if (g3.ending) { await shot('06-ending.png'); reachedEnding = true; }
    if (!reachedEnding) problems.push('270 周后仍未到达结局');
    }

    cdp.close();
  } catch (e) {
    problems.push('HARNESS: ' + e.message);
    console.error(e);
  } finally {
    try { chrome.kill(); } catch (e) {}
    try { preview.kill(); } catch (e) {}
    await sleep(400);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  }

  console.log('\n=== 问题清单 ===');
  if (!problems.length) console.log('无控制台错误 / 异常 ✓');
  else problems.slice(0, 40).forEach(p => console.log(' · ' + p));
  console.log('截图目录: ' + OUT);
  process.exit(problems.length ? 1 : 0);
})();
