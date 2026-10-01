/* ==========================================================================
   内容层 · 世界常量
   阶层 / 组织 / 工会 / 所有权 / 法律与立场 / 执政官 / 地区 / 地标 / 资源栏 /
   城内驻点 / 时间轴 / 难度 / 剧本
   政党与选举名单见 data/parties.js；派系见 data/factions.js；顾问见 advisors/。
   ========================================================================== */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.World = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var W = {};

  W.PLAYER = {
    id: 'LEG',
    name: { it: 'Reggenza Italiana del Carnaro', zh: '意大利卡尔纳罗摄政' },
    leader: { it: 'Gabriele D\'Annunzio', zh: '加布里埃莱·邓南遮' },
    title: { it: 'Il Comandante', zh: '指挥官' },
    motto: 'Fiume o morte!',
    cry: 'QVIS CONTRA NOS?'
  };
  W.START = { y: 1919, m: 9 };
  W.MAX_END = { y: 1927, m: 12 };

  /* ======================= 1. Social classes ======================= */
  W.CLASSES = [
    { id: 'portuali', pop: 16, zh: '码头劳工', it: 'Operai del porto',        city: 0.94, note: '装卸、码头、驳船；联合工位（Sedi Riunite）的核心，对军团兵冷淡'  },
    { id: 'operai', pop: 23, zh: '产业工人', it: 'Operai industriali',      city: 0.60, note: 'Whitehead 鱼雷厂、造船厂、炼油厂、烟草厂'  },
    { id: 'artigiani', pop: 13, zh: '手工业者与小店主', it: 'Artigiani e bottegai',    city: 0.88, note: '城区小市民层：被军团兵的排场吸引，也被他们的暴力吓到'  },
    { id: 'borghesia', pop: 14, zh: '有产精英', it: 'Ceto possidente', city: 0.92, note: '航运、保险、律师、医生；多数是自治党的人'  },
    { id: 'impiegati', pop: 10, zh: '知识分子', it: 'Intellettuali', city: 0.90, note: '港务局、银行、学校、报馆'  },
    { id: 'contadini', pop: 15, zh: '斯拉夫农民', it: 'Contadini croati', city: 0.15, note: 'Plasse / Cosala / Drenova 等近郊与西部乡村，自治党的票仓' },
    { id: 'regnicoli', pop: 9, zh: '意大利侨民', it: 'Regnicoli', city: 0.95, note: '1918 年后自意大利本土迁入；军团兵的社会基础' }
  ];

    /* ======================= 16. Card decks ======================= */
  /* Three decks occupy the reserved slots in the action panel. Clicking a deck
     opens a picker of its drawable cards; the chosen card fills a free slot.
     Playing it from the slot spends AP and frees the slot again. */
  W.DECKS = [
    { id: 'azione', zh: '行动牌库', it: 'Mazzo Azione', icon: 'fasces', color: '#C9A227',
      blurb: { zh: '组织、街头、宣传与劳动层面的操作。', it: 'Organizzazione, strada, propaganda, lavoro.' } },
    { id: 'governo', zh: '政府牌库', it: 'Mazzo Governo', icon: 'column', color: '#8A7A2E',
      blurb: { zh: '立法、外交、财政与制度冲突；需要对应的执政官席位。', it: 'Leggi, diplomazia, finanze: richiede il seggio corrispondente.' } }
  ];

  /* ======================= 6. Resource bar ======================= */
  /* The active values in the resource strip. ids are read by
     S.resources and Eng.resourceSnapshot. */
  W.RESOURCES = [
    { id: 'tesoro',      zh: '金库',     it: 'Tesoro',                icon: 'coins' },
    { id: 'legittimita', zh: '军团民意', it: 'Opinione sulla Legione', icon: 'legittimita' },
    { id: 'fervore',     zh: '民众热忱', it: 'Fervore Popolare',      icon: 'flame' },
    { id: 'milizia',     zh: '军团兵力', it: 'Milizia',               icon: 'milizia' }
  ];

  /* ======================= 7. Laws ======================= */
  W.LAWS = [
    { id: 'elettorale', zh: '选举法', it: 'Legge elettorale', max: 3, levels: [
      '无选举（1919 年市政议会延续）', '混合多数制（51+17 / 6+2）', '比例代表制', '普选与女性候选权'] },
    { id: 'lingua', zh: '官方语言', it: 'Lingua ufficiale', max: 3, levels: [
      '仅意大利语', '意大利语与克罗地亚语并行', '意/克/匈三语', '三语 + 官方文书三语并行'] },
    { id: 'portofranco', zh: '自由港', it: 'Porto franco', max: 3, levels: [
      '无特权', '关税暂缓区', '自由港', '自由港 + 转口贸易特权'] },
    { id: 'cittadinanza', zh: '公民身份', it: 'Cittadinanza', max: 3, levels: [
      '军团兵与 1918 年前居民', '按语言与文化放宽入籍', '居住三年入籍', '允许双国籍'] },
    { id: 'ordine', zh: '公共秩序', it: 'Ordine pubblico', max: 3, levels: [
      '军团兵与市政警察并行', '市警扩编', '市警接受市政监督', '市警受公开程序与司法审查约束'] },
    { id: 'stampa', zh: '新闻', it: 'Stampa', max: 2, levels: [
      '军团兵检查', '有限自由（须登记）', '完全自由'] },
    { id: 'scuola', zh: '教育语言', it: 'Lingua scolastica', max: 2, levels: [
      '仅意大利语', '增设克罗地亚语班', '公立双语学校'] },
    { id: 'dogana', zh: '关税', it: 'Regime doganale', max: 3, levels: [
      '被封锁的孤立港', '与意大利关税协定', '与南斯拉夫关税协定', '双协定与转口'] },
    { id: 'orario', zh: '劳动时间', it: 'Orario di lavoro', max: 3, levels: [
      '无统一工时', '八小时工作制', '加班限制与每周休息', '带薪休假与工时监察'] },
    { id: 'lavoro', zh: '劳动保障', it: 'Tutele del lavoro', max: 3, levels: [
      '无保障制度', '最低工资与劳动争议调解', '疾病、失业与养老救助', '工团承认与集体合同'] },
    { id: 'fisco', zh: '财政', it: 'Ordinamento fiscale', max: 3, levels: [
      '印钞与捐献', '开征港口费', '累进所得税', '直接税 + 关税组合'] },
    ];

  /* Short, rule-backed effects for the law dossier. The full numeric formulas
     remain in Rules; these summaries explain what each statute changes. */
  W.LAW_EFFECTS = {
    elettorale: { zh: '每级提高各阶层的目标投票率 1.5 点；选举、宪章日志会读取现行等级。', it: 'Ogni livello aumenta di 1,5 punti l’affluenza obiettivo; elezioni e diario leggono il livello.' },
    lingua: { zh: '每月改善与南斯拉夫的关系；较高等级缓解边郊动荡并影响市民同意日志。', it: 'Migliora i rapporti jugoslavi ogni mese; livelli alti attenuano i disordini periferici.' },
    portofranco: { zh: '每级提高港口吞吐目标，并每月增加资本信心；可开启港口金融路线。', it: 'Alza il traffico obiettivo e la fiducia del capitale; apre la finanza portuale.' },
    cittadinanza: { zh: '一级使目标投票率提高 3 点，二级起提高 6 点；也决定宪章条款是否落实。', it: 'Aumenta l’affluenza obiettivo di 3 punti al primo livello e 6 dal secondo.' },
    ordine: { zh: '每级抑制法西斯街头暴力、提高摄政权威；市警监督也影响宪章日志。', it: 'Riduce la violenza delle squadre e rafforza l’autorità; il controllo municipale conta per la Carta.' },
    stampa: { zh: '改变每月政治暴力走势；完全自由是宪章日志的目标。', it: 'Modifica la violenza politica mensile; la piena libertà è un obiettivo della Carta.' },
    scuola: { zh: '每级每月提高斯拉夫农民对军团的支持；双语教育列入宪章目标。', it: 'Ogni livello aumenta mensilmente il sostegno dei contadini croati; il bilinguismo conta per la Carta.' },
    dogana: { zh: '每级使关税收入提高 5%；商业协定另会改变腹地通达。', it: 'Ogni livello aumenta del 5% le entrate doganali; i trattati influiscono sull’accesso all’entroterra.' },
    orario: { zh: '每级每月使罢工强度 −0.5、失业率 −0.12、资本信心 −0.2；不属于宪章日志硬条件。', it: 'Ogni livello riduce scioperi di 0,5 e disoccupazione di 0,12 al mese, ma fiducia di 0,2.' },
    lavoro: { zh: '每级每月使罢工强度 −1.1，救助支出 +2；三级是宪章与劳动共和国的目标。', it: 'Ogni livello riduce gli scioperi di 1,1 al mese e aumenta la spesa sociale di 2.' },
    fisco: { zh: '二级起开征所得税；每级每月降低资本信心 0.9。', it: 'Dal secondo livello si applica l’imposta sul reddito; la fiducia cala di 0,9 per livello al mese.' }
  };
  W.LAW_SOURCES = {
    elettorale: { zh: '市政选举、宪章颁布、阿伦戈', it: 'Elezioni municipali, Carta, Arengo' },
    lingua: { zh: '双语条例、葛兰西谈判', it: 'Ordinamento bilingue, trattativa con Gramsci' },
    portofranco: { zh: '自由港法令', it: 'Decreto sul porto franco' },
    cittadinanza: { zh: '公民身份法', it: 'Legge sulla cittadinanza' },
    ordine: { zh: '市政警察改革、解除武装', it: 'Riforma della polizia, disarmo' },
    stampa: { zh: '新闻自由条例', it: 'Regolamento sulla stampa' },
    scuola: { zh: '双语条例', it: 'Ordinamento bilingue' },
    dogana: { zh: '与贝尔格莱德的关税协定', it: 'Accordo doganale con Belgrado' },
    orario: { zh: '劳动时间法、码头谈判、总罢工', it: 'Legge sull’orario, trattativa portuale, sciopero' },
    lavoro: { zh: '劳动保障法、德·安布里斯、阿伦戈', it: 'Legge sulle tutele, De Ambris, Arengo' },
    fisco: { zh: '财政与税务法令', it: 'Decreti fiscali' }
  };


  /* ======================= 8. The Rectors (Consiglio dei Rettori) ======================= */
  /* The Regency government as it stood in September 1920; all seven Rectors are historical. */
  W.MINISTRIES = [
    { id: 'esteri',     zh: '外交',         it: 'Affari Esteri',       holder: 'Gabriele D\'Annunzio',  power: 0.17, zh0: '邓南遮本人' },
    { id: 'interno',    zh: '内政与司法',   it: 'Interni e Giustizia', holder: 'Icilio Bacci',          power: 0.15 },
    { id: 'difesa',     zh: '国防',         it: 'Difesa',              holder: 'Giovanni Host-Venturi', power: 0.15 },
    { id: 'finanze',    zh: '财政',         it: 'Finanze',             holder: 'Maffeo Pantaleoni',     power: 0.14 },
    { id: 'economia',   zh: '公共经济',     it: 'Economia pubblica',   holder: 'Luigi Bescocca',        power: 0.13 },
    { id: 'lavoro',     zh: '劳动',         it: 'Lavoro',              holder: 'Clemente Marassi',      power: 0.13 },
    { id: 'istruzione', zh: '教育',         it: 'Istruzione',          holder: 'Lionello Lenaz',        power: 0.13 }
  ];

  /* ======================= 9. Districts ======================= */
  W.DISTRICTS = [
    { id: 'centro',    zh: '老城·钟楼区', it: 'Città Vecchia',   status: 'fiume', control: 78, agitation: 26, unemployment: 22, ethnicIt: 88, ethnicSl: 8,  strategic: 10, industry: 2, port: 3, note: '市政厅、Torre Civica、上诉法院、报馆；军团兵的讲台' },
    { id: 'porto',     zh: '自由港与大港', it: 'Punto Franco · Porto di Fiume', status: 'fiume', control: 70, agitation: 48, unemployment: 31, ethnicIt: 78, ethnicSl: 18, strategic: 10, industry: 9, port: 10, note: '自由港与主港的游戏合并分区；“Punto Franco”见 1919 年协约国警备分区' },
    { id: 'brajda',    zh: '布拉伊达－多拉茨', it: 'Braida-Dolaz', status: 'fiume', control: 72, agitation: 20, unemployment: 14, ethnicIt: 94, ethnicSl: 4, strategic: 6, industry: 3, port: 2, note: '布拉伊达与多拉茨的游戏合并分区' },
    { id: 'belvedere', zh: '贝尔维德雷',   it: 'Belvedere-Turni', status: 'fiume', control: 74, agitation: 22, unemployment: 20, ethnicIt: 90, ethnicSl: 7,  strategic: 5,  industry: 2, port: 1, note: 'suburbio，新兴居住区' },
    { id: 'kozala',    zh: '科萨拉',       it: 'Cosala',          status: 'fiume', control: 62, agitation: 32, unemployment: 26, ethnicIt: 82, ethnicSl: 15, strategic: 4,  industry: 4, port: 0, note: '历史地名 Cosala；地图范围取自现代社区边界，非当年行政区' },
    { id: 'plase',     zh: '普拉塞', it: 'Plasse', status: 'fiume', control: 54, agitation: 50, unemployment: 29, ethnicIt: 66, ethnicSl: 30, strategic: 6, industry: 10, port: 4, note: '历史地名 Plasse；工业设施数量与工人态度为游戏设定' },
    { id: 'drenova',   zh: '德雷诺瓦',     it: 'Drenova',         status: 'fiume', control: 48, agitation: 30, unemployment: 24, ethnicIt: 30, ethnicSl: 66, strategic: 3,  industry: 1, port: 0, note: '子市镇之一，克罗地亚农村；对摄政最疏远' },
    { id: 'zamet',     zh: '扎梅特',       it: 'Zamet',           status: 'fiume', control: 66, agitation: 24, unemployment: 23, ethnicIt: 62, ethnicSl: 34, strategic: 4,  industry: 2, port: 0, note: '西部地点；“拉帕洛走廊”是 1920 年条约概念，不适用于 1919 开局' },
    { id: 'pecine',    zh: '佩奇内',       it: 'Pecine',    status: 'yugo', control: 0, agitation: 14, unemployment: 18, ethnicIt: 20, ethnicSl: 76, strategic: 5, industry: 3, port: 3, note: '苏沙克东南侧海滨居住区，1919 年不属于邓南遮控制的阜姆城区' },
    { id: 'srdoci',    zh: '瑟尔多齐',     it: 'Serdozi', status: 'yugo', control: 0, agitation: 32, unemployment: 27, ethnicIt: 22, ethnicSl: 74, strategic: 7, industry: 1, port: 0, note: '卡斯塔夫辖区一带于 1919 年仍在意大利占领下，1921 年 5 月结束占领；地图随日期改变色块。游戏控制值仍代表邓南遮势力而非主权' },
    { id: 'susak',     zh: '苏沙克',       it: 'Sussak',          status: 'yugo',  control: 0,  agitation: 22, unemployment: 19, ethnicIt: 16, ethnicSl: 80, strategic: 8,  industry: 6, port: 6, note: '南斯拉夫领土；封锁线上的缺口与走私通道' },
    { id: 'tersatto',  zh: '特尔萨特',     it: 'Tersatto',        status: 'yugo',  control: 0,  agitation: 10, unemployment: 21, ethnicIt: 20, ethnicSl: 76, strategic: 7,  industry: 1, port: 1, note: '俯瞰阜姆的山丘与修道院；炮兵观察点' },
    { id: 'valle',     zh: '埃内奥河谷',   it: "Valle dell'Eneo", status: 'yugo',  control: 0,  agitation: 8,  unemployment: 24, ethnicIt: 10, ethnicSl: 86, strategic: 6,  industry: 2, port: 1, note: '河流上游：全城的水源与水电' }
  ];

  /* Map markers (real coordinates) */
  W.MARKERS = [
    { id: 'torre', zh: '市政钟楼', it: 'Torre Civica', lon: 14.4409, lat: 45.3267, kind: 'city' },
    { id: 'delta', zh: '埃内奥三角洲·边界争议', it: "Delta dell'Eneo", lon: 14.446, lat: 45.324, kind: 'dispute' }
  ];

  /* ======================= 10. Diplomatic actors ======================= */
  W.DIPLO_ACTORS = [
    { id: 'italy',      zh: '意大利王国',   it: 'Regno d\'Italia',  init: 22, color: '#3E7A3E' },
    { id: 'yugoslavia', zh: '南斯拉夫',     it: 'Regno SHS',        init: 18, color: '#3C6E9E' },
    { id: 'uk',         zh: '英国',         it: 'Regno Unito',      init: 40, color: '#7A4B8E' },
    { id: 'france',     zh: '法国',         it: 'Francia',          init: 38, color: '#2F6FA8' },
    { id: 'usa',        zh: '美国',         it: 'Stati Uniti',      init: 34, color: '#A0522D' },
    { id: 'league',     zh: '国际联盟',     it: 'Società delle Nazioni', init: 36, color: '#4A7C7E' },
    { id: 'hungary',    zh: '匈牙利',       it: 'Regno d\'Ungheria', init: 34, color: '#6E8B3D' },
    { id: 'vatican',    zh: '教廷',         it: 'Santa Sede',       init: 30, color: '#C9A227' },
    { id: 'comintern',  zh: '第三国际',     it: 'III Internazionale', init: 4, color: '#B0202F' }
  ];

  W.POSTURES = [
    { id: 'roma',        zh: '与罗马周旋',   it: 'Trattare con Roma',        desc: '用承认换解除封锁。代价是民族派的耐心与自治派的信任。' },
    { id: 'equidistant', zh: '等距',         it: 'Equidistanza',             desc: '在两个邻国之间保持平衡；两边关系都缓慢下滑。' },
    { id: 'belgrade',    zh: '与贝尔格莱德', it: 'Aprire a Belgrado',        desc: '换腹地与三角洲。代价是罗马与整个民族阵营。' },
    { id: 'internation', zh: '把城市交给世界', it: 'Internazionalizzare Fiume', desc: '让国联接管。合法性上升，主权下降——但邓南遮绝不会喜欢。' }
  ];

  ;

  /* ======================= 12. Armed forces inside Fiume ======================= */
  /* Approximate sector symbols, never exact barracks or unit-strength records. */
  W.FIUME_UNITS = [
    { id: 'u_legione', zh: '军团指挥部·省督府（示意）', it: 'Comando legionari · Palazzo del Governo', lon: 14.4427, lat: 45.3296, kind: 'land' },
    { id: 'u_cantrida', zh: '坎特里达宪兵警备点（1919·示意）', it: 'Posto CC.RR. di Cantrida', lon: 14.382, lat: 45.3406, kind: 'land', allied: true },
    { id: 'u_susak', zh: '苏沙克宪兵警备点（1919·示意）', it: 'Posto CC.RR. di Sussak', lon: 14.461, lat: 45.326, kind: 'land', allied: true },
    { id: 'u_baross', zh: '法国基地·波尔托巴罗斯（1919·示意）', it: 'Base francese · Porto Baross', lon: 14.4416, lat: 45.3226, kind: 'naval', allied: true }
  ];
  /* ======================= 13. Historical timeline ======================= */
  W.TIMELINE = [
    { d: '1919-09', zh: '自 Ronchi 进军，军团兵进入阜姆', it: 'La marcia da Ronchi' },
    { d: '1919-10', zh: '市政选举：唯一名单「国民联盟」当选', it: 'Elezioni municipali' },
    { d: '1919-11', zh: '罗马下令封锁补给', it: 'Il blocco dei rifornimenti' },
    { d: '1920-04', zh: '自治派联合社会党发动总罢工', it: 'Lo sciopero generale' },
    { d: '1920-09', zh: '《卡尔纳罗宪章》颁布，摄政成立', it: 'La Carta del Carnaro' },
    { d: '1920-11', zh: '《拉帕洛条约》：自由邦成立，摄政拒绝', it: 'Trattato di Rapallo' },
    { d: '1920-12', zh: '血腥圣诞：意军攻城，邓南遮投降', it: 'Natale di sangue' },
    { d: '1921-04', zh: '制宪议会选举：自治党 66%', it: 'Elezioni della Costituente' },
    { d: '1922-03', zh: '法西斯政变，扎内拉被逐', it: 'Colpo di Stato' },
    { d: '1922-11', zh: '法西斯小队不经交战占领阜姆', it: 'Occupazione fascista' },
    { d: '1924-01', zh: '《罗马条约》：意大利吞并阜姆', it: 'Trattato di Roma' }
  ];

  /* Era: 12 September 1919, the day of the march, is year I of the Impresa */
  W.ERA = { y: 1919, m: 9, d: 12, label: { zh: '事业', it: 'dell\'Impresa' } };

  /* ======================= 14. Difficulty ======================= */
  W.DIFFICULTIES = [
    { id: 'historical', zh: '史实', it: 'Storico', ap: 2, hand: 4, dated: true, coupMul: 1.00,
      note: '事件严格按年月触发。默认线：1920 年 12 月血腥圣诞，1921 年 4 月失去议会多数。' },
    { id: 'open',       zh: '普通', it: 'Normale', ap: 2, hand: 4, dated: false, coupMul: 0.85,
      note: '只依赖条件，日期不再强制。摄政有可能活下来。' },
    { id: 'sandbox',    zh: '沙盒', it: 'Sandbox', ap: 2, hand: 5, dated: true, coupMul: 0.50,
      note: '解锁调试面板，不授予成就。' }
  ];

  /* ======================= 14b. The forces outside Fiume ======================= */
  /* The four subversive forces the 1920 march would have to hold together, plus
     the officer corps. `attitude` is how each regards the Legion, -100..+100.
     The initials are inferred from where each stood in 1920, and they are the
     design's difficulty ladder: Mussolini is closest because the fasci already
     worked with the Legion, Gramsci is furthest because Ordine Nuovo called the
     whole enterprise petit-bourgeois adventurism.
     `antagonism` is how much each one is pushed away when another is courted.
     Some approaches strain others; that is the historical point. */
  /* The political forces are named for movements, not for one man each: what the
     Legion is buying is a movement's goodwill, and the men who speak for those
     movements change (Bombacci is expelled, the communists break away at
     Livorno, Malatesta is in and out of prison throughout). The event that opens
     each approach is still a meeting with a person. */
  W.FORZE = [
    { id: 'fascisti',   zh: '意大利法西斯党', it: 'Partito Nazionale Fascista', init: 38, color: '#8F4124', allied: true, gate: 80,
      note: '法西斯战斗团。已经在向右转，把阜姆当成障碍而不是跳板。' },
    { id: 'socialisti', zh: '意大利社会党',   it: 'Partito Socialista',   init: 32, color: '#B0202F', allied: true, gate: 80,
      note: '最高纲领派主流。1921 年 1 月里窝那分裂之前，这是意大利最大的党。' },
    { id: 'anarchici',  zh: '意大利无政府主义者', it: 'Anarchici italiani', init: 30, color: '#070000', allied: true, gate: 80,
      note: '马拉泰斯塔的《新人类》网络。1920 年一度接近阜姆，看到「最坏的敌人倾向」占上风就走。' },
    { id: 'comunisti',  zh: '意大利共产党',   it: 'Partito Comunista',    init: 24, color: '#A31621', allied: true, gate: 80,
      note: '《新秩序报》一翼。1921 年 1 月自社会党分裂而出，把阜姆斥为小资产阶级的煽情民族主义。' },
    { id: 'corradini',  zh: '意大利民族主义协会', it: 'Associazione Nazionalista Italiana', init: 34, color: '#b58e0d', allied: true, gate: 80,
      note: '科拉迪尼的协会。要的是一个由「最优秀者」统治的意大利——而阜姆正在演那一幕。' },
    { id: 'sindacalisti', zh: '意大利革命工团主义者', it: 'Sindacalisti rivoluzionari italiani', init: 30, color: '#a02c06', allied: true, gate: 80,
      note: '德·安布里斯在意大利的工会与革命工团主义网络。' },
    { id: 'forzearmate', zh: '意大利军官团', it: 'Corpo ufficiale italiano', init: 22, color: '#6B4E9E', allied: false, gate: 60,
      note: 'Ronchi 的先例：1919 年 9 月，掷弹兵请邓南遮带头，正规军没能拦住他。' }
  ];
  W.FORZA_BY_ID = {};
  W.FORZE.forEach(function (f) { W.FORZA_BY_ID[f.id] = f; });
  /* The front is the set of movements that can be brought into the column —
     every allied force except the officer corps, which is a gate of its own.
     Declared once here because the journal's completion rule, the September
     window and the epilogue all have to agree on who counts. */
  W.FORZA_FRONT = W.FORZE.filter(function (f) { return !!f.allied; }).map(function (f) { return f.id; });
  W.forzaExists = function (state, id) {
    return id !== 'comunisti' || !!(state.flags && state.flags.comintern_door);
  };
  W.availableForzaFront = function (state) {
    return W.FORZA_FRONT.filter(function (id) { return W.forzaExists(state, id); });
  };
  /* How many of the front must be at gate for the march to be possible. */
  W.FORZA_FRONT_NEEDED = 3;
  /* The monthly consolidation floor for the 1920 front. Declared here rather
     than inline in the journal so the rule and the UI cannot drift apart: a
     force at or above this is already committed, and only the three best-placed
     forces are carried each turn. */
  W.FORZA_FRONT_MIN = 60;
  /* When each dated approach becomes available, as {y, m}, and when it
     stops being available. Without a window per force the conversations
     resolve on the same turn — RESOLVE_EVENT does not advance the clock — which
     would dump the whole antagonism on the player at once and leave no room to
     choose an order or to decline one. The windows are spread across the
     journal's life (June 1920 – March 1921) so at most one approach opens per
     month, and they close after December 1920: the window cannot be farmed, so
     the two "at least three" routes are a January 1921 march and an April 1921
     one. Each closes with the journal's own deadline. */
  W.FORZA_WINDOW = {
    fascisti:   { from: { y: 1920, m: 7 },  to: { y: 1922, m: 3 } },
    anarchici:  { from: { y: 1920, m: 8 },  to: { y: 1922, m: 3 } },
    socialisti: { from: { y: 1920, m: 9 },  to: { y: 1922, m: 3 } },
    comunisti:  { from: { y: 1920, m: 10 }, to: { y: 1922, m: 3 } },
    corradini:  { from: { y: 1920, m: 11 }, to: { y: 1922, m: 3 } }
  };
  /* Who pushes whom away, and by how much, when they are courted. The
     penalty is (weight / 12) x the gain, so
     a weight of 5 costs about 42% of what the rival gains. The weights are a
     design parameter, tuned against the probe in .analysis/probe_pacing.js. */
  W.FORZA_ANTAGONISM = {
    fascisti:   { anarchici: 3, comunisti: 4 },
    socialisti: { fascisti: 2 },
    anarchici:  { forzearmate: 2 },
    comunisti:  { fascisti: 4, forzearmate: 2 },
    /* The nationalists are the one force the officer corps does not resent:
       they want the same thing the officers want. So courting Corradini costs
       the revolutionary left and leaves the army gate untouched. */
    corradini:  { comunisti: 3, socialisti: 2 }
  };
  /* What the officer corps thinks moves with the size of the Legion, because a
     column of ten thousand is a fact that career officers have to price in.
     This is the only thing that can push the corps up: nothing else in the
     journal raises it, and it needs 60 from a standing start of 22, so without
     this term the officer gate would be unreachable by construction. */
  W.FORZA_MILIZIA_BANDS = [
    { min: 9000, delta: 2.2 },
    { min: 6000, delta: 1.2 },
    { min: 3500, delta: 0.3 },
    { min: 0,    delta: -0.5 }
  ];
  /* Per-turn drift: Rome works on the officer corps, and the communist left
     loses patience with a movement that has not delivered a social programme. */
  W.FORZA_DRIFT = { forzearmate: -0.4, comunisti: -0.15 };

  /* Officer-corps sentiment as a function of Legion strength. The flat drift
     above is the baseline pull from Rome; this term is what a real army
     presence buys. Returns 0 for every force except the corps. */
  W.forzaMiliziaDelta = function (state, forceId) {
    if (forceId !== 'forzearmate') return 0;
    var n = state.order.milizia;
    var bands = W.FORZA_MILIZIA_BANDS || [];
    for (var i = 0; i < bands.length; i++) if (n >= bands[i].min) return bands[i].delta;
    return 0;
  };

  /* Is `forceId`'s window open at this state's date? Reads W.FORZA_WINDOW.
     Always false when the table has no entry, so a missing window closes the
     line rather than opening it by accident. */
  W.forzaWindowOpen = function (state, forceId) {
    var w = (W.FORZA_WINDOW || {})[forceId];
    if (!w) return false;
    var ym = state.date.y * 12 + state.date.m;
    return ym >= (w.from.y * 12 + w.from.m) && ym <= (w.to.y * 12 + w.to.m);
  };

  /* ======================= 15. Scenarios ======================= */
  W.SCENARIOS = [
    { id: '1919-09', zh: '进军', it: 'La Marcia', start: { y: 1919, m: 9, d: 12 }, featured: true,
      blurb: '1919 年 9 月 12 日，你带着两千五百人从 Ronchi 走进阜姆。全城在等你，罗马在封锁你，' +
        '而你有十五个月的时间决定这座城市会发生什么。',
      seed: {} }
  ];
  return W;
});
