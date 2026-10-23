/* ==========================================================================
   内容层 · 日志 / 成就 / 结局（卡尔纳罗摄政）
   ========================================================================== */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.Meta = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var M = {};

  /* The Carta is a programme assembled from ordinary laws, never a law level
     of its own. Keep the requirements in one place for journal logic and UI. */
  M.CHARTER_REQUIREMENTS = [
    { id: 'elettorale', level: 3, zh: '选举法', it: 'Legge elettorale' },
    { id: 'lingua', level: 1, zh: '官方语言', it: 'Lingua ufficiale' },
    { id: 'cittadinanza', level: 2, zh: '公民身份', it: 'Cittadinanza' },
    { id: 'ordine', level: 2, zh: '公共秩序', it: 'Ordine pubblico' },
    { id: 'stampa', level: 2, zh: '新闻', it: 'Stampa' },
    { id: 'scuola', level: 1, zh: '教育语言', it: 'Lingua scolastica' },
    { id: 'lavoro', level: 3, zh: '劳动保障', it: 'Tutele del lavoro' }
  ];

  /* ======================= Journals ======================= */
  M.JOURNALS = [
    {
      id: 'impresa', zh: '事业的第一年', it: 'Il primo anno dell\'Impresa',
      desc: { zh: '把两千五百人的占领变成一个能维持秩序的存在——在别人来收拾之前。',
              it: 'Trasformare l\'occupazione di duemilacinquecento uomini in qualcosa capace di mantenere l\'ordine.' },
      start: { zh: '军团兵进入阜姆', it: 'I legionari entrano a Fiume' },
      active: { zh: '每月 +0.3 权威；法西斯派 +0.125~0.275（其余四派按比例让出，零和）', it: '+0,3 autorità; i fascisti +0,125~0,275 (le altre quattro cedono in proporzione)' },
      goal: {
        complete: [{ zh: '军团民意 ≥ 58', it: 'legittimità ≥ 58' },
                   { zh: '摄政权威 ≥ 55', it: 'autorità ≥ 55' }],
        fail: [{ zh: '1920 年 6 月之后「且」摄政权威 < 32', it: 'dopo giugno 1920 e autorità < 32' }]
      },
      outcome: {
        onComplete: [{ zh: '摄政权威 +8，政治暴力 −6', it: 'autorità +8, violenza −6' },
                     { zh: '英法关系 +5', it: 'Regno Unito e Francia +5' }],
        onFail: [{ zh: '摄政权威 −6，政治暴力 +8', it: 'autorità −6, violenza +8' }]
      },
      complete: function (s) { return s.legitimacy >= 58 && s.order.authority >= 55; },
      fail: function (s) { return (s.date.y > 1920 || (s.date.y === 1920 && s.date.m >= 6)) && s.order.authority < 32; },
      /* Historical drift, declared rather than hidden. `impresa` is the journal
         that starts on the first turn and covers the 1919–20 legionary period,
         which is exactly the span the drift describes: the fascists keep growing
         inside the movement while the syndicalists, arditi, futurists and
         irredentists slowly give ground. It used to live in the engine as
         R.factionDrift, applied unconditionally every turn — an automatic change
         with no journal or law to point at. It is now a visible monthly effect,
         and the panel prints it.
         Influence moves by zero-sum transfer (R.adjustFactionInfluence), so the
         four give up exactly what the fascists take. */
      monthly: function (s) {
        var ym = s.date.y * 12 + s.date.m;
        var f = s.factions;
        if (!f || !f.fascisti || !f.sindacalisti) return { order: { authority: 0.3 } };
        var grow = ym < 1920 * 12 + 9 ? 0.125 : 0.275;
        if (s.flags.natale_done) grow *= 1.3;
        if (s.laws.ordine >= 2) grow *= 1.2;
        var d = Math.min(grow, Math.max(0.02, f.sindacalisti.inf * 0.06));
        return {
          order: { authority: 0.3 },
          factions: {
            fascisti: { inf: d },
            sindacalisti: { inf: -d * 0.62 },
            arditi: { inf: -d * 0.22 },
            futuristi: { inf: -d * 0.16 },
            irredentisti: { inf: -d * 0.22 }
          }
        };
      },
      onComplete: function () { return { order: { authority: 8, violence: -6 }, diplo: { uk: 5, france: 5 }, flags: { impresa_consolidated: true } }; },
      onFail: function () { return { order: { authority: -6, violence: 8 } }; }
    },
    {
      id: 'comune_italiana', zh: '城市的同意', it: 'Il consenso della città',
      desc: { zh: '让这座城市真的同意你在这里——包括那些说克罗地亚语的人。',
              it: 'Fare in modo che questa città acconsenta davvero alla tua presenza: anche quelli che parlano croato.' },
      start: { zh: '市政选举举行', it: 'Le elezioni municipali si tengono' },
      active: { zh: '每月降低本地人异议', it: 'Riduce il dissenso dei fiumani' },
      goal: {
        complete: [{ zh: '工团派异议 < 22', it: 'dissenso sindacalista < 22' },
                   { zh: '军团民意 ≥ 55', it: 'legittimità ≥ 55' }],
        fail: [{ zh: '工团派异议 > 72', it: 'dissenso sindacalista > 72' }]
      },
      outcome: {
        onComplete: [{ zh: '有产精英、斯拉夫农民、知识分子支持军团 各 +4 / +4 / +3', it: 'ceto possidente, contadini, intellettuali verso la Legione +4 / +4 / +3' }],
        onFail: [{ zh: '有产精英与斯拉夫农民支持军团 各 −6', it: 'ceto possidente e contadini verso la Legione −6' }]
      },
      complete: function (s) { return s.factions.sindacalisti.dis < 22 && s.legitimacy >= 55; },
      fail: function (s) { return s.factions.sindacalisti.dis > 72; },
      monthly: function () { return { factions: { sindacalisti: { dis: -0.7 } } }; },
      onComplete: function () { return { support: [['borghesia', 'LEG', 4], ['contadini', 'LEG', 4], ['impiegati', 'LEG', 3]], flags: { city_consent: true } }; },
      onFail: function () { return { support: [['borghesia', 'LEG', -6], ['contadini', 'LEG', -6]] }; }
    },
    {
      id: 'carta', zh: '实施《卡尔纳罗宪章》', it: 'Applicare la Carta del Carnaro',
      desc: { zh: '德·安布里斯的草案是一组待落实的法律；先颁布、召开阿伦戈，再逐条完成核心制度。港口、关税和财政等法律仍可独立推进。',
              it: 'Il progetto di De Ambris richiede leggi concrete: promulgazione, Arengo e attuazione delle norme fondamentali. Porto, dogane e fisco restano autonomi.' },
      start: { zh: '德·安布里斯提出立法纲领', it: 'De Ambris presenta il programma legislativo' },
      active: { zh: '每月工团派异议 −0.8', it: 'dissenso sindacalista −0,8 al mese' },
      goal: {
        complete: [{ zh: '正式颁布宪章并召开阿伦戈', it: 'Promulgare la Carta e convocare l\'Arengo' }]
          .concat(M.CHARTER_REQUIREMENTS.map(function (r) {
            return { zh: r.zh + ' ≥ ' + r.level + ' 级', it: r.it + ' ≥ livello ' + r.level };
          })),
        fail: []
      },
      outcome: {
        onComplete: [{ zh: '国联 +8，法国 +4；解锁「法律成为宪章」成就', it: 'Società delle Nazioni +8, Francia +4; obiettivo Carta attuata' }],
        onFail: []
      },
      complete: function (s) {
        return !!s.flags.charter_promulgated && !!s.flags.charter_debate_resolved &&
          M.CHARTER_REQUIREMENTS.every(function (r) { return (s.laws[r.id] || 0) >= r.level; });
      },
      monthly: function () { return { factions: { sindacalisti: { dis: -0.8 } } }; },
      onComplete: function () { return { flags: { carta_done: true }, diplo: { league: 8, france: 4 } }; }
    },
    {
      id: 'porto', zh: '港口复兴', it: 'La rinascita del porto',
      desc: { zh: '把吞吐指数从 30 拉回 75 以上（1913 = 100）。',
              it: 'Riportare l\'indice di traffico da 30 a oltre 75 (1913 = 100).' },
      start: { zh: '摄政宣布港口复兴计划', it: 'La Reggenza annuncia il piano per il porto' },
      active: { zh: '每月 +0.5 港口工程', it: '+0,5 opere portuali al mese' },
      goal: {
        complete: [{ zh: '吞吐指数 ≥ 75', it: 'indice di traffico ≥ 75' }],
        fail: [{ zh: '第 11 个月之后吞吐指数仍 < 18', it: 'dopo l\'11º mese l\'indice resta < 18' }]
      },
      outcome: {
        onComplete: [{ zh: '失业率 −6，资本信心 +12', it: 'disoccupazione −6, fiducia del capitale +12' },
                     { zh: '解锁「港口回来了」成就与结局判定', it: 'sblocca il finale del porto' }],
        onFail: [{ zh: '人口 −800（全城开始离开）', it: 'popolazione −800' }]
      },
      complete: function (s) { return s.economy.traffic >= 75; },
      fail: function (s) { return s.economy.traffic < 18 && s.monthIndex > 11; },
      monthly: function () { return { economy: { works: 0.5, unemployment: -0.1 } }; },
      onComplete: function () { return { economy: { unemployment: -6, capitalConfidence: 12 }, flags: { porto_revived: true } }; },
      onFail: function () { return { economy: { population: -800 } }; }
    },
    {
      id: 'garanzia', zh: '国际保证', it: 'La garanzia internazionale',
      desc: { zh: '让英法美共同保证阜姆的中立与独立——这是唯一能挡住罗马的东西。',
              it: 'Ottenere una garanzia congiunta di Gran Bretagna, Francia e Stati Uniti: è l\'unica cosa che ferma Roma.' },
      start: { zh: '日内瓦渠道建立', it: 'Canale di Ginevra aperto' },
      active: { zh: '每月 +0.4 国联关系', it: '+0,4 Società delle Nazioni al mese' },
      goal: {
        complete: [{ zh: '英国 ≥ 65，法国 ≥ 65，美国 ≥ 60', it: 'Regno Unito ≥ 65, Francia ≥ 65, Stati Uniti ≥ 60' },
                   { zh: '完成《卡尔纳罗宪章》日志', it: 'Completare il diario della Carta del Carnaro' }],
        fail: [{ zh: '血腥圣诞之后「且」第 9 个月之后「且」国联 < 30', it: 'dopo il Natale di sangue, dopo il 9º mese, Società delle Nazioni < 30' }]
      },
      outcome: {
        onComplete: [{ zh: '国联 +12', it: 'Società delle Nazioni +12' },
                     { zh: '解锁「日内瓦的赌注」与「亚得里亚的但泽」结局线', it: 'sblocca la via di Ginevra e il finale di Danzica' }],
        onFail: [{ zh: '国联 −6', it: 'Società delle Nazioni −6' }]
      },
      complete: function (s) { return s.diplo.uk >= 65 && s.diplo.france >= 65 && s.diplo.usa >= 60 && !!s.flags.carta_done; },
      fail: function (s) { return !!s.flags.natale_done && s.monthIndex > 9 && s.diplo.league < 30; },
      monthly: function () { return { diplo: { league: 0.4 }, economy: { recognition: 0.3 } }; },
      onComplete: function () { return { flags: { international_guarantee: true }, diplo: { league: 12 } }; },
      onFail: function () { return { diplo: { league: -6 } }; }
    },
    {
      id: 'elezioni', zh: '制宪议会', it: 'L\'Assemblea Costituente',
      desc: { zh: '在 1921 年 4 月的选举中活下来——最好还赢。',
              it: 'Sopravvivere alle elezioni dell\'aprile 1921 — e possibilmente vincerle.' },
      start: { zh: '选举法公布', it: 'Legge elettorale pubblicata' },
      active: { zh: '每月军团兵力 +20', it: 'milizia +20 al mese' },
      goal: {
        complete: [{ zh: '已举行过选举', it: 'almeno un\'elezione tenuta' },
                   { zh: '军团席位 ≥ 30', it: 'seggi della Legione ≥ 30' }],
        fail: [{ zh: '已举行过选举「且」军团席位 < 12', it: 'elezione tenuta e seggi della Legione < 12' }]
      },
      outcome: {
        onComplete: [{ zh: '摄政权威 +6', it: 'autorità +6' },
                     { zh: '解锁「制度陷阱」成就（保住 30 席以上）', it: 'sblocca l\'obiettivo dei trenta seggi' }],
        onFail: [{ zh: '摄政权威 −6', it: 'autorità −6' }]
      },
      complete: function (s) { return s.counters.electionsHeld >= 1 && (s.assembly.LEG || 0) >= 30; },
      fail: function (s) { return s.counters.electionsHeld >= 1 && (s.assembly.LEG || 0) < 12; },
      monthly: function () { return { order: { milizia: 20 } }; },
      onComplete: function () { return { order: { authority: 6 }, flags: { seat_held: true } }; },
      onFail: function () { return { order: { authority: -6 } }; }
    },
    {
      id: 'cassa', zh: '阜姆券', it: 'I buoni di Fiume',
      desc: { zh: '贴现银行印的钱撑住了围城，也可能毁掉这座城市。把通胀压到 12 以下并还清债务。',
              it: 'Il denaro della Cassa di Sconto ha sostenuto l\'assedio e può rovinare la città. Tenere l\'inflazione sotto 12 e rientrare dal debito.' },
      start: { zh: '贴现银行开始发行阜姆券', it: 'La Cassa di Sconto emette buoni' },
      active: { zh: '每月 +18 K£，但通胀压力上升', it: '+18 K£ al mese, ma l\'inflazione sale' },
      goal: {
        complete: [{ zh: '通胀 < 12%', it: 'inflazione < 12' },
                   { zh: '债务 < 1800 K£', it: 'debito < 1800 K£' }],
        fail: [{ zh: '通胀 > 45%', it: 'inflazione > 45' }]
      },
      outcome: {
        onComplete: [{ zh: '资本信心 +12，通胀 −4', it: 'fiducia del capitale +12, inflazione −4' },
                     { zh: '解锁「不印钞的政府」成就', it: 'sblocca l\'obiettivo della moneta sana' }],
        onFail: [{ zh: '资本信心 −20，人口 −600', it: 'fiducia del capitale −20, popolazione −600' }]
      },
      complete: function (s) { return s.economy.inflation < 12 && s.economy.debt < 1800; },
      fail: function (s) { return s.economy.inflation > 45; },
      monthly: function () { return { funds: 18, economy: { inflation: 0.25 } }; },
      onComplete: function () { return { economy: { capitalConfidence: 12, inflation: -4 }, flags: { sound_money: true } }; },
      onFail: function () { return { economy: { capitalConfidence: -20, population: -600 } }; }
    },
    {
      id: 'riconciliazione', zh: '与本地人和解', it: 'La riconciliazione con i fiumani',
      desc: { zh: '你是在别人的城市里革命。让自治派相信你不会把这座城市烧掉。',
              it: 'Stai facendo la rivoluzione nella città di altri. Convincere gli autonomi che non brucerai la città.' },
      start: { zh: '和解路线开启', it: 'La via della conciliazione si apre' },
      active: { zh: '每月降低本地人异议', it: 'Riduce il dissenso dei fiumani' },
      goal: {
        complete: [{ zh: '工团派异议 < 16', it: 'dissenso sindacalista < 16' },
                   { zh: '官方语言 ≥ 1 级（意/克并行）', it: 'lingua ufficiale ≥ livello 1' }],
        fail: [{ zh: '工团派异议 > 70', it: 'dissenso sindacalista > 70' }]
      },
      outcome: {
        onComplete: [{ zh: '有产精英与斯拉夫农民支持军团 各 +4', it: 'ceto possidente e contadini verso la Legione +4' },
                     { zh: '解锁「三次语言」成就', it: 'sblocca l\'obiettivo delle tre lingue' }],
        onFail: [{ zh: '有产精英与斯拉夫农民支持军团 各 −5', it: 'ceto possidente e contadini verso la Legione −5' }]
      },
      complete: function (s) { return s.factions.sindacalisti.dis < 16 && s.laws.lingua >= 1; },
      fail: function (s) { return s.factions.sindacalisti.dis > 70; },
      monthly: function () { return { factions: { sindacalisti: { dis: -0.6 } } }; },
      onComplete: function () { return { support: [['borghesia', 'LEG', 4], ['contadini', 'LEG', 4]], flags: { reconciled: true } }; },
      onFail: function () { return { support: [['borghesia', 'LEG', -5], ['contadini', 'LEG', -5]] }; }
    },
    {
      id: 'movimento', zh: '把军团兵变成运动', it: 'Dai legionari al movimento',
      desc: { zh: '三千个名字，散布在意大利各地，每年聚一次。让他们变成组织，或者看着法西斯替你做这件事。',
              it: 'Tremila nomi sparsi per l\'Italia, un raduno all\'anno. Farne un\'organizzazione, o lasciare che il Fascio lo faccia per te.' },
      start: { zh: '军团兵网络开始政党化', it: 'La rete legionaria si organizza' },
      active: { zh: '每月军团兵力 +40', it: 'milizia +40 al mese' },
      goal: {
        complete: [{ zh: '阿迪蒂影响力 ≥ 24', it: 'influenza degli arditi ≥ 24' },
                   { zh: '已打出「军团兵政党」事件', it: 'rete legionaria trasformata in partito' }],
        fail: [{ zh: '法西斯派影响力 ≥ 22（运动被右翼接收）', it: 'influenza fascista ≥ 22' }]
      },
      outcome: {
        onComplete: [{ zh: '军团兵力 +300，法西斯小队 −8', it: 'milizia +300, squadre −8' }],
        onFail: [{ zh: '阿迪蒂异议 +18，法西斯小队 +10', it: 'dissenso degli arditi +18, squadre +10' }]
      },
      complete: function (s) { return s.factions.arditi.inf >= 24 && !!s.flags.legion_party; },
      fail: function (s) { return s.factions.fascisti.inf >= 22; },
      monthly: function () { return { order: { milizia: 40 } }; },
      onComplete: function () { return { order: { milizia: 300, squadre: -8 }, flags: { movement_built: true } }; },
      onFail: function () { return { factions: { arditi: { dis: 18 } }, order: { squadre: 10 } }; }
    },
    {
      id: 'esilio', zh: '长夜里的集会', it: 'Le adunate nella notte lunga',
      desc: { zh: '让被赶出省督府的运动继续存在，并且继续开会。',
              it: 'Tenere in vita, e in assemblea, un movimento cacciato dal Palazzo.' },
      start: { zh: '运动转入流亡', it: 'Il movimento passa in esilio' },
      active: { zh: '每月 +0.5 国际合法性', it: '+0,5 legittimità internazionale al mese' },
      goal: {
        complete: [{ zh: '流亡月数 ≥ 24', it: 'mesi di esilio ≥ 24' }],
        fail: []
      },
      outcome: {
        onComplete: [{ zh: '解锁「长夜里的集会」结局', it: 'sblocca il finale dell\'esilio' }],
        onFail: []
      },
      complete: function (s) { return (s.counters.exileMonths || 0) >= 24; },
      fail: function () { return false; },
      monthly: function () { return { diplo: { league: 0.5 } }; },
      onComplete: function () { return { flags: { exile_endured: true } }; },
      onFail: function () { return {}; }
    },
    {
      id: 'resistenza', zh: '留在城里', it: 'Restare in città',
      desc: { zh: '不流亡。留在佩奇内的住所，继续做那个名字。',
              it: 'Non partire. Restare nella residenza di Pećine e continuare a essere quel nome.' },
      start: { zh: '拒绝离开', it: 'Rifiuto della partenza' },
      active: { zh: '每月提升热忱、削弱法西斯控制', it: '+fervore, −controllo fascista' },
      goal: {
        complete: [{ zh: '法西斯小队 < 25', it: 'squadre < 25' },
                   { zh: '留城月数 ≥ 18', it: 'mesi di permanenza ≥ 18' }],
        fail: [{ zh: '政治暴力 > 85', it: 'violenza > 85' }]
      },
      outcome: {
        onComplete: [{ zh: '解锁「留在佩奇内」成就与「长夜里的集会」结局', it: 'sblocca l\'obiettivo e il finale della permanenza' }],
        onFail: [{ zh: '运动被粉碎（crushed）', it: 'il movimento viene schiacciato' }]
      },
      complete: function (s) { return s.order.squadre < 25 && (s.counters.resistMonths || 0) >= 18; },
      fail: function (s) { return s.order.violence > 85; },
      monthly: function () { return { order: { squadre: -0.6, fervour: 0.4 }, support: [['operai', 'LEG', 0.2], ['artigiani', 'LEG', 0.2]] }; },
      onComplete: function () { return { flags: { passive_victory: true } }; },
      onFail: function () { return { flags: { crushed: true } }; }
    },
    {
      id: 'marcia_1920', zh: '向罗马进军', it: 'La marcia su Roma',
      desc: { zh: '1919 年 9 月有人提过这个计划，1920 年 6 月它第二次被提出来。这一次罗马没有尼蒂，' +
          '只有一个刚上台的焦利蒂，和一支刚刚在阜姆面前退过一次的军队。' +
          '问题是：要把社会党人、无政府主义者、共产党人、法西斯主义者、民族主义者和革命工团主义者放进同一支纵队，' +
          '你得让彼此敌视的六股力量至少有三股与你同行。但到了出发前夜，决定成败的不是名单，' +
          '而是名单背后的人数：每一股能带多少人上车，军官团能拉走多少陆军，军团自己还剩多少。',
              it: 'Nel settembre 1919 qualcuno lo propose. Nel giugno 1920 lo si propone una seconda volta. ' +
          'Questa volta a Roma non c\'è Nitti, ma un Giolitti appena insediato, e un esercito che davanti a Fiume ' +
          'ha già ceduto una volta. Il problema è tenere nella stessa colonna socialisti, anarchici, ' +
          'comunisti, fascisti, nazionalisti e sindacalisti rivoluzionari: almeno tre devono seguirti. ' +
          'Ma alla vigilia non decide la lista: decidono gli uomini — quelli che ogni forza porta, ' +
          'quelli che il corpo ufficiale porta via all\'esercito, quelli che la Legione riesce ancora a mettere in strada.' },
      start: { zh: '决定串联全国的反政府力量', it: 'Si decide di collegare le forze antisistema' },
      active: { zh: '每半回合向关系 ≥ 50 的前三股力量各 +3.2；军官团立场随兵力浮动；出发前夜按各股人数、军官团与军团兵力对比判定成败', it: '+3,2 per mezzo turno alle tre forze più vicine (≥ 50); il corpo ufficiale segue la milizia. Alla vigilia decidono gli uomini: le forze, il corpo ufficiale, la Legione' },
      goal: {
        complete: [{ zh: '军团兵力 ≥ 10 000', it: 'milizia ≥ 10.000' },
                   { zh: '与意大利军官团的默契 ≥ 60', it: 'intesa con il corpo ufficiale ≥ 60' },
                   { zh: '六股意大利政治力量中，至少三股关系 ≥ 80（意共成立后计入）', it: 'almeno tre delle sei forze politiche italiane ≥ 80 (il PCdI conta dopo la fondazione)' }],
        fail: [{ zh: '到 1922 年 10 月 28 日仍未达成（墨索里尼已经进军罗马），或法西斯已经进城', it: 'non raggiunto entro il 28 ottobre 1922 (Mussolini è già a Roma), o quando i fascisti sono già in città' }]
      },
      outcome: {
        onComplete: [{ zh: '开启「进军罗马」终局链', it: 'si apre l\'epilogo: la marcia su Roma' },
                     { zh: '民众热忱 +12、领袖权威 +6', it: 'fervore +12, autorità +6' }],
        onFail: [{ zh: '已存在的政治力量关系各 −25，军官团 −15（阵线瓦解）', it: 'forze politiche esistenti −25, corpo ufficiale −15' },
                 { zh: '军团兵力 −1 500（逃散）', it: 'milizia −1.500' },
                 { zh: '法西斯派影响力 +6（墨索里尼接管了这场运动）', it: 'influenza fascista +6' },
                 { zh: '若因 1922-10-28 逾期，则这场进军已经属于另一个人', it: 'se il termine del 28 ottobre 1922 è scaduto, la marcia appartiene già a un altro' }]
      },
      /* Only the best-placed forces are carried; the rest are left out. The
         front and the number required live in world.js (W.FORZA_FRONT /
         W.FORZA_FRONT_NEEDED) because the journal's own rule, the September
         window and the epilogue all have to agree on who counts — adding a
         new force there must not require four separate edits here.
         The per-month figure is what makes "three of them" reachable at all:
         measured in .analysis/probe_reference_play.js, a competent player gets
         two forces over the line from the conversations alone, and holding a
         coalition together for the remaining months is what carries the third. */
      monthly: function (s) {
        var z = s.forze || {};
        var W = ((typeof globalThis !== 'undefined' ? globalThis : this).Fiume || {}).World || {};
        var front = W.availableForzaFront(s);
        var carry = W.FORZA_FRONT_NEEDED || 3;
        var floor = W.FORZA_FRONT_MIN == null ? 50 : W.FORZA_FRONT_MIN;
        var ids = front
          .filter(function (k) { return (z[k] || 0) >= floor; })
          .sort(function (a, b) { return (z[b] || 0) - (z[a] || 0); })
          .slice(0, carry);
        var out = {};
        /* Each turn consolidates the three strongest existing partners. */
        ids.forEach(function (k) { out[k] = 3.2; });
        return { forze: out };
      },
      complete: function (s) {
        var z = s.forze || {};
        var W = ((typeof globalThis !== 'undefined' ? globalThis : this).Fiume || {}).World || {};
        /* The deadline outranks completion. On 31 October 1922 the column could
           still, arithmetically, meet the three gates — but Mussolini has already
           been in Rome since the 28th, and the question is no longer Fiume's. So a
           last-minute completion must not be allowed to win on the same
           settlement that the deadline closes. */
        if (W.marciaClosed && W.marciaClosed(s)) return false;
        var front = W.availableForzaFront(s);
        var n = front.filter(function (k) { return (z[k] || 0) >= 80; }).length;
        return s.order.milizia >= 10000 && (z.forzearmate || 0) >= 60 && n >= (W.FORZA_FRONT_NEEDED || 3);
      },
      /* The deadline is 28 October 1922, the day Mussolini's own march reached
         Rome. Before that, the only other way to close the journal is the fascist
         takeover in Fiume (`coup_done`), which the rest of the game already treats
         as a hard ending. Because `complete` refuses to fire once the deadline has
         passed, `fail` can simply return the closed state: there is no race left
         to lose by a single turn. */
      fail: function (s) {
        var W = ((typeof globalThis !== 'undefined' ? globalThis : this).Fiume || {}).World || {};
        return !!(W.marciaClosed && W.marciaClosed(s));
      },
      onComplete: function () { return { flags: { marcia_1920_open: true }, order: { fervour: 12, authority: 6 } }; },
      onFail: function (s) {
        var W = ((typeof globalThis !== 'undefined' ? globalThis : this).Fiume || {}).World || {};
        var front = W.availableForzaFront(s);
        var hit = { forzearmate: -15 };
        front.forEach(function (k) { hit[k] = -25; });
        return {
          forze: hit,
          order: { milizia: -1500, fervour: -14 },
          factions: { fascisti: { inf: 6 } },
          flags: {
            marcia_1920_failed: true,
            /* Distinguish "Mussolini got there first" from "the fascists took
               Fiume": the first is the historical deadline, the second is the
               internal coup. Only the first is the 1922 march overtaking you. */
            marcia_1920_overtaken: !s.flags.coup_done && !!(W.marciaClosed && W.marciaClosed(s))
          }
        };
      }
    }
  ];
  M.JOURNAL_BY_ID = {};
  M.JOURNALS.forEach(function (j) { M.JOURNAL_BY_ID[j.id] = j; });

  /* ======================= Endings ======================= */
  /* `route` groups every ending under the strategic line it belongs to, so the
     14 outcomes read as four destinations rather than as a flat list:
       annexione  并入意大利 —— the historical answer: Fiume becomes Italian.
       marcia     向罗马进军   —— carry the Legion south instead.
       carnaro    卡尔纳罗摄政 —— keep the city, implement the Charter, survive.
       collapse   崩溃         —— the city empties, or is taken from within.
     The tag stays as the tone label it always was (历史/胜利/失败/架空/崩溃/未完);
     `route` is the structural one. Checked by .analysis/check_routes.js. */
  M.ENDINGS = [
    {
      id: 'ending_silent_port', priority: 1, route: 'collapse', zh: '无声的港口', it: 'Il porto silenzioso', tag: '崩溃',
      body: { zh: '没有投降书，没有政变，没有条约。只是码头空了，户籍册一页一页地被划掉。到 1927 年，这座城市比 1920 年少了将近五分之一的人。\n\n' +
          '后来的人会说：阜姆不是被谁拿走的，它是自己走掉的。而那个在阳台上念宪法的人，早就回加尔达湖了。',
          it: 'Nessuna resa, nessun colpo di Stato, nessun trattato. Solo i moli vuoti e i registri anagrafici cancellati pagina per pagina. Nel 1927 la città ha quasi un quinto di abitanti in meno rispetto al 1920.\n\n' +
          'Diranno che Fiume non se l\'è presa nessuno: se n\'è andata da sola. E che l\'uomo che leggeva la Carta dal balcone era tornato sul Garda da un pezzo.' },
      check: function (s) { return s.economy.population < 44000; }
    },
    {
      id: 'ending_fuga', priority: 2, route: 'annexione', zh: '诗人离开', it: 'Il Poeta se ne va', tag: '历史',
      body: { zh: '1921 年 1 月 18 日，你登上了一列开往威尼斯的火车。城里到处是弹坑和传单，军团兵正在离开。\n\n' +
          '自由邦成立了。一个临时政府接管了市政厅，成员全部来自兼并列的国民集团。宪法没有生效。\n\n' +
          '"我走了，"你后来写道，"但没有投降。"',
          it: 'Il 18 gennaio 1921 sali su un treno per Venezia. La città è piena di crateri e di volantini, i legionari se ne stanno andando.\n\n' +
          'Nasce lo Stato libero. Un governo provvisorio prende il Municipio, composto interamente dal Blocco Nazionale annessionista. La Carta non entra in vigore.\n\n' +
          '"Me ne vado," scriverai poi, "ma non mi arrendo."' },
      check: function (s) { return s.flags.dannunzio_left; }
    },
    /* `ending_natale` ("Natale di sangue", priority 3) was removed here. It asked
       for `flags.martyred && order.milizia < 300`, and `martyred` has exactly one
       source — `ev_natale_fight: b` — which costs a flat 1 800 men. The Legion's
       headcount is replenished by the settlement itself
       (`clamp(round(revenue * 0.8), 60, 900)` per half-month, reducers.js), so by
       the December 1920 window the floor is above 5 000; the check could not be
       satisfied. Since `checkEnd` began settling the moment a condition is met it
       became doubly unreachable, because `ending_silent_port` (priority 1) closes
       any run that lets the population fall — and the Bloody Christmas window is
       in that run's future. The historical event itself is untouched; it simply no
       longer carries an ending of its own (the chain still ends in `ending_fuga`
       or in the post-siege political game). */
    {
      id: 'ending_fascio', priority: 4, route: 'annexione', zh: '法西斯城邦', it: 'La città fascista', tag: '失败',
      body: { zh: '君塔的小队、霍斯特-文图里的军团兵旧部、罗马的预算。阜姆成为意大利法西斯主义的第一座"解放"城市——比埃塞俄比亚早十四年，比阿尔巴尼亚早十七年。\n\n' +
          '1919 年从 Ronchi 走来的那批人的名字被从街牌上刮掉，换上了另一个人的名字。那个人的诗你读过，而且你比他写得好。',
          it: 'Le squadre di Giunta, i vecchi legionari di Host-Venturi, il bilancio di Roma. Fiume diventa la prima città "liberata" dal fascismo italiano: quattordici anni prima dell\'Etiopia, diciassette prima dell\'Albania.\n\n' +
          'I nomi di quelli che nel 1919 partirono da Ronchi vengono raschiati dalle targhe stradali e sostituiti con il nome di un altro. Un uomo i cui versi hai letto, e che scriveva peggio di te.' },
      check: function (s) { return s.flags.coup_done && !s.flags.exile && !s.flags.stay; }
    },
    /* `ending_marcia` ("Da Fiume a Roma", priority 5) was removed here. It was
       unreachable by construction: its only trigger was ev_marcia, which sets
       both march_on_rome and coup_done, and ev_coup fires in March 1922 while
       ev_1922_10_roma is dated October 1922 — a game that reaches the October
       event has already ended at the March coup, and checkEnd settles any state
       with coup_done immediately. The 1920 march below is the surviving march
       line; see docs/内容梳理与路线重构方案.md §2.2. */
    /* The 1920 march now has two outcomes, both on the `marcia` route:
       `ending_marcia_1920_win` (the column arrives) and `ending_marcia_1920`
       ("la notte lunga", the column stops). Which one is reached is decided in
       `ev_romafronte_epilogo` by `W.marciaBalance`: the attitudes of the forces
       that march with you plus the officer corps, against the hostility of the
       forces you left out plus the officer corps' hostile share. The journal's
       three gates only buy the departure; the balance decides the arrival.
       Both are priority 4, beside "法西斯城邦" (4), and both exclude `coup_done`
       so a game already taken by Mussolini cannot claim either. Success is listed
       first so a stable sort prefers it if a corrupted state ever sets both
       outcome flags. */
    {
      id: 'ending_marcia_1920_win', priority: 4, route: 'marcia', zh: '进军罗马 · 荣冠', it: 'La marcia su Roma: il lauro', tag: '胜利',
      body: { zh: '第六天傍晚，纵队进入罗马。没有巷战。\n\n' +
          '焦利蒂在最后一刻宣布戒严，但驻军没有开出营房。撒丁掷弹兵的旧账被翻了出来：' +
          '军官团里有一半人拒绝向从阜姆来的那支队伍开枪。国王在奎里纳莱宫接见了你，' +
          '没有要求你解散军团，只问了一句：你想把这个人带去哪里？\n\n' +
          '你没有宣布共和国，也没有要求王位。你要的是一届制宪议会，' +
          '把《卡尔纳罗宪章》的第一条——劳动——写进这个国家的法律。\n\n' +
          '焦利蒂下台。新政府在四十天后组成：外交部长是一个你从都灵请来的人，' +
          '司法部长是一个无政府主义者，战争部长是一个法西斯。他们在一间屋子里坐了三个月，然后各自离开。\n\n' +
          '宪章没有成为意大利的宪法。但它成了之后二十年所有制宪会议的参照：' +
          '劳动是第一条款，港口归城市，音乐归国家。\n\n' +
          '法西斯分子是最后离开的那一批。他们带走了讲台、口号，' +
          '和那套把一万人送上火车的办法。两年后，墨索里尼在同一个广场上宣布自己成功了。' +
          '这一次他不用再向阜姆学习——他是从你的政府里走出来的。',
          it: 'La sera del sesto giorno la colonna entra a Roma. Nessuna battaglia per le strade.\n\n' +
          'Giolitti proclama lo stato d\'assedio all\'ultimo momento, ma il presidio non esce dalle caserme. ' +
          'Il conto dei granatieri di Sardegna torna fuori: metà del corpo ufficiale rifiuta di sparare su quelli ' +
          'che vengono da Fiume. Il re ti riceve al Quirinale; non ti chiede di sciogliere la Legione, ' +
          'chiede solo: dove vuoi portare quest\'uomo?\n\n' +
          'Non proclami la Repubblica e non chiedi il trono. Chiedi un\'Assemblea costituente che scriva ' +
          'nell\'ordinamento dello Stato il primo articolo della Carta del Carnaro: il lavoro.\n\n' +
          'Giolitti cade. Il nuovo governo nasce quaranta giorni dopo: agli Esteri un uomo che hai chiamato ' +
          'da Torino, alla Giustizia un anarchico, alla Guerra un fascista. Restano nella stessa stanza tre mesi, ' +
          'poi se ne vanno uno per uno.\n\n' +
          'La Carta non diventa la Costituzione d\'Italia. Diventa però il riferimento di tutte le costituenti ' +
          'dei vent\'anni successivi: il lavoro come primo articolo, il porto alla città, la musica come ' +
          'istituzione dello Stato.\n\n' +
          'I fascisti sono gli ultimi a uscire. Si portano via il palco, gli slogan e il metodo per caricare ' +
          'diecimila uomini su un treno. Due anni dopo, Mussolini annuncia il proprio successo nella stessa piazza. ' +
          'Questa volta non ha più bisogno di imparare da Fiume: è uscito dal tuo governo.' },
      check: function (s) { return !!s.flags.marcia_1920_win && !s.flags.coup_done; }
    },
    {
      id: 'ending_marcia_1920', priority: 4, route: 'marcia', zh: '进军罗马 · 长夜', it: 'La marcia su Roma: la notte lunga', tag: '失败',
      body: { zh: '纵队从阜姆出发时有一万一千人，到博洛尼亚时剩下不到四千。罗马没有宣布戒严——' +
          '它不需要。焦利蒂只是把铁路时刻表改了，把桥封了两座，然后等。\n\n' +
          '第六天，在台伯河以北的乡间，纵队停下来，因为没有粮食了。' +
          '没有战斗，没有投降书，只有一场雨和一次投票：军官团回去了，无政府主义者解散了，' +
          '共产党人发表了声明，法西斯分子第二天就走了——他们走的时候带走了方法。\n\n' +
          '两年后在罗马，另一个人用完全相同的部署成功了：同样的纵队、同样的铁路、' +
          '同样的「向罗马进军」。他从阜姆学到的东西，比从你这里学到的多。',
          it: 'La colonna parte da Fiume in undicimila; a Bologna ne restano meno di quattromila. ' +
          'Roma non proclama lo stato d\'assedio: non serve. Giolitti cambia gli orari ferroviari, ' +
          'chiude due ponti, e aspetta.\n\n' +
          'Il sesto giorno, nella campagna a nord del Tevere, la colonna si ferma perché non c\'è più da mangiare. ' +
          'Nessun combattimento, nessuna resa: solo una pioggia e una votazione. Gli ufficiali tornano indietro, ' +
          'gli anarchici si sciolgono, i comunisti pubblicano un comunicato, i fascisti partono il giorno dopo — ' +
          'e partendo si portano via il metodo.\n\n' +
          'Due anni più tardi, a Roma, un altro riesce con lo stesso schieramento: la stessa colonna, ' +
          'le stesse ferrovie, la stessa "marcia su Roma". Da Fiume ha imparato più di quanto abbia imparato da te.' },
      check: function (s) { return !!s.flags.marcia_1920 && !s.flags.marcia_1920_win && !s.flags.coup_done; }
    },
    {
      /* The diplomatic arm of the 1924 crisis — the counterpart of
         `ending_eviction`. `eviction` is the city being TAKEN (December 1920, the
         Royal Army in the streets); this is the city being SIGNED AWAY (January
         1924, the Treaty of Rome accepted). Both are the historical outcome, and
         they are deliberately different endings because the Regency's own act is
         what differs: one is done to it, the other is done by it.
         Priority 6 puts it just above `ending_eviction` (7) and below the crisis
         endings (3.5 / 4), which is right: it is reached from the 1924 node by
         choosing to accept, and nothing else competes for that state because
         `ev_natale_stalemate:riaprire` is the only other source and it forces
         `ev_natale_after` instead. */
      id: 'ending_annexation', priority: 6, route: 'annexione', zh: '吞并', it: 'L\'annessione', tag: '历史',
      body: { zh: '1924 年 1 月 27 日，罗马与贝尔格莱德签署《罗马条约》。2 月 22 日批准生效。\n\n' +
          '3 月 16 日，维托里奥·埃马努埃莱三世进城。没有巷战，没有炮击，没有二十二具尸体——' +
          '只有一份文件，和一支在广场上奏乐的军乐团。\n\n' +
          '你在文件上签了字。不是为了换取什么条款，而是因为你知道剩下的选择会让这座城市挨炮弹。' +
          '摄政到这里结束：它签字把自己交了出去。\n\n' +
          '扎内拉的流亡议会宣布条约"在国际法上无效且不可接受"，并继续存在到 1950 年代。' +
          '城里的人后来争论了几十年：那到底是投降，还是一个人替一座城挡下了一场屠杀。',
          it: 'Il 27 gennaio 1924 Roma e Belgrado firmano il Trattato di Roma. Ratifica il 22 febbraio.\n\n' +
          'Il 16 marzo Vittorio Emanuele III entra in città. Nessuna battaglia per le strade, nessun bombardamento, ' +
          'nessun ventidue morti: solo un documento, e una banda che suona in piazza.\n\n' +
          'Hai firmato tu. Non per ottenere qualcosa, ma perché sapevi che le alternative restanti avrebbero portato ' +
          'le artiglierie in città. La Reggenza finisce qui: firma la propria consegna.\n\n' +
          'L\'Assemblea in esilio di Zanella dichiara il trattato «giuridicamente inaccettabile e invalido» e continua ' +
          'a esistere fino agli anni Cinquanta. In città se ne discute per decenni: fu una resa, o un uomo che si prese ' +
          'il massacro che toccava alla sua città?' },
      check: function (s) { return !!s.flags.annexation; }
    },
    {
      /* priority 3.5, ahead of `ending_fascio` (4): both fire on the same event
         (the fascist coup), and which one you get is how violent its aftermath
         was. `fascio` says `coup_done && !exile && !stay` — which was ALSO true
         of the civil-strife state — so at priority 6 the stalemate could never
         be reached: the docile occupation always won the tie. The stalemate is
         the more specific description, so it is judged first. */
      id: 'ending_civil_strife', priority: 3.5, route: 'collapse', zh: '内战僵局', it: 'Lo stallo sanguinoso', tag: '崩溃',
      body: { zh: '政变成功了，但没有结束任何事情。军团兵的街区与法西斯的街区之间隔着一道谁也不敢越过的线。意大利驻军在两方之间站着，谁也不帮，谁也不走。\n\n' +
          '这座城市在接下来二十年里一直记得那三年。',
          it: 'Il colpo di Stato è riuscito e non ha concluso nulla. Fra i quartieri legionari e i quartieri fascisti c\'è una linea che nessuno osa superare. Il presidio italiano sta in mezzo: non aiuta nessuno, non se ne va.\n\n' +
          'La città ricorderà quei tre anni per i successivi venti.' },
      check: function (s) { return (s.flags.coup_done && s.order.violence > 70) || s.flags.bloody_stalemate; }
    },
    {
      /* Was `ending_historical` ("Il corso della storia"), then briefly
         `ending_bloody_history`. Renamed and re-hung: it used to be a GLOBAL
         condition (`treaty_rome || exile`) that swallowed every other ending
         whenever a game reached 1924, which is why it had to be deliberately
         avoided in order to reach anything else.
         It is now ONLY the FAILURE arm of the siege chain — `ev_natale_lose` sets
         `bloody_history` and forces this ending. What it narrates is the armed
         eviction of December 1920: the Royal Army clearing the streets and the
         Regency's authority going with them.
         `treaty_rome` and `exile` were dropped from the check on purpose: the
         design reads the 1920 eviction, not the 1924 treaty, as this ending, and
         the treaty path is the fascist coup's business (see ev_1924_01_rome). */
      id: 'ending_eviction', priority: 7, route: 'annexione', zh: '武装驱离', it: 'Lo sfratto armato', tag: '失败',
      body: { zh: '1920 年 12 月 29 日，圣斯蒂法诺日，皇家陆军走完了最后一条街。\n\n' +
          '二十二名军团兵、十七名意大利士兵、五名平民。这个数字不大，但它足够让罗马在接下来的三年里，' +
          '把阜姆当作一个需要被解决的问题而不是一个国家。\n\n' +
          '《卡尔纳罗宪章》从阳台上被念过一次，再没有生效。军团兵被打散：一部分退回老城，' +
          '一部分脱下制服混进人群，一部分在码头上等着被运走。摄政的权威随着最后一条街一起消失了。\n\n' +
          '这不是条约，是一场驱离。城里的人后来把它记成"那些兵进来把我们的国家搬走了"。',
          it: 'Il 29 dicembre 1920, giorno di Santo Stefano, il Regio Esercito percorre l\'ultima via.\n\n' +
          'Ventidue legionari, diciassette soldati italiani, cinque civili. Non è un numero grande, ma basta perché Roma, ' +
          'per i tre anni successivi, tratti Fiume come un problema da risolvere e non come uno Stato.\n\n' +
          'La Carta del Carnaro è stata letta dal balcone una volta, e non è mai entrata in vigore. ' +
          'I legionari vengono dispersi: una parte ripiega sulla città vecchia, una parte si toglie la divisa e si mescola alla folla, ' +
          'una parte aspetta al molo di essere imbarcata. L\'autorità della Reggenza se ne va con l\'ultima via.\n\n' +
          'Non è un trattato, è uno sfratto. In città lo ricordano così: «sono entrati e si sono portati via il nostro Stato».' },
      /* `flags.resigned` was dropped from this check: nothing in the repository
         ever set it, so it was a branch that could not be taken. */
      check: function (s) { return !!s.flags.bloody_history; }
    },
    {
      /* `lavoro >= 3 && fisco >= 2` alone was too cheap: it fires the moment the
         Carta journal closes — 1920, if the player simply signs the programme —
         and it then preempted every Carnaro-route ending behind it (`danzig` 10,
         `fiume_o_morte` 10.5) because the route shares the `carta_done` gate.
         The two additions say what this ending is actually about: a republic run
         by the syndicalists — their weight INSIDE the movement
         (`factions.sindacalisti.inf >= 60`) and a real alliance with the Italian
         revolutionary syndicalists OUTSIDE it (`forze.sindacalisti >= 55`) — not
         merely a constitution with a labour clause. */
      id: 'ending_comune', priority: 8, route: 'carnaro', zh: '阜姆公社', it: 'La Comune di Fiume', tag: '架空',
      body: { zh: '《卡尔纳罗宪章》不是被朗诵的，是被执行的。法团院开会，最优者议会立法，七个执政官由议会选举产生，音乐成为国家制度，劳动写进第一条。\n\n' +
          '工厂归工人的合作社，港口归码头工人的联营，土地归耕它的人。德·安布里斯在 1920 年写下的那些句子，第一次具有法律效力。\n\n' +
          '莫斯科说这"不伦不类"；罗马说这"不可容忍"；日内瓦什么也没说，但把它登记了。',
          it: 'La Carta del Carnaro non viene recitata: viene applicata. Il Consiglio dei Provvisori si riunisce, quello degli Ottimi legifera, sette Rettori sono eletti, la musica diventa istituzione dello Stato, il lavoro entra nell\'articolo primo.\n\n' +
          'Le fabbriche alle cooperative operaie, il porto ai consorzi dei portuali, la terra a chi la lavora. Le frasi che De Ambris scrisse nel 1920 hanno, per la prima volta, forza di legge.\n\n' +
          'Mosca la chiama "ibrida"; Roma "intollerabile"; Ginevra non dice nulla, ma la registra.' },
      check: function (s) {
        return s.flags.carta_done && s.laws.lavoro >= 3 && s.laws.fisco >= 2 && !s.flags.coup_done &&
          s.factions.sindacalisti.inf >= 60 && (s.forze.sindacalisti || 0) >= 55;
      }
    },
    /* `ending_yugoslav` ("La porta jugoslava", priority 9) was removed here. It
       was unreachable: its check read `flags.federation` and
       `flags.belgrade_path`, and a repository-wide search found neither flag set
       anywhere. The political content — a Fiume that joins the Kingdom of the
       Serbs, Croats and Slovenes as an autonomous unit — is a real 1920
       possibility and worth rebuilding later, but it needs a route attached to
       it (a Belgrade-facing chain through gv_dogana_yu / ev_baross_talks) rather
       than an ending with no way to arrive. See
       docs/内容梳理与路线重构方案.md §2.1 and §3.3. */
    /* `ending_danzig` ("La Danzica dell'Adriatico", priority 10) was removed here
       and became the achievement `ach_danzig` below. It could not be reached once
       `ending_comune` (8) gained its syndicalist gates: the two share the
       `carta_done` gate, so commune still closed first, and a joint guarantee
       registered at Geneva is something a run ACHIEVES rather than a way it ends.
       See the achievement's own note. */
    /* `ending_venice` ("La seconda Venezia") was removed here and became the
       achievement `ach_venice` below. As an ending it was an attractor: its
       condition (free port III, traffic ≥ 85, syndicalist influence ≥ 20) is
       satisfied by any competent trading run as early as 1920, and once `checkEnd`
       began settling the moment a condition was met it preempted every ending with
       a lower priority number — including `ending_historical` and
       `ending_civil_strife`, which stopped being reachable at all. */
    /* `ending_exile_endured` ("Le adunate nella notte lunga", priority 13) was
       removed here. Its window was arithmetically impossible: `ev_coup` cannot
       fire before 1922-03, so a 24-month exile or an 18-month resistance reaches
       its close in 1924-03 at the earliest, while `ev_1924_01_rome` sets
       `treaty_rome` in 1924-01 and `ending_historical` (7) settles then. It missed
       by two months, every run. The exile/resistance journals themselves are
       untouched — they still run and still shape the game. */
    {
      /* priority 10.5. It used to sit between `danzig` (10) and `carnaro` (11);
         both have since been removed, so this is now the last Carnaro-route
         outcome — the ending for a city still standing when the clock runs out.
         Its own gate is December 1924, which is `MAX_END` itself. */
      id: 'ending_fiume_o_morte', priority: 10.5, route: 'carnaro', zh: '阜姆或死亡！', it: 'Fiume o morte!', tag: '胜利',
      body: { zh: '1927 年 12 月。城还在。\n\n' +
          '它有一部以劳动、选举与公民权利立法落实的宪法、两个邻国的贸易协定、一份在国联登记的条约，以及一个回到战前九成吞吐量的港口。\n\n' +
          '广场上的雕像是一个写诗的人。街上的人说三种语言。每年 9 月 12 日，从意大利来的老兵会走过 Ronchi 的那段路，然后在省督府的阳台上，找一个年轻人念一段宪法。\n\n' +
          '念完之后，他们会一起喊那句 1919 年的口号。它听起来仍然像一句威胁，也仍然像一句承诺。',
          it: 'Dicembre 1927. La città è ancora qui.\n\n' +
          'Ha una costituzione attuata nelle leggi del lavoro, del voto e dei diritti civili, accordi commerciali con entrambi i vicini, un trattato registrato a Ginevra, e un porto tornato al novanta per cento del traffico anteguerra.\n\n' +
          'La statua in piazza è quella di un uomo che scriveva versi. Per strada si parlano tre lingue. Ogni 12 settembre i reduci arrivano dall\'Italia lungo la strada di Ronchi, e dal balcone del Palazzo un giovane legge un articolo della Carta.\n\n' +
          'Poi gridano tutti insieme lo slogan del 1919. Suona ancora come una minaccia, e ancora come una promessa.' },
      check: function (s) { return s.flags.porto_revived && s.economy.traffic >= 85 && !s.flags.coup_done && s.flags.carta_done && (s.date.y > 1924 || (s.date.y === 1924 && s.date.m >= 12)); }
    },
    {
      id: 'ending_timer', priority: 99, route: 'collapse', zh: '尚未落幕', it: 'Non ancora concluso', tag: '未完',
      body: { zh: '时间到了，故事没有结束。', it: 'Il tempo è scaduto, la storia no.' },
      check: function () { return true; }
    }
  ];

  /* ======================= Achievements ======================= */
  M.ACHIEVEMENTS = [
    { id: 'ach_balcony',   zh: '阳台上的国家', it: 'Uno Stato dal balcone', desc: { zh: '正式颁布《卡尔纳罗宪章》。', it: 'Promulgare la Carta del Carnaro.' } },
    { id: 'ach_arengo',    zh: '阿伦戈',       it: 'L\'Arengo', desc: { zh: '召开一次由最优者议会与临时者议会合并的市民大会。', it: 'Convocare l\'Arengo riunito.' } },
    { id: 'ach_carta_implemented', zh: '法律成为宪章', it: 'La Carta diventa legge', desc: { zh: '颁布宪章、召开阿伦戈，完成宪章日志要求的七项法律。', it: 'Promulgare la Carta, convocare l\'Arengo e completare le sette leggi richieste dal diario.' } },
    { id: 'ach_comune',    zh: '劳动的共和国', it: 'La Repubblica del lavoro', desc: { zh: '劳动保障 ≥ 3、财政法 ≥ 2、民众热忱 ≥ 70，且工团派影响力 ≥ 60。', it: 'Tutele del lavoro ≥ 3, legge fiscale ≥ 2, fervore popolare ≥ 70 e influenza dei sindacalisti ≥ 60.' } },
    { id: 'ach_survive',   zh: '活过圣诞',     it: 'Sopravvivere al Natale', desc: { zh: '在 1921 年 3 月之后仍然掌权。', it: 'Restare al potere dopo il marzo 1921.' } },
    { id: 'ach_disarm',    zh: '解除侧翼的武装', it: 'Disarmare l\'ala', desc: { zh: '解除法西斯小队武装。', it: 'Disarmare le squadre fasciste.' } },
    { id: 'ach_seats',     zh: '制度陷阱',     it: 'La trappola istituzionale', desc: { zh: '在 1921 年的选举中保住 30 席以上。', it: 'Conservare più di 30 seggi alle elezioni del 1921.' } },
    { id: 'ach_geneva',    zh: '日内瓦的赌注', it: 'La scommessa di Ginevra', desc: { zh: '拿到英法美共同保证。', it: 'Ottenere la garanzia congiunta di UK, Francia e USA.' } },
    { id: 'ach_port',      zh: '港口回来了',   it: 'Il porto è tornato', desc: { zh: '吞吐指数 ≥ 75。', it: 'Indice di traffico ≥ 75.' } },
    { id: 'ach_sound',     zh: '不印钞的政府', it: 'Un governo che non stampa', desc: { zh: '通胀 < 12 且债务 < 1800 K£。', it: 'Inflazione < 12 e debito < 1800 K£.' } },
    { id: 'ach_reconcile', zh: '三次语言',     it: 'In tre lingue', desc: { zh: '与本地人和解并把双语写进法律。', it: 'Riconciliarsi con i fiumani e mettere il bilinguismo nella legge.' } },
    { id: 'ach_stay',      zh: '留在佩奇内',   it: 'Restare a Pećine', desc: { zh: '被逐出省督府后仍留在城里，坚持 18 个月。', it: 'Restare in città dopo la cacciata dal Palazzo per 18 mesi.' } },
    { id: 'ach_eia_alala', zh: 'Eia, Eia, Alalà!', it: 'Eia, Eia, Alalà!', desc: { zh: '民众热忱达到 100，且领袖权威达到 65。', it: 'Raggiungere 100 di fervore popolare e 65 di autorità del Comandante.' } },
    { id: 'ach_empty',     zh: '一千个空房子', it: 'Mille case vuote', desc: { zh: '人口流失达到 5000 人。', it: 'Perdere 5.000 abitanti.' } },
    { id: 'ach_calm',      zh: '不流血的三年', it: 'Tre anni senza sangue', desc: { zh: '政治暴力始终低于 15 直到 1924 年。', it: 'Violenza politica sempre sotto 15 fino al 1924.' } },
    { id: 'ach_dissent',   zh: '四派同桌', it: 'Quattro correnti a un tavolo', desc: { zh: '四个派系的整体异议始终低于 10。', it: 'Dissenso complessivo sempre sotto 10.' } },
    /* Was `ending_danzig`; see the note where that entry used to sit in ENDINGS.
       Same condition. A neutral Fiume guaranteed by all three powers and
       registered at Geneva is a diplomatic achievement, and as an ending it was
       permanently behind `ending_comune` (8), which shares the `carta_done` gate. */
    { id: 'ach_danzig',    zh: '亚得里亚的但泽', it: 'La Danzica dell\'Adriatico', desc: { zh: '拿到英法美共同保证，并完成《卡尔纳罗宪章》——让宪章在国联登记。', it: 'Ottenere la garanzia congiunta di UK, Francia e USA e completare la Carta del Carnaro: registrarla a Ginevra.' } },
    /* Was `ending_venice`; see the note where that entry used to sit in ENDINGS.
       Same condition minus the `!coup_done` guard, which only made sense for an
       ending (a city under a fascist takeover has no port policy of its own). */
    { id: 'ach_venice',    zh: '第二个威尼斯', it: 'La seconda Venezia', desc: { zh: '自由港法 ≥ 3 级、吞吐指数 ≥ 85，且工团派影响力 ≥ 20——把这座城市变回一个港口。', it: 'Porto franco ≥ 3, indice di traffico ≥ 85 e influenza dei sindacalisti ≥ 20: ridare a questa città un porto.' } },
    { id: 'ach_o_morte',   zh: '自由未烬',     it: 'Libertà non estinta', desc: { zh: '达成「阜姆或死亡！」结局。', it: 'Raggiungere il finale "Fiume o morte!".' } }
  ];

  return M;
});
