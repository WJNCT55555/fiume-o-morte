/* ==========================================================================
   国际化接口
   ---------------------------------------------------------------------------
   当前只发布中文（zh）。所有面向玩家的文本已经过两种通道分离：

   1) 界面骨架字符串（导航、面板标题、按钮、标签）
      → 本文件的 I18N.STRINGS 表。新增语言时在这里补一列即可。

   2) 游戏内容（事件、卡牌、法律、结局、顾问、地区、阶层、党派……）
      → data/*.js 中每个文本节点本身就是 { zh, it } 结构，
        由 Core.L(node) 按当前语言取值。it 同时充当历史语境的第二语言栏位。
        新增语言时给这些节点加一个键（如 en: '...'）即可，缺键自动回退到 zh。

   用法：
     I18N.t('nav.mappa')            → 界面字符串
     I18N.L(card.name)              → 内容节点
     I18N.setLang('it')             → 切换（当前只登记了 zh 为启用）
   ========================================================================== */
(function (root, factory) {
  var mod = factory(root.Fiume.Core);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.I18N = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';

  var I = {};

  /* Registered languages. enabled=false entries are placeholders; switching is ignored. */
  I.LANGS = [
    { id: 'zh', label: '中文', native: '中文', enabled: true },
    { id: 'it', label: '意大利语', native: 'Italiano', enabled: false },
    { id: 'en', label: '英语', native: 'English', enabled: false }
  ];
  I.lang = 'zh';
  I.fallback = 'zh';

  /* ---------------- UI chrome strings ---------------- */
  I.STRINGS = {
    /* Masthead and resource bar */
    'app.title':        { zh: 'FIUME O MORTE!', it: 'FIUME O MORTE!' },
    'app.motto':        { zh: 'QVIS CONTRA NOS?', it: 'QVIS CONTRA NOS?' },
    'bar.era':          { zh: '事业', it: 'dell\'Impresa' },
    'bar.anndi':        { zh: '第 {n} 年', it: 'Anno {n}' },
    'bar.allarme':      { zh: '行动力', it: 'PA' },
    'bar.armi':         { zh: '军械', it: 'Armi' },
    'bar.iscritti':     { zh: '党员', it: 'Iscritti' },
    'bar.memento':      { zh: 'MEMENTO AVDERE SEMPER', it: 'MEMENTO AVDERE SEMPER' },

    /* Navigation */
    'nav.mappa':        { zh: '地图', it: 'Mappa' },
    'nav.economia':     { zh: '经济', it: 'Economia' },
    'nav.azioni':       { zh: '行动', it: 'Azioni' },
    'nav.assemblea':    { zh: '议会', it: 'Assemblea' },
    'nav.diplomazia':   { zh: '外交', it: 'Diplomazia' },
    'nav.leggi':        { zh: '法律', it: 'Leggi' },
    'nav.crisi':        { zh: '事态', it: 'Crisi' },
    'nav.mappa.it':     { zh: 'Mappa', it: 'Mappa' },
    'nav.economia.it':  { zh: 'Economia', it: 'Economia' },
    'nav.azioni.it':    { zh: 'Azioni', it: 'Azioni' },
    'nav.assemblea.it': { zh: 'Assemblea', it: 'Assemblea' },
    'nav.diplomazia.it':{ zh: 'Diplomazia', it: 'Diplomazia' },
    'nav.leggi.it':     { zh: 'Leggi', it: 'Leggi' },
    'nav.crisi.it':     { zh: 'Crisi', it: 'Crisi' },

    /* Left column */
    'set.open':         { zh: '设置', it: 'Impostazioni' },
    'set.title':        { zh: '游戏设置', it: 'Impostazioni' },
    'set.music':        { zh: '音乐设置', it: 'Radio Clandestina' },
    'set.music.soon':   { zh: '暂未开放', it: 'Non disponibile' },
    'set.ach':          { zh: '查看成就', it: 'Obiettivi' },
    'set.lang':         { zh: '语言', it: 'Lingua' },
    'set.lang.soon':    { zh: '即将推出', it: 'Prossimamente' },
    'set.save':         { zh: '存档管理', it: 'Gestione archivi' },
    'set.ach.title':    { zh: '成就', it: 'Obiettivi' },
    'set.ach.sub':      { zh: '已解锁 {a} / {b}', it: 'Sbloccati {a} / {b}' },
    'set.ach.locked':   { zh: '未解锁', it: 'Bloccato' },
    'set.ach.unlocked': { zh: '已解锁', it: 'Sbloccato' },
    'set.ach.none':     { zh: '本局尚未解锁任何成就。', it: 'Nessun obiettivo sbloccato in questa partita.' },
    'side.consenso':    { zh: '政党支持率', it: 'Consenso partitico' },
    'side.classi':      { zh: '阶层民意', it: 'Classi sociali' },
    'cls.turnout':      { zh: '投票', it: 'affluenza' },
    'evboard.short':    { zh: '事件看板', it: 'TABELLONE' },
    'evboard.open':     { zh: '打开事件看板', it: 'Aprire il tabellone degli eventi' },
    'evboard.title':    { zh: '事件看板', it: 'Event Board' },
    'evboard.sub':      { zh: '本周发生了以下事件，请逐一处理。', it: 'Questi sono gli eventi della settimana. Risolverli uno per uno.' },
    'evboard.empty':    { zh: '本周没有事件。可以继续打出手牌，或推进到下一周。', it: 'Nessun evento questa settimana.' },
    'evboard.view':     { zh: '查看', it: 'VEDI' },
    'evboard.tag.current': { zh: '待决', it: 'IN CORSO' },
    'evboard.tag.queued':  { zh: '排队', it: 'IN CODA' },
    'evboard.tag.done':    { zh: '已处理', it: 'RISOLTO' },
    'evboard.title.bar':   { zh: '事件与决策', it: 'Eventi e Decisioni' },
    'cmd.title':        { zh: '加布里埃莱·邓南遮', it: 'Gabriele D\'Annunzio' },
    'cmd.sub':          { zh: '指挥官 · 卡尔纳罗摄政', it: 'Il Comandante · Reggenza del Carnaro' },
    'cmd.quote':        { zh: '「这里发生的是历史，而不是被忍受的历史。」', it: '"Qui si fa la storia, non la si subisce."' },
    'cmd.ap':           { zh: '行动力 AP', it: 'Punti Azione' },
    'cmd.armi':         { zh: '军械', it: 'Armi' },
    'cmd.iscritti':     { zh: '党员', it: 'Iscritti' },
    'cmd.legittimita':  { zh: '军团民意', it: 'Legittimità' },
    'cmd.dissenso':     { zh: '党内整体异议', it: 'Dissenso complessivo' },
    'ideologia.title':  { zh: '派系', it: 'Correnti' },
    'ideologia.sub':    { zh: '派系', it: 'Correnti' },
    'ideologia.diss':   { zh: '整体异议', it: 'Dissenso' },
    'ideologia.unity':  { zh: '统一行动', it: 'Azione unitaria' },
    'ideologia.inf':    { zh: '影响力', it: 'Influenza' },
    'ideologia.dis':    { zh: '异议度', it: 'Dissenso' },
    'gab.title':        { zh: '执政官会议', it: 'Consiglio dei Rettori' },
    'gab.sub':          { zh: '内阁', it: 'Gabinetto' },
    'spirito.title':    { zh: '国家精神', it: 'Spirito Nazionale' },
    'spirito.sub':      { zh: '生效中的修正', it: 'Effetti' },

    /* Shared buttons and labels */
    'btn.save':         { zh: '存档', it: 'Archivio' },
    'btn.about':        { zh: '史料', it: 'Fonti' },
    'btn.start':        { zh: '接受指挥', it: 'Assumere il comando' },
    'btn.start.party':  { zh: '开始游戏', it: 'Iniziare la partita' },
    'btn.restart':      { zh: '重新开始', it: 'Ricominciare' },
    'btn.close':        { zh: '关闭', it: 'Chiudere' },
    'btn.play':         { zh: '执行', it: 'Eseguire' },
    'btn.hire':         { zh: '任命', it: 'Nominare' },
    'btn.fire':         { zh: '免职', it: 'Revocare' },
    'btn.next':         { zh: '推进到下一周 ▸', it: 'Settimana successiva ▸' },
    'btn.write':        { zh: '写入', it: 'Salvare' },
    'btn.load':         { zh: '载入', it: 'Caricare' },
    'btn.locked':       { zh: '条件未满足', it: 'Condizioni non soddisfatte' },

    /* Right column */
    'ev.title':         { zh: '事件与决策', it: 'Eventi e Decisioni' },
    'ev.sub':           { zh: '决策', it: 'Decisione' },
    'ev.supreme':       { zh: '最高命令', it: 'Ordine supremo' },
    'ev.hint':          { zh: '新一周有事件时，事件看板会自动弹出。', it: 'Il tabellone si apre quando iniziano nuovi eventi.' },
    'ev.none':          { zh: '没有待决事项', it: 'Nessun ordine del giorno' },
    'ev.none.body':     { zh: '本周的事件已经处理完。你可以继续打出手牌，或推进到下一周。', it: 'Gli eventi della settimana sono esauriti. Puoi giocare altre carte o passare alla settimana successiva.' },
    'ev.last':          { zh: '最近一条', it: 'Ultimo fatto' },
    'ev.conseq':        { zh: '预期后果', it: 'Conseguenze previste' },
    'ev.nofree':        { zh: '每个选项都会写入状态，没有免费的选择。', it: 'Ogni scelta scrive nello stato: nessuna è gratuita.' },
    'adv.title':        { zh: '顾问', it: 'Consiglieri' },
    'adv.sub':          { zh: '幕僚', it: 'Consiglio' },
    'adv.seated':       { zh: '在任 {a} / {b}', it: 'In carica {a} / {b}' },
    'adv.cooldown':     { zh: '顾问行动冷却 {n} 月', it: 'Raffreddamento {n} mesi' },
    'adv.cooling':      { zh: '冷却 {n} 月', it: 'Raffreddamento {n} mesi' },
    'adv.dissent':      { zh: '异议 {n}', it: 'Dissenso {n}' },
    'dia.title':        { zh: '日志', it: 'Diari' },
    'dia.sub':          { zh: '跨月目标', it: 'Obiettivi' },
    'dia.empty':        { zh: '尚无进行中的日志。', it: 'Nessun diario attivo.' },
    'dia.done':         { zh: '完成', it: 'completato' },
    'dia.failed':       { zh: '失败', it: 'fallito' },
    'dia.months':       { zh: '{n} 月', it: '{n} mesi' },
    'reg.title':        { zh: '行政记录', it: 'Registro' },
    'reg.sub':          { zh: '大事记', it: 'Cronaca' },
    'reg.empty':        { zh: '本周尚无记录。', it: 'Nessuna voce questa settimana.' },

    /* Map */
    'map.title':        { zh: 'CARTA DI FIUME', it: 'CARTA DI FIUME' },
    'map.quote':        { zh: '「这里发生的是历史，而不是被忍受的历史。」', it: '"Qui si fa la storia, non la si subisce."' },
    'map.siege':        { zh: '事态 {n}', it: 'Assedio {n}' },
    'map.milizia':      { zh: '军团 {n}', it: 'Milizia {n}' },
    'map.pressione':    { zh: '外交压力 {n}', it: 'Pressione {n}' },
    'terr.title':       { zh: '领土', it: 'Territorio' },
    'terr.sub':         { zh: '控制与动荡', it: 'Controllo e agitazione' },
    'terr.control':     { zh: '控制', it: 'Controllo' },
    'terr.agit':        { zh: '动荡', it: 'Agitazione' },

    /* Economy */
    'eco.title':        { zh: '经济', it: 'Economia' },
    'eco.sub':          { zh: '港口与财政', it: 'Porto e finanze' },
    'eco.traffic':      { zh: '港口吞吐指数 · 1913 = 100', it: 'Indice del porto · 1913 = 100' },
    'eco.hinterland':   { zh: '腹地通达', it: 'Entroterra' },
    'eco.delta':        { zh: '三角洲控制', it: 'Delta' },
    'eco.works':        { zh: '港口工程', it: 'Opere portuali' },
    'eco.recognition':  { zh: '国际承认', it: 'Riconoscimento' },
    'eco.strike':       { zh: '罢工强度', it: 'Scioperi' },
    'eco.confidence':   { zh: '资本信心', it: 'Fiducia' },
    'eco.revenue':      { zh: '月度收入', it: 'Entrate mensili' },
    'eco.spending':     { zh: '月度支出', it: 'Spese mensili' },
    'eco.legion':       { zh: '军团军饷', it: 'Paga della Legione' },
    'eco.net':          { zh: '月度结余', it: 'Saldo mensile' },
    'eco.debt':         { zh: '债务 / 欠款', it: 'Debito / arretrati' },
    'eco.pop':          { zh: '人口', it: 'Popolazione' },
    'eco.unemp':        { zh: '失业 / 通胀', it: 'Disoccupazione / inflazione' },
    'eco.consenso':     { zh: '全国支持', it: 'Consenso nazionale' },
    'eco.classi':       { zh: '社会阶层', it: 'Classi Sociali' },
    'eco.weight':       { zh: '权重', it: 'peso' },
    'cls.title':        { zh: '阶层支持度', it: 'Consenso per classe sociale' },
    'cls.sub':          { zh: '矩阵 · 投票率 · 组织渗透', it: 'Matrice · affluenza · penetrazione' },
    'eco.tax':          { zh: '税务结构（月度）', it: 'Struttura fiscale' },
    'eco.tax.porto':    { zh: '港口费与仓储费', it: 'Tasse portuali' },
    'eco.tax.dogana':   { zh: '关税与转口税', it: 'Dazi e transito' },
    'eco.tax.consumo':  { zh: '消费税', it: 'Imposte di consumo' },
    'eco.tax.reddito':  { zh: '所得税（需立法）', it: 'Imposta sul reddito' },

    /* Actions */
    'card.choose':      { zh: '选择（{n}）', it: 'Scegliere ({n})' },
    'card.cost.hint':   { zh: '选择后才会扣除成本并弃置这张卡。', it: 'Il costo si paga solo dopo la scelta.' },
    'btn.back':         { zh: '返回', it: 'Indietro' },
    'deck.slots':       { zh: '预留处 {a} / {b}', it: 'Riserva {a} / {b}' },
    'deck.empty':       { zh: '空', it: 'vuoto' },
    'deck.draw':        { zh: '抽卡', it: 'Pescare' },
    'deck.pick':        { zh: '从{name}中选一张放入预留处', it: 'Scegliere una carta dal {name}' },
    'deck.full':        { zh: '预留处已满。先打出一张或弃掉一张。', it: 'Riserva piena: giocare o scartare una carta.' },
    'deck.none':        { zh: '这个牌库里暂时没有可抽的卡。', it: 'Nessuna carta pescabile in questo mazzo.' },
    'deck.discard':     { zh: '弃掉', it: 'Scartare' },
    'deck.slot':        { zh: '预留处 {n}', it: 'Slot {n}' },
    'nav.locked':       { zh: '本月事件未决，先到「事件」栏处理', it: 'Evento in sospeso: passare a Eventi' },
    'adv.title':        { zh: '顾问团', it: 'Consiglieri' },
    'adv.deck':         { zh: '顾问牌库', it: 'Mazzo consiglieri' },
    'adv.empty':        { zh: '空位', it: 'vacante' },
    'adv.none':         { zh: '暂时没有可延揽的人。', it: 'Nessun consigliere disponibile.' },
    'adv.full':         { zh: '顾问团已满', it: 'Consiglio al completo' },
    'adv.pick':         { zh: '选任', it: 'Scegliere' },
    'adv.act':          { zh: '听取建议', it: 'Consultare' },
    'adv.wait':         { zh: '冷却 {n}', it: 'attesa {n}' },
    'adv.fire':         { zh: '免职', it: 'Congedare' },
    'adv.diss':         { zh: '异议', it: 'dissenso' },
    'ev.pending':       { zh: '本月有一项待决事件', it: 'Una decisione in sospeso' },
    'btn.decide':       { zh: '现在决定', it: 'Decidere ora' },
    'az.title':         { zh: '行动', it: 'Azioni' },
    'az.sub':           { zh: '手牌 {h} / {m} · 行动力 {a}', it: 'Mano {h} / {m} · PA {a}' },
    'az.empty':         { zh: '手上没有可用的卡牌。下周可重新抽取。', it: 'Nessuna carta in mano. La prossima settimana potrai pescarne altre.' },
    'az.deck.azione':   { zh: '行动卡', it: 'Azione' },
    'az.deck.governo':  { zh: '政府卡', it: 'Governo' },
    'az.deck.partito':  { zh: '党卡', it: 'Partito' },
    'az.cost.ap':       { zh: '行动力 {n}', it: 'PA {n}' },
    'az.cost.armi':     { zh: '军械 {n}', it: 'Armi {n}' },
    'rep.title':        { zh: '局势简报', it: 'Rapporto della situazione' },
    'rep.sub':          { zh: '局势', it: 'Situazione' },

    /* Assembly */
    'parl.title':       { zh: '制宪议会', it: 'Assemblea Costituente' },
    'parl.seats':       { zh: '{n} 席 · 多数 {m}', it: '{n} seggi · maggioranza {m}' },
    'parl.notyet':      { zh: '尚未选举', it: 'Non ancora eletta' },
    'parl.none':        { zh: '在制宪议会成立之前，摄政由指挥官与七位执政官治理。《卡尔纳罗宪章》规定的两个议会——最优者议会与临时者议会——尚未召开。1921 年 4 月 24 日将举行制宪议会选举。', it: 'Prima della Costituente la Reggenza è governata dal Comandante e da sette Rettori. I due consigli previsti dalla Carta non sono ancora convocati. Le elezioni si terranno il 24 aprile 1921.' },
    'parl.rule':        { zh: '1921 年 4 月 24 日选举法（第 1100 号）：城区 68 席（51 多数 + 17 少数），子市镇 8 席（6 多数 + 2 少数）。多数派席位由得票第一的名单通吃。', it: 'Legge elettorale del 24 aprile 1921 (n. 1100): 68 seggi in città (51 di maggioranza, 17 di minoranza), 8 nei sottocomuni (6 e 2). Chi arriva primo prende i seggi di maggioranza.' },
    'parl.alone':       { zh: '（军团兵单独参选。）', it: ' (Lista legionaria da sola.)' },
    'parl.boycott':     { zh: '（军团兵抵制了这场选举。）', it: ' (I legionari hanno boicottato le elezioni.)' },
    'parl.count':       { zh: '最近一次计票', it: 'Ultimo spoglio' },
    'parl.city':        { zh: '城区', it: 'Città' },
    'parl.sub':         { zh: '子市镇', it: 'Sottocomuni' },
    'parl.list':        { zh: '名单', it: 'Lista' },

    /* Diplomacy / laws / crisis */
    'dip.title':        { zh: '外交关系', it: 'Relazioni internazionali' },
    'dip.sub':          { zh: '列强', it: 'Potenze' },
    'dip.posture':      { zh: '外交姿态', it: 'Postura' },
    'dip.posture.sub':  { zh: '取向', it: 'Orientamento' },
    'dip.actors':       { zh: '主要对手', it: 'Interlocutori' },
    'dip.actors.sub':   { zh: '备注', it: 'Note' },
    'leg.title':        { zh: '法律与政策', it: 'Leggi' },
    'leg.sub':          { zh: '制度', it: 'Ordinamento' },
    'leg.level':        { zh: '等级 {a} / {b}', it: 'Livello {a} / {b}' },
    'leg.note':         { zh: '法律满意度 ≠ 支持率：让某个党满意某项法律，不会自动把满意的人口变成执政党的支持者。等级由事件、政府卡与议会决定。', it: 'La soddisfazione legislativa non è consenso elettorale.' },
    'cri.title':        { zh: '事态', it: 'Stato della Reggenza' },
    'cri.sub':          { zh: '危机', it: 'Crisi' },
    'cri.authority':    { zh: '摄政领袖权威', it: 'Autorità' },
    'cri.garrison':     { zh: '意大利军队立场', it: 'Presidio italiano' },
    'cri.fervour':      { zh: '民众热忱', it: 'Fervore' },
    'cri.squadre':      { zh: '法西斯暴力', it: 'Squadre fasciste' },
    'cri.violence':     { zh: '政治暴力', it: 'Violenza politica' },
    'cri.coup':         { zh: '事态累积', it: 'Accumulo' },
    'cri.milestones':   { zh: '里程碑', it: 'Tappe' },
    'cri.passed':       { zh: '已过', it: 'superata' },
    'cri.future':       { zh: '未至', it: 'non ancora' },
    'cri.trend':        { zh: '事态累积趋势', it: 'Andamento dell\'accumulo' },
    'cri.forze':        { zh: '力量对比', it: 'Forze in campo' },
    'cri.forze.sub':    { zh: '秩序', it: 'Ordine' },
    'cri.tend':         { zh: '趋势', it: 'Tendenze' },
    'cri.tl':           { zh: '史实时间轴', it: 'Cronologia' },
    'cri.unemp':        { zh: '失业率', it: 'Disoccupazione' },
    'cri.pop':          { zh: '人口', it: 'Popolazione' },
    'cri.prod':         { zh: '工业生产', it: 'Produzione industriale' },
    'cri.press':        { zh: '外交压力', it: 'Pressione diplomatica' },

    /* Ticker */
    'tick.title':       { zh: 'IL NOTIZIARIO DI FIUME', it: 'IL NOTIZIARIO DI FIUME' },

    /* Start screen */
    'start.body':       { zh: '1919年9月，卡车碾过脆弱的边境，哨兵在狂乱的战吼前垂下枪口。成千上万名市民涌上石阶、亲吻军团的披风与匕首时，旧时代的钟声彻底停摆。但狂醉之下，绞索正一寸寸收紧封锁——危机、背叛从未停歇；面包与自由也不会从欢呼中诞生，握紧枪和诗的韵脚，我们只有两个选择——阜姆！或死亡！ ', it: 'Il 12 settembre 1919 entri a Fiume con duemilacinquecento legionari da Ronchi. Un anno dopo, dal balcone del Palazzo, promulghi la Carta del Carnaro e proclami la città Stato indipendente.' },
    'start.body.aut':   { zh: '1919 年 9 月，邓南遮的军团进入阜姆。你领导自治党，主张由阜姆人决定自己的制度与归属。军团控制着政府，你要争取街区、议会和国际社会的支持。', it: 'Nel settembre 1919 la Legione entra a Fiume. Guidi il Partito Autonomo: il futuro della città deve essere deciso dai fiumani.' },
    'start.body.psi':   { zh: '1919 年 9 月，军团进入阜姆。你领导社会党，港口与工厂的劳动者正在承受封锁、失业和街头暴力。你要组织他们，并决定如何面对军团、自治派与意大利。', it: 'Nel settembre 1919 la Legione entra a Fiume. Guidi i socialisti tra il porto e le fabbriche, sotto il blocco e la violenza.' },
    'start.force':      { zh: '政治力量', it: 'Forze politiche' },
    'start.leader':     { zh: '政治领袖', it: 'Il condottiero' },
    'start.portraitPending': { zh: '人物肖像待考', it: 'Ritratto da verificare' },
    'start.normal.party': { zh: '事件按条件触发，日期不再强制；争取扩大本党的影响。', it: 'Gli eventi seguono le condizioni, non date obbligatorie.' },
    'start.locked':     { zh: '暂未开放', it: 'Non disponibile' },
    'start.legion':     { zh: '军团', it: 'Legione' },
    'start.legion.desc': { zh: '邓南遮与阜姆军团', it: 'D’Annunzio e la Legione Fiumana' },
    'start.scenario':   { zh: '剧本', it: 'Scenario' },
    'start.difficulty': { zh: '难度选择', it: 'Scelta della modalità' },
    'start.only':       { zh: '唯一可选', it: 'Unica fazione disponibile' },
    'start.caption':    { zh: '1920 年 9 月 8 日，省督府阳台前：卡尔纳罗摄政宣告成立', it: '8 settembre 1920: proclamazione della Reggenza' },

    /* Ending */
    'end.stats':        { zh: '本局统计', it: 'Statistiche' },
    'end.ach':          { zh: '成就', it: 'Obiettivi' },
    'end.noach':        { zh: '本局没有解锁任何成就。', it: 'Nessun obiettivo raggiunto.' },
    'end.seats':        { zh: '军团兵席位', it: 'Seggi legionari' },
    'end.journals':     { zh: '日志完成', it: 'Diari completati' },
    'end.turn':         { zh: '第 {n} 周', it: 'Settimana {n}' },

    /* Modals */
    'mod.about':        { zh: '史料与致谢', it: 'Fonti e crediti' },
    'mod.about.sub':    { zh: '来源与致谢', it: 'Fonti e crediti' },
    'mod.save':         { zh: '存档', it: 'Archivio' },
    'mod.save.sub':     { zh: '档案', it: 'Archivio' },
    'mod.autosave':     { zh: '自动存档', it: 'Salvataggio automatico' },
    'mod.slot':         { zh: '存档位 {n}', it: 'Slot {n}' },
    'mod.empty':        { zh: '空', it: 'vuoto' },
    'mod.resume':       { zh: '发现自动存档', it: 'Partita salvata' },
    'mod.resume.body':  { zh: '检测到一份自动存档：{d}（第 {t} 周）。是否继续？', it: 'Trovato un salvataggio: {d} (settimana {t}). Continuare?' },
    'mod.continue':     { zh: '继续', it: 'Continuare' },
    'mod.fresh':        { zh: '重新开始', it: 'Ricominciare' },

    /* Toasts */
    'toast.start':      { zh: '1919 年 9 月：军团兵进入阜姆。', it: 'Settembre 1919: i legionari entrano a Fiume.' },
    'toast.start.party': { zh: '1919 年 9 月：{name}进入阜姆政治舞台。', it: 'Settembre 1919: {name} entra nella politica fiumana.' },
    'toast.saved':      { zh: '已写入存档位 {n}', it: 'Salvato nello slot {n}' },
    'toast.autosaved':  { zh: '已写入自动存档', it: 'Salvato automaticamente' },
    'toast.loaded':     { zh: '存档已载入：{d}', it: 'Partita caricata: {d}' },
    'toast.emptyslot':  { zh: '该存档位为空', it: 'Slot vuoto' },
    'err.needap':       { zh: '行动力不足', it: 'PA insufficienti' },
    'err.needfunds':    { zh: '经费不足', it: 'Cassa insufficiente' },
    'err.needarms':     { zh: '军械不足', it: 'Armi insufficienti' },
    'err.needministry': { zh: '未掌握部委：{m}', it: 'Ministero non controllato: {m}' },
    'err.needcond':     { zh: '条件不满足', it: 'Condizioni non soddisfatte' },
    'err.only3':        { zh: '最多三位在任顾问', it: 'Massimo tre consiglieri' },
    'err.advisordis':   { zh: '该派系异议过高，顾问拒绝行动', it: 'Il consigliere rifiuta: dissenso di corrente troppo alto' },
    'err.eventsfirst':  { zh: '必须先处理当前事件', it: 'Risolvere prima l\'evento' }
  };

  /* ---------------- Lookup ---------------- */

  /** UI string. Supports {name} placeholder substitution. */
  I.t = function (key, vars) {
    var e = I.STRINGS[key];
    var s = e ? (e[I.lang] || e[I.fallback] || '') : key;
    if (vars) {
      for (var k in vars) if (Object.prototype.hasOwnProperty.call(vars, k)) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      }
    }
    return s;
  };

  /** Content node ({zh, it, ...} or a plain string) */
  I.L = function (node) { return Core.L(node, I.lang); };

  I.setLang = function (id) {
    var found = null;
    I.LANGS.forEach(function (l) { if (l.id === id) found = l; });
    if (!found || !found.enabled) return false;
    I.lang = id;
    Core.lang = id;
    return true;
  };

  I.enabled = function () {
    return I.LANGS.filter(function (l) { return l.enabled; });
  };

  /* Keep Core in sync with the initial language */
  Core.lang = I.lang;

  return I;
});
