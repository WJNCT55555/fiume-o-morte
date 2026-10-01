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
          '你得让彼此敌视的六股力量至少有三股与你同行。',
              it: 'Nel settembre 1919 qualcuno lo propose. Nel giugno 1920 lo si propone una seconda volta. ' +
          'Questa volta a Roma non c\'è Nitti, ma un Giolitti appena insediato, e un esercito che davanti a Fiume ' +
          'ha già ceduto una volta. Il problema è tenere nella stessa colonna socialisti, anarchici, ' +
          'comunisti, fascisti, nazionalisti e sindacalisti rivoluzionari: almeno tre devono seguirti.' },
      start: { zh: '决定串联全国的反政府力量', it: 'Si decide di collegare le forze antisistema' },
      active: { zh: '每月向关系最好的三股力量各 +3；军官团立场随兵力浮动', it: '+3 al mese alle tre forze più vicine; il corpo ufficiale segue la milizia' },
      goal: {
        complete: [{ zh: '军团兵力 ≥ 10 000', it: 'milizia ≥ 10.000' },
                   { zh: '与意大利军官团的默契 ≥ 60', it: 'intesa con il corpo ufficiale ≥ 60' },
                   { zh: '六股意大利政治力量中，至少三股关系 ≥ 80（意共成立后计入）', it: 'almeno tre delle sei forze politiche italiane ≥ 80 (il PCdI conta dopo la fondazione)' }],
        fail: [{ zh: '1922 年 3 月之后仍未达成，或法西斯已经进城', it: 'dopo marzo 1922, o quando i fascisti sono già in città' }]
      },
      outcome: {
        onComplete: [{ zh: '开启「进军罗马」终局链', it: 'si apre l\'epilogo: la marcia su Roma' },
                     { zh: '未结盟的力量转为敌对', it: 'le forze escluse passano all\'ostilità' }],
        onFail: [{ zh: '已存在的政治力量关系各 −25，军官团 −15（阵线瓦解）', it: 'forze politiche esistenti −25, corpo ufficiale −15' },
                 { zh: '军团兵力 −1 500（逃散）', it: 'milizia −1.500' },
                 { zh: '法西斯派影响力 +6（墨索里尼接管了这场运动）', it: 'influenza fascista +6' }]
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
        var ids = front
          .filter(function (k) { return (z[k] || 0) >= 50; })
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
        var front = W.availableForzaFront(s);
        var n = front.filter(function (k) { return (z[k] || 0) >= 80; }).length;
        return s.order.milizia >= 10000 && (z.forzearmate || 0) >= 60 && n >= (W.FORZA_FRONT_NEEDED || 3);
      },
      /* Mutually exclusive with `complete` on purpose: a journal whose complete
         and fail are both true in one turn resolves as complete, so the deadline
         must not be able to fire on the same turn the conditions are met.
         The deadline is March 1922, not a date of my own choosing: the engine
         fires the historical march on Rome in October 1922, and after the
         fascists are in the Palazzo the question is moot. */
      fail: function (s) {
        /* `> 1922-03` rather than `>= 1922-03`: months are half-turns, so on the
           first turn of March 1922 the date has already flipped to m === 3 while
           the month's own settlements are still running. Failing on `>= 3` fired
           the deadline one turn before the last settlement that can complete it,
           which made the journal unwinnable by a single turn. */
        var closed = s.flags.coup_done || s.date.y > 1922 || (s.date.y === 1922 && s.date.m > 3);
        if (!closed) return false;
        var z = s.forze || {};
        var W = ((typeof globalThis !== 'undefined' ? globalThis : this).Fiume || {}).World || {};
        var front = W.availableForzaFront(s);
        var n = front.filter(function (k) { return (z[k] || 0) >= 80; }).length;
        return !(s.order.milizia >= 10000 && (z.forzearmate || 0) >= 60 && n >= (W.FORZA_FRONT_NEEDED || 3));
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
          flags: { marcia_1920_failed: true }
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
    {
      id: 'ending_natale', priority: 3, route: 'collapse', zh: '血腥圣诞', it: 'Natale di sangue', tag: '失败',
      body: { zh: '炮弹落在省督府的那一天，这座城市就已经结束了它作为一个独立国家的历史。\n\n' +
          '二十二名军团兵、十七名意大利士兵、五名平民。这个数字不大，但它足够让罗马在接下来的三年里，把阜姆当作一个需要被解决的问题而不是一个国家。\n\n' +
          '自由邦在 1924 年 2 月 22 日被《罗马条约》正式取消。',
          it: 'Il giorno in cui la granata cade sul Palazzo, questa città ha già finito la sua storia di Stato indipendente.\n\n' +
          'Ventidue legionari, diciassette soldati italiani, cinque civili. Non è un numero grande, ma basta perché Roma tratti Fiume, per i tre anni successivi, come un problema da risolvere e non come uno Stato.\n\n' +
          'Lo Stato libero viene formalmente soppresso dal Trattato di Roma il 22 febbraio 1924.' },
      check: function (s) { return s.flags.martyred && s.order.milizia < 300; }
    },
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
       ending; see docs/内容梳理与路线重构方案.md §2.2. */
    /* The 1920 march — the one surviving march ending, and the destination of
       the `marcia` route. Priority 4 puts it beside "法西斯城邦" (4); it is
       listed first so a stable sort resolves the tie in its favour. The coup
       check is excluded so a game that has already fallen to Mussolini cannot
       claim this ending instead.
       It is now named simply 进军罗马 / La marcia su Roma; the 1922 variant that
       used to carry that name was cut as unreachable (see §2.2 of
       docs/内容梳理与路线重构方案.md). */
    {
      id: 'ending_marcia_1920', priority: 4, route: 'marcia', zh: '进军罗马', it: 'La marcia su Roma', tag: '架空',
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
      check: function (s) { return !!s.flags.marcia_1920 && !s.flags.coup_done; }
    },
    {
      /* priority 3.5, ahead of `ending_fascio` (4): both fire on the same event
         (the fascist coup), and which one you get is how violent its aftermath
         was. `fascio` says `coup_done && !exile && !stay` — which was ALSO true
         of the civil-strife state — so at priority 6 the stalemate could never
         be reached: the docile occupation always won the tie. The stalemate is
         the more specific description, so it is judged first. */
      id: 'ending_civil_strife', priority: 3.5, route: 'collapse', zh: '血腥的僵局', it: 'Lo stallo sanguinoso', tag: '崩溃',
      body: { zh: '政变成功了，但没有结束任何事情。军团兵的街区与法西斯的街区之间隔着一道谁也不敢越过的线。意大利驻军在两方之间站着，谁也不帮，谁也不走。\n\n' +
          '这座城市在接下来二十年里一直记得那三年。',
          it: 'Il colpo di Stato è riuscito e non ha concluso nulla. Fra i quartieri legionari e i quartieri fascisti c\'è una linea che nessuno osa superare. Il presidio italiano sta in mezzo: non aiuta nessuno, non se ne va.\n\n' +
          'La città ricorderà quei tre anni per i successivi venti.' },
      check: function (s) { return s.flags.coup_done && s.order.violence > 70; }
    },
    {
      id: 'ending_historical', priority: 7, route: 'annexione', zh: '历史的结局', it: 'Il corso della storia', tag: '历史',
      body: { zh: '1924 年 1 月 27 日，意大利与南斯拉夫签署《罗马条约》。2 月 22 日批准生效。3 月 16 日，维托里奥·埃马努埃莱三世进城宣布合并。\n\n' +
          '扎内拉的流亡议会宣布该条约"在国际法上无效且不可接受"，并继续存在下去——一直到 1950 年代。\n\n' +
          '1919 年 9 月 12 日，你带了两千五百人走进这座城市，说它属于意大利。现在意大利来取它了，用一份和你无关的文件。',
          it: 'Il 27 gennaio 1924 Italia e Jugoslavia firmano il Trattato di Roma. Ratifica il 22 febbraio. Il 16 marzo Vittorio Emanuele III entra in città e proclama l\'annessione.\n\n' +
          'L\'Assemblea in esilio di Zanella dichiara il trattato "giuridicamente inaccettabile e invalido" e continua a esistere fino agli anni Cinquanta.\n\n' +
          'Il 12 settembre 1919 sei entrato in questa città con duemilacinquecento uomini dicendo che apparteneva all\'Italia. Ora l\'Italia viene a prenderla, con un documento che non ti riguarda.' },
      /* `flags.resigned` was dropped from this check: nothing in the repository
         ever set it, so it was a branch that could not be taken. */
      check: function (s) { return s.flags.treaty_rome || s.flags.exile; }
    },
    {
      id: 'ending_comune', priority: 8, route: 'carnaro', zh: '阜姆公社', it: 'La Comune di Fiume', tag: '架空',
      body: { zh: '《卡尔纳罗宪章》不是被朗诵的，是被执行的。法团院开会，最优者议会立法，七个执政官由议会选举产生，音乐成为国家制度，劳动写进第一条。\n\n' +
          '工厂归工人的合作社，港口归码头工人的联营，土地归耕它的人。德·安布里斯在 1920 年写下的那些句子，第一次具有法律效力。\n\n' +
          '莫斯科说这"不伦不类"；罗马说这"不可容忍"；日内瓦什么也没说，但把它登记了。',
          it: 'La Carta del Carnaro non viene recitata: viene applicata. Il Consiglio dei Provvisori si riunisce, quello degli Ottimi legifera, sette Rettori sono eletti, la musica diventa istituzione dello Stato, il lavoro entra nell\'articolo primo.\n\n' +
          'Le fabbriche alle cooperative operaie, il porto ai consorzi dei portuali, la terra a chi la lavora. Le frasi che De Ambris scrisse nel 1920 hanno, per la prima volta, forza di legge.\n\n' +
          'Mosca la chiama "ibrida"; Roma "intollerabile"; Ginevra non dice nulla, ma la registra.' },
      check: function (s) { return s.flags.carta_done && s.laws.lavoro >= 3 && s.laws.fisco >= 2 && !s.flags.coup_done; }
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
    {
      id: 'ending_danzig', priority: 10, route: 'carnaro', zh: '亚得里亚的但泽', it: 'La Danzica dell\'Adriatico', tag: '架空',
      body: { zh: '英、法、美三国共同保证阜姆的中立与独立。宪章在国联登记，一个三人委员会常驻城内监督自由港章程。意大利与南斯拉夫都没有得到这座城市，也没有失去它。\n\n' +
          '威尔逊 1919 年提议把国联的机构设在阜姆。当时所有人都在笑。现在城里的每一块街牌都写着三种语言，而广场上的雕像还是那个诗人。',
          it: 'Gran Bretagna, Francia e Stati Uniti garantiscono congiuntamente la neutralità e l\'indipendenza di Fiume. La Carta è registrata a Ginevra, una commissione di tre membri risiede in città per vigilare sullo statuto del porto franco. Né l\'Italia né la Jugoslavia ottengono la città; nessuna delle due la perde.\n\n' +
          'Wilson aveva proposto Fiume come sede della Società nel 1919. Allora tutti ridevano. Ora ogni targa stradale è in tre lingue, e la statua in piazza è ancora quella del poeta.' },
      check: function (s) { return s.flags.international_guarantee && s.flags.carta_done; }
    },
    {
      id: 'ending_carnaro', priority: 11, route: 'carnaro', zh: '卡尔纳罗共和国', it: 'La Repubblica del Carnaro', tag: '胜利',
      body: { zh: '摄政活了下来。罗马换了三届内阁，贝尔格莱德换了两次王储的耐心，日内瓦换了四个委员会——而阜姆还是阜姆。\n\n' +
          '它有一个由法团院和最优者议会组成的立法机关，七个每年选举一次的执政官，对城市负责的市政警察，一部经各项法律落实的宪章，以及一个仍在缓慢回升的港口。\n\n' +
          '它不是意大利，也不是南斯拉夫。它是一座由诗人建立、由工会书记维持、由码头工人养活的共和国。',
          it: 'La Reggenza sopravvive. Roma cambia tre governi, Belgrado due volte la pazienza del principe ereditario, Ginevra quattro commissioni — e Fiume resta Fiume.\n\n' +
          'Ha un legislativo fatto di due consigli, sette Rettori eletti ogni anno, una polizia municipale responsabile davanti alla città, una Carta attuata attraverso le leggi, e un porto che risale lentamente.\n\n' +
          'Non è l\'Italia, non è la Jugoslavia. È una repubblica fondata da un poeta, tenuta in piedi da un segretario sindacale, e nutrita dai portuali.' },
      check: function (s) { return !s.flags.coup_done && !s.flags.treaty_rome && s.flags.carta_done && s.date.y >= 1926; }
    },
    {
      id: 'ending_venice', priority: 12, route: 'carnaro', zh: '第二个威尼斯', it: 'La seconda Venezia', tag: '架空',
      body: { zh: '自由港三级、转口贸易特权、港务财团、双关税协定。吞吐指数回到 1913 年的九成。全城三分之一的就业在码头与仓储。\n\n' +
          '没有人再问"谁是阜姆人"这个问题，因为所有人都在忙着算账。军团兵的海报被商会的广告盖住了。\n\n' +
          '这是一个不浪漫、不英勇、但确实活下来了的结局——而写诗的人不会喜欢它。',
          it: 'Porto franco di terzo livello, privilegi di transito, consorzio portuale, doppia convenzione doganale. L\'indice di traffico torna al novanta per cento del 1913. Un terzo dell\'occupazione cittadina è sui moli e nei magazzini.\n\n' +
          'Nessuno chiede più "chi sono i fiumani": tutti stanno facendo i conti. I manifesti dei legionari sono coperti dalla pubblicità della Camera di commercio.\n\n' +
          'Un finale poco romantico, poco eroico, e decisamente sopravvissuto — che al poeta non piacerà.' },
      check: function (s) { return s.laws.portofranco >= 3 && s.economy.traffic >= 85 && s.factions.sindacalisti.inf >= 20 && !s.flags.coup_done; }
    },
    {
      id: 'ending_exile_endured', priority: 13, route: 'marcia', zh: '长夜里的集会', it: 'Le adunate nella notte lunga', tag: '架空',
      body: { zh: '运动撑过了两年。的里雅斯特、威尼斯、罗马、巴黎——每到一处都印一批新的信纸，用两种语言写给不会回信的人。\n\n' +
          '每年 9 月 12 日，还在的人会找一间屋子，唱同一首歌。来的人一年比一年少，但从来没有断过。\n\n' +
          '1950 年代他们还在开会。1960 年代它变成了一个纪念协会。',
          it: 'Il movimento resiste due anni. Trieste, Venezia, Roma, Parigi: in ogni città nuova carta intestata, in due lingue, per destinatari che non rispondono.\n\n' +
          'Ogni 12 settembre quelli che restano trovano una sala e cantano la stessa canzone. Ogni anno sono meno, ma non si salta mai.\n\n' +
          'Negli anni Cinquanta si riuniscono ancora. Negli anni Sessanta diventa un\'associazione commemorativa.' },
      check: function (s) { return s.flags.exile_endured || s.flags.passive_victory; }
    },
    {
      /* priority 10.5, ahead of `ending_carnaro` (11). `carnaro` is the general
         "the Regency survived" outcome and its check (Carta journal done, ≥ 1926) was
         ALSO satisfied by every better Carnaro ending, so as long as it was
         judged before them the specific victories could never be reached — the
         game would always settle for "it survived" instead of "it worked".
         The more specific endings now come first, and this one is the fallback
         for a Regency that merely lasts. */
      id: 'ending_fiume_o_morte', priority: 10.5, route: 'carnaro', zh: '阜姆或死亡！', it: 'Fiume o morte!', tag: '胜利',
      body: { zh: '1927 年 12 月。城还在。\n\n' +
          '它有一部以劳动、选举与公民权利立法落实的宪法、两个邻国的贸易协定、一份在国联登记的条约，以及一个回到战前九成吞吐量的港口。\n\n' +
          '广场上的雕像是一个写诗的人。街上的人说三种语言。每年 9 月 12 日，从意大利来的老兵会走过 Ronchi 的那段路，然后在省督府的阳台上，找一个年轻人念一段宪法。\n\n' +
          '念完之后，他们会一起喊那句 1919 年的口号。它听起来仍然像一句威胁，也仍然像一句承诺。',
          it: 'Dicembre 1927. La città è ancora qui.\n\n' +
          'Ha una costituzione attuata nelle leggi del lavoro, del voto e dei diritti civili, accordi commerciali con entrambi i vicini, un trattato registrato a Ginevra, e un porto tornato al novanta per cento del traffico anteguerra.\n\n' +
          'La statua in piazza è quella di un uomo che scriveva versi. Per strada si parlano tre lingue. Ogni 12 settembre i reduci arrivano dall\'Italia lungo la strada di Ronchi, e dal balcone del Palazzo un giovane legge un articolo della Carta.\n\n' +
          'Poi gridano tutti insieme lo slogan del 1919. Suona ancora come una minaccia, e ancora come una promessa.' },
      check: function (s) { return s.flags.porto_revived && s.economy.traffic >= 85 && !s.flags.coup_done && s.flags.carta_done && s.date.y >= 1927; }
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
    { id: 'ach_o_morte',   zh: '自由未烬',     it: 'Libertà non estinta', desc: { zh: '达成「阜姆或死亡！」结局。', it: 'Raggiungere il finale "Fiume o morte!".' } }
  ];

  return M;
});
