/* ==========================================================================
   内容层 · 政党 · 选举名单 · 阶层特征
   七个史实政党、三份选举名单、每党的弃权传统、阶层选举/组织特征与初始支持矩阵。
   W.PARTIES / W.ELECTORAL_LISTS / W.PARTY_RULES / W.INITIAL_SUPPORT / W.CLASS_TRAITS
   ========================================================================== */
(function (root, factory) {
  var mod = factory(root.Fiume.World);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.Parties = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (W) {
  'use strict';
  var P = W;
  /* ======================= 2. Parties (the historical spectrum of Fiume, 1919-1924) ======================= */
  /* camp: annessione = annexationist / autonomia = autonomist / cattolico = Catholic / classe = class party */
  W.PARTIES = [
    { id: 'LEG', zh: '军团', it: 'Legione del Carnaro', short: 'LEG', color: '#C9A227',
      camp: 'annessione', player: true, emblem: 'img/Party/Emblem_Legionaria.png',
      leader: { zh: '加布里埃莱·邓南遮', it: 'Gabriele D\'Annunzio', portrait: 'img/Portrait/Portrait_Dannunzio.png' },
      blurb: '在这群从战壕烈火中挣脱出来的垂死幽灵与狂徒眼中，现实世界的条约与界碑不过是平庸官僚的遮羞布，唯有速度、暴力与诗人的狂想才配作为立国的宪章。在可卡因、民族进军与狂欢夜曲的麻醉下，以自我毁灭式的决绝姿态，将一座城市推向了政治狂热与艺术革命交错的深渊。' },
    { id: 'AUT', zh: '自治党', it: 'Partito Autonomo', short: 'AUT', color: '#2E7D45',
      camp: 'autonomia', player: true, emblem: 'img/Party/Emblem_Partito autonomo.png',
      leader: { zh: '里卡多·扎内拉', it: 'Riccardo Zanella', portrait: 'img/Portrait/Portrait_Riccardo_Zanella.jpg' },
      blurb: '守望着港口海关大楼与石砌栈桥的世俗市民不愿臣服于罗马的鹰旗，也不屑屈从于贝尔格莱德的王冠，他们依然在阴暗的街角和咖啡馆里固执地等待着狂热退潮，重拾那个只属于市民时代的自由城邦。' },
    { id: 'PAD', zh: '自治民主党', it: 'Partito Autonomo Democratico', short: 'PAD', color: '#7FA65A',
      camp: 'autonomia', leader: { zh: '鲁杰罗·戈塔尔迪', it: 'Ruggero Gotthardi' },
      blurb: '中间知识分子与改良派，试图在狂风暴雨的民族仇杀与阶级仇恨之间架起一道脆弱的木桥。他们徒劳地试图说服每一个狂热派系：没有阶级与族群的妥协，再崇高的城邦神话最终也只会在封锁线的饥馑中沦为一摊死灰。' },
    { id: 'PCR', zh: '人民委员会', it: 'Consiglio Nazionale', short: 'PCR', color: '#3E8E7E',
      camp: 'autonomia', leader: { zh: '贝尼亚米诺·格罗霍瓦茨', it: 'Beniamino Grohovaz' },
      blurb: '在沉默笼罩的南斯拉夫劳工聚居区，他们是被意大利民族聚光灯刻意抹去的巨大阴影。对他们而言，阜姆不是神圣的意大利祭坛，而是斯拉夫肌体上不可分割的咽喉；只要埃内奥河还在流淌，他们便绝不会在拉丁诗人的狂欢歌声中屈服。' },
    { id: 'ANI', zh: '意大利国民委员会', it: 'Blocco Nazionale Italiano', short: 'ANI', color: '#4A4A6A',
      camp: 'annessione', leader: { zh: '乔瓦尼·朱里亚蒂', it: 'Giovanni Giuriati' },
      blurb: '意大利裔资产阶级体面绅士们常自诩为守卫“文明防线”的最前沿哨兵。怀着对斯拉夫化浪潮的刻骨恐惧与对祖国怀抱的病态渴望，他们亲手把狂野诗人迎进城门。不过他们很快就会惊恐地发现他们迎来的不仅仅是一位“解放者”，还可能是一只会吞噬他们的恶龙......' },
    { id: 'PSI', zh: '社会党', it: 'Partito Socialista Internazionale di Fiume', short: 'PSI', color: '#B0202F',
      camp: 'classe', player: true, emblem: 'img/Party/Emblem_Partito Socialista Internazionale di Fiume.png',
      leader: { zh: '萨穆埃莱·迈伦德尔', it: 'Samuele Mayländer' },
      blurb: '在被封锁线勒紧咽喉的沿海工厂阴影里，冷眼旁视着狂欢节般的资产阶级民族主义癫狂。他们低沉地嘶吼——民主！进步！和平！资产阶级与冒险家合谋的荒诞戏码在阜姆上演时，他们只冷眼等待着这场闹剧在饥饿面前自行轰塌。' }
  ];
  W.PARTY_BY_ID = {};
  W.PARTIES.forEach(function (p) { W.PARTY_BY_ID[p.id] = p; });

  /* 4. Electoral lists: three lists */
  W.ELECTORAL_LISTS = [
    { id: 'BLO', zh: '国民集团', it: 'Blocco Nazionale', short: 'BLO', color: '#C9A227',
      members: ['LEG', 'ANI'],
      blurb: '军团兵与民族主义者的竞选联盟。1919 年 10 月那份「国民联盟」名单的后身。' },
    { id: 'AUT', zh: '自治派', it: 'Blocco Autonomo', short: 'AUT', color: '#2E7D45',
      members: ['AUT', 'PAD', 'PCR'],
      blurb: '自治党、自治民主党与克罗地亚党的联合名单。' },
    { id: 'PSI', zh: '社会党', it: 'Partito Socialista', short: 'PSI', color: '#B0202F',
      members: ['PSI'], blurb: '单独参选，但一半的选民会按传统弃权。' }
  ];
  W.LIST_BY_ID = {};
  W.ELECTORAL_LISTS.forEach(function (L) { W.LIST_BY_ID[L.id] = L; });
  W.MEMBER_OF = {};   // party -> list
  W.ELECTORAL_LISTS.forEach(function (L) { L.members.forEach(function (m) { W.MEMBER_OF[m] = L.id; }); });

  /* Alternative list structure when the legionaries run alone (flags.legion_alone) */
  W.SPLIT_LISTS = [
    { id: 'LEG', zh: '军团兵名单', it: 'Lista legionaria', short: 'LEG', color: '#C9A227', members: ['LEG'] },
  ];

  /* Per-party abstention tradition, subtracted from that party's potential vote at elections */
  W.PARTY_RULES = {
    LEG: { abstention: 0.06 },
    AUT: { abstention: 0.05 },
    PAD: { abstention: 0.05 },
    PCR: { abstention: 0.08 },
    ANI: { abstention: 0.10 },
    PSI: { abstention: 0.50 },   // 弃权传统：1921 年 4 月拒绝进入议会
  };

  /* ======================= 3. Class support matrix ======================= */
  /* Each row sums to 100. September 1919 baseline: the annexationists have just won the
     municipal election on a single National Union list and the autonomists are not yet organised. */
  W.INITIAL_SUPPORT = {
    portuali:  { LEG: 20, AUT:  9, PAD:  4, PCR:  9, ANI:  7, PSI: 51 },
    operai:    { LEG: 27, AUT: 10, PAD:  4, PCR:  7, ANI:  8, PSI: 44 },
    artigiani: { LEG: 50, AUT: 20, PAD:  7, PCR:  6, ANI: 13, PSI:  4 },
    borghesia: { LEG: 38, AUT: 27, PAD: 10, PCR:  6, ANI: 16, PSI:  3 },
    impiegati: { LEG: 38, AUT: 22, PAD: 11, PCR:  9, ANI: 17, PSI:  3 },
    contadini: { LEG: 13, AUT: 27, PAD: 10, PCR: 41, ANI:  5, PSI:  4 },
    regnicoli: { LEG: 73, AUT:  6, PAD:  3, PCR:  2, ANI: 14, PSI:  2 },
  };

  /* Electoral and organizational traits per class.
     turnout: participation in the April 1921 election (about 66% citywide, differentiated here).
     Inferred; see docs/历史考据.md. */
  W.CLASS_TRAITS = {
    portuali:  { turnout: 54, note: { zh: '联合工位的核心，社会党的弃权传统压低了投票率。', it: 'Nucleo delle Sedi Riunite, ma l\'astensionismo socialista abbassa l\'affluenza.' } },
    operai:    { turnout: 60, note: { zh: 'Whitehead、造船厂、炼油厂、烟草厂。组织度高。', it: 'Whitehead, cantiere, raffineria, tabacchificio. Alta organizzazione.' } },
    artigiani: { turnout: 79, note: { zh: '被军团兵的排场吸引，也被街头暴力吓到。投票很积极。', it: 'Attirati dal fasto dei legionari, spaventati dalla violenza. Votano molto.' } },
    borghesia: { turnout: 88, note: { zh: '船东、保险与律师。自治党的骨干，投票率最高的一档。', it: 'Commercianti, armatori, professionisti. Ossatura degli autonomi.' } },
    impiegati: { turnout: 83, note: { zh: '港务局、银行、学校、报馆。意见多，票也多。', it: 'Capitaneria, banche, scuole, giornali.' } },
    regnicoli: { turnout: 68, note: { zh: '意大利王国来的侨民。军团兵的社会基础，也是他们的包袱。', it: 'I regnicoli: base sociale dei legionari, e il loro fardello.' } },
    contadini: { turnout: 44, note: { zh: '西部乡村的克罗地亚农民。分散，投票率低。', it: 'Contadini croati dei sottocomuni. Dispersi, affluenza bassa.' } },
  };
  return P;
});
