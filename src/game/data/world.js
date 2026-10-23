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
  W.CRISIS_MAX = 100;
  /* The game ends in December 1924 on every difficulty. This is the hard stop
     `Eng.checkEnd` falls back on; the narrative endgames (the Rome treaty in
     1924-01, a fascist takeover, an exile that runs out) still settle earlier
     when their own conditions fire. The window is therefore 1919-09 → 1924-12;
     `ending_fiume_o_morte` is gated on this same month, and `ending_carnaro`
     (which asked for 1926) has been removed rather than left unreachable. */
  W.MAX_END = { y: 1924, m: 12 };

  /* ===================== Battle resolution ===================== */
  /* Pricing for `R.resolveBattle`. Shape taken from
     `social_democracy_alternate_history` (`civil_war.scene.dry:73-84`): each side
     is priced, the two are compared, and the outcome falls out of the comparison
     — win above `thresholds.margin`, a drawn-out war down to
     `thresholds.stalemate`, defeat below it. `thresholds.favorable` never decides
     the outcome, it only picks which text is shown.

     Coefficients are per-side multipliers on state that already exists, so the
     fight reads off what the player actually built:
       defender — the Legion above all (`milizia`), plus the municipal police and
                  carabinieri, plus a small term for the corps whose loyalty follows
                  the Regency's standing (`authority`), scaled down by how far the
                  movement has fallen out with itself (`R.factionDissent`).
                  `fervour` is deliberately NOT priced: enthusiasm does not stop
                  naval artillery, and pricing it made the historical default line
                  win the siege it historically lost.
       attacker — the Royal Army and the fleet, i.e. the garrison reinforced by how
                  far the siege has run (`coup`, 0..100), plus Mussolini's squads. */
  W.BATTLE = {
    defender: { milizia: 1.0, police: 2.0, carabinieri: 1.5, garrison: 2.0, fervour: 0, dissentDiv: 200 },
    attacker: { garrison: 50.0, coup: 72.0, squadre: 8.0 },
    thresholds: { margin: 1.0, stalemate: 0.6, favorable: 0.95 }
  };
  /* Pricing for the 1924 crisis (`R.resolveAnnexation`). Distinct from the siege
     because the attacker here is the fascist squads backed by a foreign ultimatum,
     not the Royal Navy: the squads matter more, the garrison less, and the internal
     fascist pressure (`subversion`) is the term that did not exist in 1920. */
  W.COUP_1924 = { squadre: 10.0, subversion: 40.0, garrison: 20.0 };
  /* Pricing for the DIPLOMATIC 1924 crisis (`R.treatyForces`) — the variant that
     fires when the Italian fascists are too weak to force the issue
     (`forze.fascisti < 60`). The treaty still has to be enforced, but a party
     that never grew cannot supply the muscle: no `subversion` term at all, and
     smaller squad/garrison weights. This is what makes refusing the treaty
     winnable, where refusing the fascist coup is not. */
  W.TREATY_1924 = { squadre: 4.0, garrison: 12.0 };
  /* Back-compat aliases for the three numbers the resolver reads directly. */
  W.BATTLE_MARGIN = W.BATTLE.thresholds.margin;
  W.BATTLE_STALEMATE = W.BATTLE.thresholds.stalemate;
  W.BATTLE_FAVORABLE = W.BATTLE.thresholds.favorable;

  /* ======================= 1. Social classes ======================= */
  W.CLASSES = [
    { id: 'portuali', pop: 16, zh: '码头劳工', it: 'Operai del porto',        city: 0.94, note: '装卸、码头、驳船；联合工位（Sedi Riunite）的核心，对军团兵冷淡',
      noteIt: 'Scarico, banchine, chiatte; nucleo delle Sedi Riunite, freddi verso i legionari.'  },
    { id: 'operai', pop: 23, zh: '产业工人', it: 'Operai industriali',      city: 0.60, note: 'Whitehead 鱼雷厂、造船厂、炼油厂、烟草厂',
      noteIt: 'Whitehead, cantiere navale, raffineria, tabacchificio.'  },
    { id: 'artigiani', pop: 13, zh: '手工业者与小店主', it: 'Artigiani e bottegai',    city: 0.88, note: '城区小市民层：被军团兵的排场吸引，也被他们的暴力吓到',
      noteIt: 'Piccola borghesia urbana: attratta dal fasto dei legionari, spaventata dalla loro violenza.'  },
    { id: 'borghesia', pop: 14, zh: '有产精英', it: 'Ceto possidente', city: 0.92, note: '航运、保险、律师、医生；多数是自治党的人',
      noteIt: 'Armatori, assicurazioni, avvocati, medici; in maggioranza gente del partito autonomo.'  },
    { id: 'impiegati', pop: 10, zh: '知识分子', it: 'Intellettuali', city: 0.90, note: '港务局、银行、学校、报馆',
      noteIt: 'Capitaneria di porto, banche, scuole, giornali.'  },
    { id: 'contadini', pop: 15, zh: '斯拉夫农民', it: 'Contadini croati', city: 0.15, note: 'Plasse / Cosala / Drenova 等近郊与西部乡村，自治党的票仓',
      noteIt: 'Sotto-comuni e campagne occidentali (Plasse, Cosala, Drenova); serbatoio di voti autonomista.' },
    { id: 'regnicoli', pop: 9, zh: '意大利侨民', it: 'Regnicoli', city: 0.95, note: '1918 年后自意大利本土迁入；军团兵的社会基础',
      noteIt: 'Arrivati dall\'Italia dopo il 1918; base sociale dei legionari.' }
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

  /* ================= 6b. The Corporations of the Provvisori ================= */
  /* The Consiglio dei Provvisori is elected by the Corporations, not by geography.
     Each Corporation is a fixed bloc of seats (60 in total) and draws its members
     from the social classes: `members` maps a class id to the share of that class
     which belongs to this Corporation. A class may appear in several Corporations
     (impiegati sit in three of them), which is the point — the Charter's chambers
     cut across the class structure rather than replacing it.

     SEVEN, not the ten of the Charter's art. 3. De Ambris listed ten corporazioni
     (operai, cittadini, agricoltori, industriali, professionisti, dirigenti,
     insegnanti, giuristi, sanitari, volontari); this table is a gameplay
     compression of them, not the same list, and the seat figures are the design's
     own. Do not "correct" the count to ten or to the nine that secondary Italian
     sources often report: the UI prints the length of this array, so the number
     and the table can only move together. See docs/史实校验报告.md §5. */
  W.CORPORATIONS = [
    { id: 'industria',       zh: '工业工人与农业劳动者', it: 'Lavoratori dell\'industria e dell\'agricoltura', seats: 10,
      members: { operai: 0.5, contadini: 0.5 } },
    { id: 'marittimi',       zh: '海员（海上人员）',      it: 'Gente di mare',                              seats: 10,
      members: { portuali: 1.0 } },
    { id: 'datori',          zh: '雇主',                it: 'Datori di lavoro',                          seats: 10,
      members: { borghesia: 1.0 } },
    { id: 'tecnici',         zh: '农业与工业技术人员',    it: 'Tecnici agrari e industriali',               seats: 5,
      members: { impiegati: 0.6, operai: 0.4 } },
    { id: 'amministrazione', zh: '私营企业行政人员',      it: 'Personale amministrativo delle aziende private', seats: 5,
      members: { impiegati: 0.5, borghesia: 0.5 } },
    { id: 'intellettuali',   zh: '知识分子人员',          it: 'Intellettuali',                             seats: 5,
      members: { impiegati: 1.0 } },
    { id: 'cooperative',     zh: '生产、劳动与消费合作社', it: 'Cooperative di produzione, lavoro e consumo',  seats: 15,
      members: { artigiani: 0.6, operai: 0.4 } }
  ];
  W.CORPORATION_SEATS = W.CORPORATIONS.reduce(function (a, c) { return a + c.seats; }, 0);
  W.CORPORATION_BY_ID = {};
  W.CORPORATIONS.forEach(function (c) { W.CORPORATION_BY_ID[c.id] = c; });
  /* `regnicoli` — the Italians who arrived after 1918 — belong to no Corporation on
     purpose. The Corporations are producers' bodies (art. 3 of the Charter), and
     recent arrivals are not a trade. They therefore enter the Consiglio degli
     Ottimi (once `laws.cittadinanza` reaches level 3) but never the Consiglio dei
     Provvisori. That asymmetry is the design, not an omission. */

  /* The Consiglio degli Ottimi is one councillor per thousand CITIZENS, so its size
     follows the franchise rather than the population: `laws.cittadinanza` is the
     gate. Level 0 is the opening franchise — the Legion plus anyone resident before
     1918 — and each level admits another group, `regnicoli` (Italians who arrived
     after 1918) being the last. `CITY` marks the classes whose weight is the
     built-up city rather than the sub-municipalities. */
  W.CITIZENSHIP_FRANCHISE = [
    ['borghesia', 'impiegati', 'artigiani'],            /* 0: Legion + pre-1918 residents */
    ['operai'],                                         /* 1: naturalisation by language and culture */
    ['portuali', 'contadini'],                          /* 2: three years' residence */
    ['regnicoli']                                       /* 3: dual nationality */
  ];
  W.OTTIMI_PER_CITIZENS = 1000;
  W.OTTIMI_TERM_TURNS = 72;    /* three years, two half-month turns per month */

  /* ======================= 7. (reserved) ======================= */
  /* ======================= 7. Laws ======================= */
  /* Each law carries its level names in both languages (`levelIt`), because the
     dossier prints the name of the level currently in force. */
  W.LAWS = [
    { id: 'elettorale', zh: '选举法', it: 'Legge elettorale', max: 3,
      levels: ['无选举（1919 年市政议会延续）', '混合多数制（51+17 / 6+2）', '比例代表制', '普选与女性候选权'],
      levelsIt: ['Nessuna elezione (si continua il consiglio del 1919)', 'Misto maggioritario (51+17 / 6+2)', 'Rappresentanza proporzionale', 'Suffragio universale e candidabilità delle donne'] },
    { id: 'lingua', zh: '官方语言', it: 'Lingua ufficiale', max: 3,
      levels: ['仅意大利语', '意大利语与克罗地亚语并行', '意/克/匈三语', '三语 + 官方文书三语并行'],
      levelsIt: ['Solo italiano', 'Italiano e croato', 'Italiano, croato e ungherese', 'Tre lingue, anche negli atti ufficiali'] },
    { id: 'portofranco', zh: '自由港', it: 'Porto franco', max: 3,
      levels: ['无特权', '关税暂缓区', '自由港', '自由港 + 转口贸易特权'],
      levelsIt: ['Nessun privilegio', 'Zona a dazio sospeso', 'Porto franco', 'Porto franco e transito privilegiato'] },
    { id: 'cittadinanza', zh: '公民身份', it: 'Cittadinanza', max: 3,
      levels: ['军团兵与 1918 年前居民', '按语言与文化放宽入籍', '居住三年入籍', '允许双国籍'],
      levelsIt: ['Legionari e residenti prima del 1918', 'Naturalizzazione per lingua e cultura', 'Naturalizzazione dopo tre anni di residenza', 'Doppia cittadinanza ammessa'] },
    { id: 'ordine', zh: '公共秩序', it: 'Ordine pubblico', max: 3,
      levels: ['军团兵与市政警察并行', '市警扩编', '市警接受市政监督', '市警受公开程序与司法审查约束'],
      levelsIt: ['Legionari e polizia municipale affiancati', 'Polizia municipale rafforzata', 'Polizia municipale sotto vigilanza civica', 'Polizia soggetta a procedure pubbliche e controllo giudiziario'] },
    { id: 'stampa', zh: '新闻', it: 'Stampa', max: 2,
      levels: ['军团兵检查', '有限自由（须登记）', '完全自由'],
      levelsIt: ['Censura dei legionari', 'Libertà limitata (registrazione)', 'Piena libertà'] },
    { id: 'scuola', zh: '教育语言', it: 'Lingua scolastica', max: 2,
      levels: ['仅意大利语', '增设克罗地亚语班', '公立双语学校'],
      levelsIt: ['Solo italiano', 'Classi in croato', 'Scuole pubbliche bilingui'] },
    { id: 'dogana', zh: '关税', it: 'Regime doganale', max: 3,
      levels: ['被封锁的孤立港', '与意大利关税协定', '与南斯拉夫关税协定', '双协定与转口'],
      levelsIt: ['Porto isolato dal blocco', 'Accordo doganale con l\'Italia', 'Accordo doganale con la Jugoslavia', 'Entrambi gli accordi e transito'] },
    { id: 'orario', zh: '劳动时间', it: 'Orario di lavoro', max: 3,
      levels: ['无统一工时', '八小时工作制', '加班限制与每周休息', '带薪休假与工时监察'],
      levelsIt: ['Nessun orario uniforme', 'Giornata di otto ore', 'Limiti agli straordinari e riposo settimanale', 'Ferie retribuite e ispezione del lavoro'] },
    { id: 'lavoro', zh: '劳动保障', it: 'Tutele del lavoro', max: 3,
      levels: ['无保障制度', '最低工资与劳动争议调解', '疾病、失业与养老救助', '工团承认与集体合同'],
      levelsIt: ['Nessuna tutela', 'Salario minimo e conciliazione delle controversie', 'Assistenza per malattia, disoccupazione e vecchiaia', 'Riconoscimento sindacale e contratti collettivi'] },
    { id: 'fisco', zh: '财政', it: 'Ordinamento fiscale', max: 3,
      levels: ['印钞与捐献', '开征港口费', '累进所得税', '直接税 + 关税组合'],
      levelsIt: ['Stampa di moneta e offerte', 'Imposta portuale', 'Imposta sul reddito progressiva', 'Imposte dirette più dazi'] },
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
    { id: 'centro',    zh: '老城·钟楼区', it: 'Città Vecchia',   status: 'fiume', control: 78, agitation: 26, unemployment: 22, ethnicIt: 88, ethnicSl: 8,  strategic: 10, industry: 2, port: 3, note: '市政厅、Torre Civica、上诉法院、报馆；军团兵的讲台',
      noteIt: 'Municipio, Torre Civica, Corte d\'appello, giornali; il palco dei legionari.' },
    { id: 'porto',     zh: '自由港与大港', it: 'Punto Franco · Porto di Fiume', status: 'fiume', control: 70, agitation: 48, unemployment: 31, ethnicIt: 78, ethnicSl: 18, strategic: 10, industry: 9, port: 10, note: '自由港与主港的游戏合并分区；“Punto Franco”见 1919 年协约国警备分区',
      noteIt: 'Il punto franco e il porto grande, fusi in una sola circoscrizione; «Punto Franco» è la zona interalleata del 1919.' },
    { id: 'brajda',    zh: '布拉伊达－多拉茨', it: 'Braida-Dolaz', status: 'fiume', control: 72, agitation: 20, unemployment: 14, ethnicIt: 94, ethnicSl: 4, strategic: 6, industry: 3, port: 2, note: 'Brajda–Dolac 与相邻 Potok 的游戏合并分区' },
    { id: 'belvedere', zh: '贝尔维德雷',   it: 'Belvedere', status: 'fiume', control: 74, agitation: 22, unemployment: 20, ethnicIt: 90, ethnicSl: 7,  strategic: 5,  industry: 2, port: 1, note: '历史居住地 Belvedere；已移除不相邻的 Turnić 与河东 Vojak 地块',
      noteIt: 'Sede storica del Belvedere; sono stati tolti i blocchi non contigui di Turnić e Vojak.' },
    { id: 'kozala',    zh: '科萨拉',       it: 'Cosala',          status: 'fiume', control: 62, agitation: 32, unemployment: 26, ethnicIt: 82, ethnicSl: 15, strategic: 4,  industry: 4, port: 0, note: '历史地名 Cosala；地图范围取自现代社区边界，非当年行政区',
      noteIt: 'Toponimo storico Cosala; i confini sulla mappa sono quelli delle circoscrizioni moderne, non delle ripartizioni del 1919.' },
    { id: 'plase',     zh: '普拉塞', it: 'Plasse', status: 'fiume', control: 54, agitation: 50, unemployment: 29, ethnicIt: 66, ethnicSl: 30, strategic: 6, industry: 10, port: 4, note: '历史地名 Plasse；工业设施数量与工人态度为游戏设定' },
    { id: 'drenova',   zh: '德雷诺瓦',     it: 'Drenova',         status: 'fiume', control: 48, agitation: 30, unemployment: 24, ethnicIt: 30, ethnicSl: 66, strategic: 3,  industry: 1, port: 0, note: '子市镇之一，克罗地亚农村；对摄政最疏远',
      noteIt: 'Uno dei sotto-comuni, villaggio croato; il più lontano dal governo militare.' },
    { id: 'zamet',     zh: '扎梅特－坎特里达', it: 'Zamet–Cantrida',           status: 'fiume', control: 66, agitation: 24, unemployment: 23, ethnicIt: 62, ethnicSl: 34, strategic: 4,  industry: 2, port: 0, note: 'Zamet、Cantrida 一带的相邻地点合并；现代范围不代表 1919 年军团精确占领线',
      noteIt: 'Fusione dei luoghi contigui di Zamet e Cantrida; i confini moderni non riproducono la linea di occupazione legionaria del 1919.' },
    { id: 'pecine',    zh: '佩奇内',       it: 'Pecine',    status: 'yugo', control: 0, agitation: 14, unemployment: 18, ethnicIt: 20, ethnicSl: 76, strategic: 5, industry: 3, port: 3, note: 'Pećine 与相邻 Podvežica 的游戏合并范围，属于苏沙克一带；意大利占领军至 1923 年撤离' },
    { id: 'srdoci',    zh: '瑟尔多齐',     it: 'Serdozi', status: 'yugo', control: 0, agitation: 32, unemployment: 27, ethnicIt: 22, ethnicSl: 74, strategic: 7, industry: 1, port: 0, note: '卡斯塔夫辖区一带于 1919 年仍在意大利占领下，1921 年 5 月结束占领；地图随日期改变色块。游戏控制值仍代表邓南遮势力而非主权',
      noteIt: 'La zona di Castua era ancora sotto occupazione italiana nel 1919, che cessò nel maggio 1921; la mappa cambia colore con la data. Il valore di controllo indica la presenza di D\'Annunzio, non la sovranità.' },
    { id: 'susak',     zh: '苏沙克',       it: 'Sussak',          status: 'yugo',  control: 0,  agitation: 22, unemployment: 19, ethnicIt: 16, ethnicSl: 80, strategic: 8,  industry: 6, port: 6, note: 'S.H.S. 领土；意大利正规军于 1923 年 3 月 3 日撤离，主权不等同于实际占领',
      noteIt: 'Territorio del Regno S.H.S.; l\'esercito italiano si ritirò il 3 marzo 1923. Sovranità e occupazione effettiva non coincidono.' },
    { id: 'tersatto',  zh: '特尔萨特',     it: 'Tersatto',        status: 'yugo',  control: 0,  agitation: 10, unemployment: 21, ethnicIt: 20, ethnicSl: 76, strategic: 7,  industry: 1, port: 1, note: 'Trsat 与相邻 Vojak、Gornja Vežica 的游戏合并范围；已移除西侧 Grbci',
      noteIt: 'Fusione di Trsat con i contigui Vojak e Gornja Vežica; il lato ovest di Grbci è stato tolto.' },
    { id: 'valle',     zh: '埃内奥河谷',   it: "Valle dell'Eneo", status: 'yugo',  control: 0,  agitation: 8,  unemployment: 24, ethnicIt: 10, ethnicSl: 86, strategic: 6,  industry: 2, port: 1, note: 'Pašac、Svilno、Orehovica 一带的上游河谷；已移除东南侧不相邻的 Sveti Kuzam',
      noteIt: 'La valle a monte di Pašac, Svilno e Orehovica; il lato sud-orientale non contiguo di Sveti Kuzam è stato tolto.' }
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
    /* The keys in `state.diplo` are the ids here. Cards have been writing
       `diplo: { soviet: ... }` all along while this row was still called
       `comintern`, which worked only because nothing read it by name — the list
       is what the diplomacy screen renders. The actor is the Soviet state, not
       the International, so the id now matches the key. */
    { id: 'soviet',     zh: '苏联',         it: 'Russia sovietica', init: 4, color: '#B0202F' }
  ];

  W.POSTURES = [
    { id: 'roma',        zh: '与罗马周旋',   it: 'Trattare con Roma',
      desc: '改善与意大利王国的关系，同时疏远南斯拉夫。',
      descIt: 'Migliora i rapporti con il Regno d\'Italia e raffredda quelli con la Jugoslavia.' },
    { id: 'equidistant', zh: '等距',         it: 'Equidistanza',
      desc: '不押注任何邻国；两边关系缓慢下滑，英法略有改善。',
      descIt: 'Nessuna scommessa su un vicino: entrambi i rapporti scendono lentamente, Regno Unito e Francia migliorano un poco.' },
    { id: 'belgrade',    zh: '与贝尔格莱德', it: 'Aprire a Belgrado',
      desc: '改善与南斯拉夫的关系，代价是罗马的信任。',
      descIt: 'Migliora i rapporti con la Jugoslavia al prezzo della fiducia di Roma.' },
    { id: 'internation', zh: '争取国际支持', it: 'Internazionalizzare Fiume',
      desc: '向协约国与国际联盟靠拢，两邻国的关系转冷。',
      descIt: 'Si guarda all\'Intesa e alla Società delle Nazioni; i due vicini si raffreddano.' }
  ];

  /* Base change on each half-month turn. Both settlement and the diplomacy
     dossier read this table, so the displayed posture never drifts from rules. */
  W.POSTURE_DRIFT = {
    roma: { italy: 0.8, yugoslavia: -0.6, uk: -0.1, france: -0.1 },
    equidistant: { italy: -0.25, yugoslavia: -0.3, uk: 0.05, france: 0.05 },
    belgrade: { yugoslavia: 0.8, italy: -0.6, league: -0.1 },
    internation: { uk: 0.55, france: 0.55, usa: 0.4, league: 0.7, italy: -0.5, yugoslavia: -0.3 }
  };

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
  /* `dateRule` decides how an event that CARRIES a `date` is scheduled. Three
     modes, read by `Eng.pickEvent`:
       'forced'        — the calendar wins. A dated event fires in its own month
                         whether or not its own condition is ready; if it carries
                         a condition too, the date still takes precedence over the
                         condition's timing (the condition is only a gate, not a
                         scheduler). This is 史实.
       'conditionFirst'— the condition wins. A dated event is scheduled like any
                         other conditional event, on its condition alone, with no
                         calendar gate; the date is ignored for scheduling. This is
                         what 普通 and 沙盒 use.
       'dateOnly'      — the calendar is the only scheduler, and only for events
                         that have a date AND no condition. A dated event that also
                         carries a condition is NOT scheduled by this pass (it is
                         picked up by the condition pass instead).
     `dated` is gone: it could only express the first two of these. */
  W.DIFFICULTIES = [
    { id: 'historical', zh: '史实', it: 'Storico', ap: 2, hand: 4, dateRule: 'forced', coupMul: 1.00,
      note: '带日期的事件一律按历史年月推入（同时有日期与条件时，日期优先）。默认线：1920 年 12 月血腥圣诞，1921 年 4 月失去议会多数。',
      noteIt: 'Gli eventi con data entrano all\'anno e al mese storici (la data ha la precedenza sulla condizione). Linea predefinita: Natale di sangue nel dicembre 1920, perdita della maggioranza nell\'aprile 1921.' },
    { id: 'open',       zh: '普通', it: 'Normale', ap: 2, hand: 4, dateRule: 'conditionFirst', coupMul: 0.85,
      note: '同时有日期与条件的事件改按条件触发；只有日期、没有条件的事件仍按历史年月推入。摄政有可能活下来。',
      noteIt: 'Gli eventi che hanno data e condizione passano alla condizione; quelli con la sola data entrano comunque all\'anno storico. La Reggenza può sopravvivere.' },
    /* Sandbox triggers events exactly like `open` (`dateRule` is identical): what
       sandbox changes is the CARD side — hand 5 and the pick-a-card draw instead
       of the random draw — plus coupMul and the debug panel. */
    { id: 'sandbox',    zh: '沙盒', it: 'Sandbox', ap: 2, hand: 5, dateRule: 'conditionFirst', coupMul: 0.50,
      note: '事件触发同普通难度；可指定抽牌，解锁调试面板，不授予成就。',
      noteIt: 'Gli eventi scattano come in Normale; si sceglie la carta da pescare, si sblocca il pannello di debug e non si ottengono obiettivi.' }
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
    { id: 'fascisti',   zh: '意大利法西斯党', it: 'Partito Nazionale Fascista', init: 38, color: '#8F4124', allied: true, gate: 80, men: 12000,
      note: '法西斯战斗团。已经在向右转，把阜姆当成障碍而不是跳板。',
      noteIt: 'I Fasci di combattimento. Girano già a destra: Fiume è per loro un ostacolo, non un trampolino.' },
    { id: 'socialisti', zh: '意大利社会党',   it: 'Partito Socialista',   init: 32, color: '#B0202F', allied: true, gate: 80, men: 18000,
      note: '最高纲领派主流。1921 年 1 月里窝那分裂之前，这是意大利最大的党。',
      noteIt: 'La corrente massimalista. Prima della scissione di Livorno, nel gennaio 1921, è il primo partito d\'Italia.' },
    { id: 'anarchici',  zh: '意大利无政府主义者', it: 'Anarchici italiani', init: 30, color: '#070000', allied: true, gate: 80, men: 6000,
      note: '马拉泰斯塔的《新人类》网络。1920 年一度接近阜姆，看到「最坏的敌人倾向」占上风就走。',
      noteIt: 'La rete di «Umanità Nova» attorno a Malatesta. Nel 1920 si avvicina a Fiume, poi se ne allontana quando vede prevalere «le peggiori tendenze nemiche».' },
    { id: 'comunisti',  zh: '意大利共产党',   it: 'Partito Comunista',    init: 24, color: '#A31621', allied: true, gate: 80, men: 8000,
      note: '《新秩序报》一翼。1921 年 1 月自社会党分裂而出，把阜姆斥为小资产阶级的煽情民族主义。',
      noteIt: 'L\'ala dell\'«Ordine Nuovo». Nasce dalla scissione del gennaio 1921 e bolla Fiume come nazionalismo piccolo-borghese e melodrammatico.' },
    { id: 'corradini',  zh: '意大利民族主义协会', it: 'Associazione Nazionalista Italiana', init: 34, color: '#b58e0d', allied: true, gate: 80, men: 10000,
      note: '科拉迪尼的协会。要的是一个由「最优秀者」统治的意大利——而阜姆正在演那一幕。',
      noteIt: 'L\'associazione di Corradini. Vuole un\'Italia governata dai «migliori», e a Fiume quella scena è già in corso.' },
    { id: 'sindacalisti', zh: '意大利革命工团主义者', it: 'Sindacalisti rivoluzionari italiani', init: 30, color: '#a02c06', allied: true, gate: 80, men: 14000,
      note: '德·安布里斯在意大利的工会与革命工团主义网络。',
      noteIt: 'La rete di sindacati e di sindacalismo rivoluzionario di De Ambris in Italia.' },
    { id: 'forzearmate', zh: '意大利军官团', it: 'Corpo ufficiale italiano', init: 22, color: '#6B4E9E', allied: false, gate: 60 }
  ];
  /* `men` is how many men each movement can actually put on the road in 1920 —
     not its membership. These are design values, tuned so the mass organisations
     (the PSI, the syndicalist unions, the fasci) are worth more than the fringe
     groups in the final headcount. They live here, not in the event, so the
     epilogue's tally, the ending and the docs read the same figures. */
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
     forces are carried each turn. 50 is the journal's own floor; the panel's
     "可维系" band reads the same constant, so the two can no longer disagree. */
  W.FORZA_FRONT_MIN = 50;
  /* When each dated approach becomes available, as {y, m}, and when it
     stops being available. Without a window per force the conversations
     resolve on the same turn — RESOLVE_EVENT does not advance the clock — which
     would dump the whole antagonism on the player at once and leave no room to
     choose an order or to decline one. The windows are spread across the
     journal's life (July 1920 – March 1922) so at most one approach opens per
     month; each approach is `once`, so the window cannot be farmed. They close
     with the journal's own deadline, now 28 October 1922. */
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

  /* ======================= 14c. The march's own arithmetic ======================= */
  /* The 1920 march has two outcomes, and the epilogue is a headcount rather than
     a score. The journal's three gates buy the departure; this decides the arrival.

       support = Σ over forces at 80+ of (relationship × the force's men)
               + (officer relationship × ITALIAN_ARMY)
               + (milizia × (1 - factionDissent))
       oppose  = Σ over forces below 80 of (relationship × the force's men)
               + ((1 - officer relationship) × ITALIAN_ARMY)

     The relationship is the force's `forze` value divided by 100 and clamped to
     0..1. A force below 80 is not with you, and the share of it that is mobilized
     marches against you; a force at zero has no men on the road. A force that has
     gone negative has turned: it puts all its men on the opposing side (the game's
     -40 floor is fully hostile, not absent). That makes the near-allies (70-79)
     the most dangerous: they have the men and the grievance. The officer corps
     splits the army by its own relationship; the Legion is discounted by the
     movement's influence-weighted dissent. A tie goes to the defence (the column
     stops). */
  W.MARCIA_DEADLINE = { y: 1922, m: 10, d: 28 };
  W.MARCIA_BALANCE = { ally: 80 };
  /* The force Rome can actually put on the road against a column, not the nominal
     size of the Royal Army. 30,000 keeps the officer term comparable to the
     Legion (10,000) and to the factions (6,000-18,000 each); raise it and the
     officer corps dominates the final count. */
  W.ITALIAN_ARMY = 30000;

  /* Has the march been overtaken by Mussolini's own march on Rome? This is the
     journal's hard deadline: after 28 October 1922 the question is no longer
     Fiume's. A coup in Fiume closes it earlier, on the same flag the rest of the
     game uses for the fascist takeover. */
  W.marciaClosed = function (state) {
    if (state.flags && state.flags.coup_done) return true;
    var d = state.date || {};
    var dl = W.MARCIA_DEADLINE;
    if (!d.y || !d.m) return false;
    if (d.y > dl.y) return true;
    if (d.y < dl.y) return false;
    if (d.m > dl.m) return true;
    if (d.m < dl.m) return false;
    return (d.d || 1) >= dl.d;
  };

  /* The arithmetic of the final night. Returns the two camps, the lists behind
     them, the three components of each side and the verdict, so the epilogue's
     tally and the ending itself can never disagree about who was on which side. */
  W.marciaBalance = function (state) {
    var z = state.forze || {};
    var front = W.availableForzaFront(state);
    var allyGate = W.MARCIA_BALANCE.ally;
    var allies = [], enemies = [];
    var forceSupport = 0, forceOppose = 0;
    function rel(v) { return Math.max(0, Math.min(1, (v || 0) / 100)); }
    front.forEach(function (id) {
      var def = W.FORZA_BY_ID[id] || {};
      var raw = z[id] || 0;
      /* 0 is neutral and stays home; a negative attitude has turned and puts
         all its men on the opposing side. */
      var r = raw < 0 ? 1 : rel(raw);
      var men = def.men || 0;
      var score = r * men;
      if (raw >= allyGate) {
        allies.push({ id: id, value: raw, rel: r, men: men, score: score });
        forceSupport += score;
      } else {
        enemies.push({ id: id, value: raw, rel: r, men: men, score: score });
        forceOppose += score;
      }
    });
    var officerRaw = z.forzearmate || 0;
    var officerRel = rel(officerRaw);
    var army = W.ITALIAN_ARMY || 0;
    var officerSupport = officerRel * army;
    var officerOppose = (1 - officerRel) * army;
    var F = (typeof globalThis !== 'undefined' ? globalThis : this).Fiume || {};
    var R = F.Rules;
    var dissent = (R && R.factionDissent) ? R.factionDissent(state) / 100 : 0;
    dissent = Math.max(0, Math.min(1, dissent));
    var milizia = state.order ? (state.order.milizia || 0) : 0;
    var legion = milizia * (1 - dissent);
    var support = forceSupport + officerSupport + legion;
    var oppose = forceOppose + officerOppose;
    return {
      support: support, oppose: oppose, margin: support - oppose,
      win: support > oppose,
      forceSupport: forceSupport, forceOppose: forceOppose,
      officer: officerRaw, officerRel: officerRel,
      officerSupport: officerSupport, officerOppose: officerOppose,
      army: army, dissent: dissent, legion: legion, milizia: milizia,
      allies: allies, enemies: enemies
    };
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
