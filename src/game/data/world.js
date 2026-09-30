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

    /* ======================= 4. Organizations ======================= */
  W.ORGANIZATIONS = [
    { id: 'legione',   zh: '阜姆军团（Legione Fiumana）', it: 'Legione Fiumana', active: true,  effect: 'milizia' },
    { id: 'arditi_as', zh: '意大利阿迪蒂协会',           it: 'Associazione Arditi d\'Italia', active: true, effect: 'fervour' },
    { id: 'testa',     zh: '《铁头》报',                 it: 'Testa di Ferro', active: true,  effect: 'propaganda' },
    { id: 'arengo',    zh: '阿伦戈（市民大会）',         it: 'Arengo', active: true,  effect: 'legitimacy' },
    { id: 'cassa',     zh: '贴现银行与阜姆券',           it: 'Cassa di Sconto e Buoni di Fiume', active: true, effect: 'funds' },
    { id: 'reduci',    zh: '退伍军人联合会',             it: 'Unione dei Reduci', active: false, effect: 'squadre' },
    { id: 'guardia',   zh: '公民卫队',                   it: 'Guardia Civica', active: false, effect: 'order' },
    { id: 'contadini', zh: '子市镇农民联盟',             it: 'Lega dei Contadini', active: false, effect: 'subSupport' }
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
  /* The six slots of the reference poster's resource strip. ids are read by
     S.resources and Eng.resourceSnapshot. */
  W.RESOURCES = [
    { id: 'tesoro',      zh: '金库',     it: 'Tesoro',                icon: 'coins' },
    { id: 'legittimita', zh: '军团民意', it: 'Opinione sulla Legione', icon: 'legittimita' },
    { id: 'fervore',     zh: '民众热忱', it: 'Fervore Popolare',      icon: 'flame' },
    { id: 'milizia',     zh: '军团兵力', it: 'Milizia',               icon: 'milizia' },
    { id: 'produzione',  zh: '工业生产', it: 'Produzione Industriale', icon: 'industria' },
    { id: 'pressione',   zh: '外交压力', it: 'Pressione Diplomatica', icon: 'pressione' }
  ];

  /* ======================= 7. Laws ======================= */
  W.LAWS = [
    { id: 'statuto', zh: '《卡尔纳罗宪章》', it: 'Carta del Carnaro', max: 4, levels: [
      '悬置（军团兵的意志即法律）', '部分实施：阿伦戈与执政官', '全面实施：法团院与公社自治', '在国联条约集登记', '英法美共同保证'] },
    { id: 'elettorale', zh: '选举法', it: 'Legge elettorale', max: 3, levels: [
      '无选举（1919 年市政议会延续）', '混合多数制（51+17 / 6+2）', '比例代表制', '普选与女性候选权'] },
    { id: 'lingua', zh: '官方语言', it: 'Lingua ufficiale', max: 3, levels: [
      '仅意大利语', '意大利语与克罗地亚语并行', '意/克/匈三语', '三语 + 官方文书三语并行'] },
    { id: 'portofranco', zh: '自由港', it: 'Porto franco', max: 3, levels: [
      '无特权', '关税暂缓区', '自由港', '自由港 + 转口贸易特权'] },
    { id: 'cittadinanza', zh: '公民身份', it: 'Cittadinanza', max: 3, levels: [
      '军团兵与 1918 年前居民', 'regnicoli 入籍便利', '居住三年入籍', '允许双国籍'] },
    { id: 'ordine', zh: '公共秩序', it: 'Ordine pubblico', max: 3, levels: [
      '仅靠军团兵的纪律', '市警扩编', '公民卫队合法化', '公民卫队 + 街区自卫队'] },
    { id: 'stampa', zh: '新闻', it: 'Stampa', max: 2, levels: [
      '军团兵检查', '有限自由（须登记）', '完全自由'] },
    { id: 'scuola', zh: '教育语言', it: 'Lingua scolastica', max: 2, levels: [
      '仅意大利语', '增设克罗地亚语班', '公立双语学校'] },
    { id: 'dogana', zh: '关税', it: 'Regime doganale', max: 3, levels: [
      '被封锁的孤立港', '与意大利关税协定', '与南斯拉夫关税协定', '双协定与转口'] },
    { id: 'lavoro', zh: '劳动', it: 'Legislazione del lavoro', max: 3, levels: [
      '无劳动立法', '八小时工作制', '港口劳动局', '工会承认与集体合同'] },
    { id: 'fisco', zh: '财政', it: 'Ordinamento fiscale', max: 3, levels: [
      '印钞与捐献', '开征港口费', '累进所得税', '直接税 + 关税组合'] },
    ];


  W.LAW_STANCE = {
    statuto:      { LEG:  8, AUT:  5, PAD:  6, PCR:  6, ANI: -2, PSI:  4 },
    elettorale:   { LEG: -5, AUT: -3, PAD:  6, PCR:  8, ANI: -2, PSI:  9 },
    lingua:       { LEG:  2, AUT:  6, PAD:  7, PCR:  9, ANI: -5, PSI:  5 },
    portofranco:  { LEG:  6, AUT:  9, PAD:  7, PCR:  5, ANI:  4, PSI: -1 },
    cittadinanza: { LEG:  3, AUT:  3, PAD:  4, PCR:  5, ANI:  1, PSI:  6 },
    ordine:       { LEG:  6, AUT:  0, PAD: -2, PCR: -4, ANI:  9, PSI: -6 },
    stampa:       { LEG: -3, AUT:  5, PAD:  6, PCR:  7, ANI: -5, PSI:  8 },
    scuola:       { LEG:  1, AUT:  4, PAD:  6, PCR:  8, ANI: -4, PSI:  6 },
    dogana:       { LEG:  4, AUT:  7, PAD:  5, PCR:  5, ANI:  3, PSI:  0 },
    lavoro:       { LEG:  7, AUT:  3, PAD:  4, PCR:  3, ANI: -5, PSI:  9 },
    fisco:        { LEG: -1, AUT:  2, PAD:  3, PCR:  2, ANI: -3, PSI:  8 },
    terra:        { LEG: -2, AUT:  1, PAD:  3, PCR:  4, ANI: -3, PSI:  7 }
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

  /* ======================= 15. Scenarios ======================= */
  W.SCENARIOS = [
    { id: '1919-09', zh: '进军', it: 'La Marcia', start: { y: 1919, m: 9, d: 12 }, featured: true,
      blurb: '1919 年 9 月 12 日，你带着两千五百人从 Ronchi 走进阜姆。全城在等你，罗马在封锁你，' +
        '而你有十五个月的时间决定这座城市会发生什么。',
      seed: {} }
  ];
  return W;
});
