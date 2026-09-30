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

  /* ======================= Journals ======================= */
  M.JOURNALS = [
    {
      id: 'impresa', zh: '事业的第一年', it: 'Il primo anno dell\'Impresa',
      desc: { zh: '把两千五百人的占领变成一个能维持秩序的存在——在别人来收拾之前。',
              it: 'Trasformare l\'occupazione di duemilacinquecento uomini in qualcosa capace di mantenere l\'ordine.' },
      start: { zh: '军团兵进入阜姆', it: 'I legionari entrano a Fiume' },
      active: { zh: '每月 +0.5 合法性', it: '+0,5 legittimità al mese' },
      complete: function (s) { return s.legitimacy >= 58 && s.order.authority >= 55; },
      fail: function (s) { return (s.date.y > 1920 || (s.date.y === 1920 && s.date.m >= 6)) && s.order.authority < 32; },
      monthly: function () { return { order: { authority: 0.3 } }; },
      onComplete: function () { return { order: { authority: 8, violence: -6 }, diplo: { uk: 5, france: 5 }, flags: { impresa_consolidated: true } }; },
      onFail: function () { return { order: { authority: -6, violence: 8 } }; }
    },
    {
      id: 'comune_italiana', zh: '城市的同意', it: 'Il consenso della città',
      desc: { zh: '让这座城市真的同意你在这里——包括那些说克罗地亚语的人。',
              it: 'Fare in modo che questa città acconsenta davvero alla tua presenza: anche quelli che parlano croato.' },
      start: { zh: '市政选举举行', it: 'Le elezioni municipali si tengono' },
      active: { zh: '每月降低本地人异议', it: 'Riduce il dissenso dei fiumani' },
      complete: function (s) { return s.factions.sindacalisti.dis < 22 && s.legitimacy >= 55; },
      fail: function (s) { return s.factions.sindacalisti.dis > 72; },
      monthly: function () { return { factions: { sindacalisti: { dis: -0.7 } } }; },
      onComplete: function () { return { support: [['borghesia', 'LEG', 4], ['contadini', 'LEG', 4], ['impiegati', 'LEG', 3]], flags: { city_consent: true } }; },
      onFail: function () { return { support: [['borghesia', 'LEG', -6], ['contadini', 'LEG', -6]] }; }
    },
    {
      id: 'carta', zh: '实施《卡尔纳罗宪章》', it: 'Applicare la Carta del Carnaro',
      desc: { zh: '把 1920 年 9 月 8 日颁布的那份文件变成真正的法律，而不是阳台上的朗诵。',
              it: 'Trasformare il documento promulgato l\'8 settembre 1920 in legge vera, non in una recita dal balcone.' },
      start: { zh: '宪章被宣读并进入议程', it: 'La Carta entra nell\'agenda' },
      active: { zh: '每月推进法团院与劳动立法', it: 'Avanzano i consigli e la legislazione del lavoro' },
      complete: function (s) { return s.laws.statuto >= 3 && s.laws.lavoro >= 2; },
      fail: function (s) { return s.laws.statuto === 0 && s.monthIndex > 7; },
      monthly: function () { return { factions: { sindacalisti: { dis: -0.8 } } }; },
      onComplete: function () { return { laws: { statuto: 1 }, flags: { carta_done: true }, diplo: { league: 8, france: 4 } }; },
      onFail: function () { return { factions: { sindacalisti: { dis: 16 } } }; }
    },
    {
      id: 'porto', zh: '港口复兴', it: 'La rinascita del porto',
      desc: { zh: '把吞吐指数从 30 拉回 75 以上（1913 = 100）。',
              it: 'Riportare l\'indice di traffico da 30 a oltre 75 (1913 = 100).' },
      start: { zh: '摄政宣布港口复兴计划', it: 'La Reggenza annuncia il piano per il porto' },
      active: { zh: '每月 +0.5 港口工程', it: '+0,5 opere portuali al mese' },
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
      complete: function (s) { return s.diplo.uk >= 65 && s.diplo.france >= 65 && s.diplo.usa >= 60 && s.laws.statuto >= 2; },
      fail: function (s) { return !!s.flags.natale_done && s.monthIndex > 9 && s.diplo.league < 30; },
      monthly: function () { return { diplo: { league: 0.4 }, economy: { recognition: 0.3 } }; },
      onComplete: function () { return { flags: { international_guarantee: true }, diplo: { league: 12 } }; },
      onFail: function () { return { diplo: { league: -6 } }; }
    },
    {
      id: 'guardia', zh: '公民卫队', it: 'La Guardia Civica',
      desc: { zh: '建立一支不属于军团兵、也不属于法西斯的市政武装。',
              it: 'Costituire un corpo civico che non sia dei legionari né dei fascisti.' },
      start: { zh: '公共秩序立法推进', it: 'Legislazione sull\'ordine pubblico' },
      active: { zh: '每月 +12 卫队兵员', it: '+12 uomini al mese' },
      complete: function (s) { return s.order.civicGuard >= 800 && s.order.coup < 100; },
      fail: function (s) { return s.laws.ordine < 2 && s.monthIndex > 11; },
      monthly: function () { return { order: { civicGuard: 12 } }; },
      onComplete: function () { return { order: { authority: 8, squadre: -10 } }; },
      onFail: function () { return { order: { authority: -6, squadre: 6 } }; }
    },
    {
      id: 'elezioni', zh: '制宪议会', it: 'L\'Assemblea Costituente',
      desc: { zh: '在 1921 年 4 月的选举中活下来——最好还赢。',
              it: 'Sopravvivere alle elezioni dell\'aprile 1921 — e possibilmente vincerle.' },
      start: { zh: '选举法公布', it: 'Legge elettorale pubblicata' },
      active: { zh: '每月 +0.5 组织动员', it: '+0,5 mobilitazione al mese' },
      complete: function (s) { return s.counters.electionsHeld >= 1 && (s.assembly.LEG || 0) >= 30; },
      fail: function (s) { return s.counters.electionsHeld >= 1 && (s.assembly.LEG || 0) < 12; },
      monthly: function () { return { militants: 20 }; },
      onComplete: function () { return { order: { authority: 6 }, flags: { seat_held: true } }; },
      onFail: function () { return { order: { authority: -6 } }; }
    },
    {
      id: 'cassa', zh: '阜姆券', it: 'I buoni di Fiume',
      desc: { zh: '贴现银行印的钱撑住了围城，也可能毁掉这座城市。把通胀压到 12 以下并还清债务。',
              it: 'Il denaro della Cassa di Sconto ha sostenuto l\'assedio e può rovinare la città. Tenere l\'inflazione sotto 12 e rientrare dal debito.' },
      start: { zh: '贴现银行开始发行阜姆券', it: 'La Cassa di Sconto emette buoni' },
      active: { zh: '每月 +18 K£，但通胀压力上升', it: '+18 K£ al mese, ma l\'inflazione sale' },
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
      active: { zh: '每月 +40 党员', it: '+40 iscritti al mese' },
      complete: function (s) { return s.factions.arditi.inf >= 24 && s.organizations.reduci.active; },
      fail: function (s) { return s.factions.fascisti.inf >= 22; },
      monthly: function () { return { militants: 40 }; },
      onComplete: function () { return { order: { milizia: 300, squadre: -8 }, flags: { movement_built: true } }; },
      onFail: function () { return { factions: { arditi: { dis: 18 } }, order: { squadre: 10 } }; }
    },
    {
      id: 'esilio', zh: '长夜里的集会', it: 'Le adunate nella notte lunga',
      desc: { zh: '让被赶出省督府的运动继续存在，并且继续开会。',
              it: 'Tenere in vita, e in assemblea, un movimento cacciato dal Palazzo.' },
      start: { zh: '运动转入流亡', it: 'Il movimento passa in esilio' },
      active: { zh: '每月 +0.5 国际合法性', it: '+0,5 legittimità internazionale al mese' },
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
      complete: function (s) { return s.order.squadre < 25 && (s.counters.resistMonths || 0) >= 18; },
      fail: function (s) { return s.order.violence > 85; },
      monthly: function () { return { order: { squadre: -0.6, fervour: 0.4 }, support: [['operai', 'LEG', 0.2], ['artigiani', 'LEG', 0.2]] }; },
      onComplete: function () { return { flags: { passive_victory: true } }; },
      onFail: function () { return { flags: { crushed: true } }; }
    }
  ];
  M.JOURNAL_BY_ID = {};
  M.JOURNALS.forEach(function (j) { M.JOURNAL_BY_ID[j.id] = j; });

  /* ======================= Endings ======================= */
  M.ENDINGS = [
    {
      id: 'ending_silent_port', priority: 1, zh: '无声的港口', it: 'Il porto silenzioso', tag: '崩溃',
      body: { zh: '没有投降书，没有政变，没有条约。只是码头空了，户籍册一页一页地被划掉。到 1927 年，这座城市比 1920 年少了将近五分之一的人。\n\n' +
          '后来的人会说：阜姆不是被谁拿走的，它是自己走掉的。而那个在阳台上念宪法的人，早就回加尔达湖了。',
          it: 'Nessuna resa, nessun colpo di Stato, nessun trattato. Solo i moli vuoti e i registri anagrafici cancellati pagina per pagina. Nel 1927 la città ha quasi un quinto di abitanti in meno rispetto al 1920.\n\n' +
          'Diranno che Fiume non se l\'è presa nessuno: se n\'è andata da sola. E che l\'uomo che leggeva la Carta dal balcone era tornato sul Garda da un pezzo.' },
      check: function (s) { return s.economy.population < 44000; }
    },
    {
      id: 'ending_fuga', priority: 2, zh: '诗人离开', it: 'Il Poeta se ne va', tag: '历史',
      body: { zh: '1921 年 1 月 18 日，你登上了一列开往威尼斯的火车。城里到处是弹坑和传单，军团兵正在离开。\n\n' +
          '自由邦成立了。一个临时政府接管了市政厅，成员全部来自兼并列的国民集团。宪法没有生效。\n\n' +
          '"我走了，"你后来写道，"但没有投降。"',
          it: 'Il 18 gennaio 1921 sali su un treno per Venezia. La città è piena di crateri e di volantini, i legionari se ne stanno andando.\n\n' +
          'Nasce lo Stato libero. Un governo provvisorio prende il Municipio, composto interamente dal Blocco Nazionale annessionista. La Carta non entra in vigore.\n\n' +
          '"Me ne vado," scriverai poi, "ma non mi arrendo."' },
      check: function (s) { return s.flags.dannunzio_left; }
    },
    {
      id: 'ending_natale', priority: 3, zh: '血腥圣诞', it: 'Natale di sangue', tag: '失败',
      body: { zh: '炮弹落在省督府的那一天，这座城市就已经结束了它作为一个独立国家的历史。\n\n' +
          '二十二名军团兵、十七名意大利士兵、五名平民。这个数字不大，但它足够让罗马在接下来的三年里，把阜姆当作一个需要被解决的问题而不是一个国家。\n\n' +
          '自由邦在 1924 年 2 月 22 日被《罗马条约》正式取消。',
          it: 'Il giorno in cui la granata cade sul Palazzo, questa città ha già finito la sua storia di Stato indipendente.\n\n' +
          'Ventidue legionari, diciassette soldati italiani, cinque civili. Non è un numero grande, ma basta perché Roma tratti Fiume, per i tre anni successivi, come un problema da risolvere e non come uno Stato.\n\n' +
          'Lo Stato libero viene formalmente soppresso dal Trattato di Roma il 22 febbraio 1924.' },
      check: function (s) { return s.flags.martyred && s.order.milizia < 300; }
    },
    {
      id: 'ending_fascio', priority: 4, zh: '法西斯城邦', it: 'La città fascista', tag: '失败',
      body: { zh: '君塔的小队、霍斯特-文图里的军团兵旧部、罗马的预算。阜姆成为意大利法西斯主义的第一座"解放"城市——比埃塞俄比亚早十四年，比阿尔巴尼亚早十七年。\n\n' +
          '1919 年从 Ronchi 走来的那批人的名字被从街牌上刮掉，换上了另一个人的名字。那个人的诗你读过，而且你比他写得好。',
          it: 'Le squadre di Giunta, i vecchi legionari di Host-Venturi, il bilancio di Roma. Fiume diventa la prima città "liberata" dal fascismo italiano: quattordici anni prima dell\'Etiopia, diciassette prima dell\'Albania.\n\n' +
          'I nomi di quelli che nel 1919 partirono da Ronchi vengono raschiati dalle targhe stradali e sostituiti con il nome di un altro. Un uomo i cui versi hai letto, e che scriveva peggio di te.' },
      check: function (s) { return s.flags.coup_done && !s.flags.exile && !s.flags.stay && !s.flags.march_on_rome; }
    },
    {
      id: 'ending_marcia', priority: 5, zh: '从阜姆向罗马', it: 'Da Fiume a Roma', tag: '架空',
      body: { zh: '军团兵沿着铁路线向南。他们在蒙法尔科内被拦了一次，在帕多瓦被拦了一次，在博洛尼亚被拦了第三次。\n\n' +
          '没人知道如果 1919 年就出发会怎样。1922 年出发的结果是：一场持续了六天的、没有名字的冲突，然后是军事法庭。\n\n' +
          '但"从阜姆向罗马"这句话留了下来，后来被印在别人的旗帜上。',
          it: 'I legionari scendono lungo la ferrovia. Vengono fermati una volta a Monfalcone, una a Padova, una terza a Bologna.\n\n' +
          'Nessuno saprà mai cosa sarebbe successo partendo nel 1919. Partendo nel 1922 il risultato è: sei giorni di conflitto senza nome, e poi un tribunale militare.\n\n' +
          'Ma la frase "da Fiume a Roma" resta, e finirà stampata sulle bandiere di altri.' },
      check: function (s) { return !!s.flags.march_on_rome; }
    },
    {
      id: 'ending_civil_strife', priority: 6, zh: '血腥的僵局', it: 'Lo stallo sanguinoso', tag: '崩溃',
      body: { zh: '政变成功了，但没有结束任何事情。军团兵的街区与法西斯的街区之间隔着一道谁也不敢越过的线。意大利驻军在两方之间站着，谁也不帮，谁也不走。\n\n' +
          '这座城市在接下来二十年里一直记得那三年。',
          it: 'Il colpo di Stato è riuscito e non ha concluso nulla. Fra i quartieri legionari e i quartieri fascisti c\'è una linea che nessuno osa superare. Il presidio italiano sta in mezzo: non aiuta nessuno, non se ne va.\n\n' +
          'La città ricorderà quei tre anni per i successivi venti.' },
      check: function (s) { return s.flags.coup_done && s.order.violence > 70; }
    },
    {
      id: 'ending_historical', priority: 7, zh: '历史的结局', it: 'Il corso della storia', tag: '历史',
      body: { zh: '1924 年 1 月 27 日，意大利与南斯拉夫签署《罗马条约》。2 月 22 日批准生效。3 月 16 日，维托里奥·埃马努埃莱三世进城宣布合并。\n\n' +
          '扎内拉的流亡议会宣布该条约"在国际法上无效且不可接受"，并继续存在下去——一直到 1950 年代。\n\n' +
          '1919 年 9 月 12 日，你带了两千五百人走进这座城市，说它属于意大利。现在意大利来取它了，用一份和你无关的文件。',
          it: 'Il 27 gennaio 1924 Italia e Jugoslavia firmano il Trattato di Roma. Ratifica il 22 febbraio. Il 16 marzo Vittorio Emanuele III entra in città e proclama l\'annessione.\n\n' +
          'L\'Assemblea in esilio di Zanella dichiara il trattato "giuridicamente inaccettabile e invalido" e continua a esistere fino agli anni Cinquanta.\n\n' +
          'Il 12 settembre 1919 sei entrato in questa città con duemilacinquecento uomini dicendo che apparteneva all\'Italia. Ora l\'Italia viene a prenderla, con un documento che non ti riguarda.' },
      check: function (s) { return s.flags.treaty_rome || s.flags.exile || s.flags.resigned; }
    },
    {
      id: 'ending_comune', priority: 8, zh: '阜姆公社', it: 'La Comune di Fiume', tag: '架空',
      body: { zh: '《卡尔纳罗宪章》不是被朗诵的，是被执行的。法团院开会，最优者议会立法，七个执政官由议会选举产生，音乐成为国家制度，劳动写进第一条。\n\n' +
          '工厂归工人的合作社，港口归码头工人的联营，土地归耕它的人。德·安布里斯在 1920 年写下的那些句子，第一次具有法律效力。\n\n' +
          '莫斯科说这"不伦不类"；罗马说这"不可容忍"；日内瓦什么也没说，但把它登记了。',
          it: 'La Carta del Carnaro non viene recitata: viene applicata. Il Consiglio dei Provvisori si riunisce, quello degli Ottimi legifera, sette Rettori sono eletti, la musica diventa istituzione dello Stato, il lavoro entra nell\'articolo primo.\n\n' +
          'Le fabbriche alle cooperative operaie, il porto ai consorzi dei portuali, la terra a chi la lavora. Le frasi che De Ambris scrisse nel 1920 hanno, per la prima volta, forza di legge.\n\n' +
          'Mosca la chiama "ibrida"; Roma "intollerabile"; Ginevra non dice nulla, ma la registra.' },
      check: function (s) { return s.flags.carta_done && s.laws.lavoro >= 3 && s.laws.fisco >= 2 && !s.flags.coup_done; }
    },
    {
      id: 'ending_yugoslav', priority: 9, zh: '南斯拉夫之门', it: 'La porta jugoslava', tag: '架空',
      body: { zh: '议会以多数票决定：阜姆以一个自治单位的形式加入南斯拉夫王国，保留市政机构、三种官方语言和港口自治权。\n\n' +
          '贝尔格莱德得到了它一直想要的出海口，阜姆得到了它一直想要的腹地。意大利的报纸把这件事称为"第二个科尔福"。\n\n' +
          '你签了字。你后来说，你签的不是投降书，是一份商业合同。',
          it: 'L\'Assemblea decide a maggioranza: Fiume entra nel Regno di Jugoslavia come unità autonoma, conservando municipio, tre lingue ufficiali e autonomia portuale.\n\n' +
          'Belgrado ottiene lo sbocco al mare che voleva, Fiume l\'entroterra che le mancava. La stampa italiana la chiama "la seconda Corfù".\n\n' +
          'Hai firmato. Dirai poi che non era una resa, ma un contratto commerciale.' },
      check: function (s) { return s.flags.federation || (s.flags.belgrade_path && s.diplo.yugoslavia >= 65); }
    },
    {
      id: 'ending_danzig', priority: 10, zh: '亚得里亚的但泽', it: 'La Danzica dell\'Adriatico', tag: '架空',
      body: { zh: '英、法、美三国共同保证阜姆的中立与独立。宪章在国联登记，一个三人委员会常驻城内监督自由港章程。意大利与南斯拉夫都没有得到这座城市，也没有失去它。\n\n' +
          '威尔逊 1919 年提议把国联的机构设在阜姆。当时所有人都在笑。现在城里的每一块街牌都写着三种语言，而广场上的雕像还是那个诗人。',
          it: 'Gran Bretagna, Francia e Stati Uniti garantiscono congiuntamente la neutralità e l\'indipendenza di Fiume. La Carta è registrata a Ginevra, una commissione di tre membri risiede in città per vigilare sullo statuto del porto franco. Né l\'Italia né la Jugoslavia ottengono la città; nessuna delle due la perde.\n\n' +
          'Wilson aveva proposto Fiume come sede della Società nel 1919. Allora tutti ridevano. Ora ogni targa stradale è in tre lingue, e la statua in piazza è ancora quella del poeta.' },
      check: function (s) { return s.flags.international_guarantee && s.laws.statuto >= 2; }
    },
    {
      id: 'ending_carnaro', priority: 11, zh: '卡尔纳罗共和国', it: 'La Repubblica del Carnaro', tag: '胜利',
      body: { zh: '摄政活了下来。罗马换了三届内阁，贝尔格莱德换了两次王储的耐心，日内瓦换了四个委员会——而阜姆还是阜姆。\n\n' +
          '它有一个由法团院和最优者议会组成的立法机关，七个每年选举一次的执政官，一支既不属于陆军也不属于任何政党的市政卫队，一份在国联登记的宪章，以及一个仍在缓慢回升的港口。\n\n' +
          '它不是意大利，也不是南斯拉夫。它是一座由诗人建立、由工会书记维持、由码头工人养活的共和国。',
          it: 'La Reggenza sopravvive. Roma cambia tre governi, Belgrado due volte la pazienza del principe ereditario, Ginevra quattro commissioni — e Fiume resta Fiume.\n\n' +
          'Ha un legislativo fatto di due consigli, sette Rettori eletti ogni anno, un corpo civico che non appartiene né all\'esercito né ad alcun partito, una Carta registrata a Ginevra, e un porto che risale lentamente.\n\n' +
          'Non è l\'Italia, non è la Jugoslavia. È una repubblica fondata da un poeta, tenuta in piedi da un segretario sindacale, e nutrita dai portuali.' },
      check: function (s) { return !s.flags.coup_done && !s.flags.treaty_rome && s.laws.statuto >= 2 && s.date.y >= 1926; }
    },
    {
      id: 'ending_venice', priority: 12, zh: '第二个威尼斯', it: 'La seconda Venezia', tag: '架空',
      body: { zh: '自由港三级、转口贸易特权、港务财团、双关税协定。吞吐指数回到 1913 年的九成。全城三分之一的就业在码头与仓储。\n\n' +
          '没有人再问"谁是阜姆人"这个问题，因为所有人都在忙着算账。军团兵的海报被商会的广告盖住了。\n\n' +
          '这是一个不浪漫、不英勇、但确实活下来了的结局——而写诗的人不会喜欢它。',
          it: 'Porto franco di terzo livello, privilegi di transito, consorzio portuale, doppia convenzione doganale. L\'indice di traffico torna al novanta per cento del 1913. Un terzo dell\'occupazione cittadina è sui moli e nei magazzini.\n\n' +
          'Nessuno chiede più "chi sono i fiumani": tutti stanno facendo i conti. I manifesti dei legionari sono coperti dalla pubblicità della Camera di commercio.\n\n' +
          'Un finale poco romantico, poco eroico, e decisamente sopravvissuto — che al poeta non piacerà.' },
      check: function (s) { return s.laws.portofranco >= 3 && s.economy.traffic >= 85 && s.factions.sindacalisti.inf >= 20 && !s.flags.coup_done; }
    },
    {
      id: 'ending_exile_endured', priority: 13, zh: '长夜里的集会', it: 'Le adunate nella notte lunga', tag: '架空',
      body: { zh: '运动撑过了两年。的里雅斯特、威尼斯、罗马、巴黎——每到一处都印一批新的信纸，用两种语言写给不会回信的人。\n\n' +
          '每年 9 月 12 日，还在的人会找一间屋子，唱同一首歌。来的人一年比一年少，但从来没有断过。\n\n' +
          '1950 年代他们还在开会。1960 年代它变成了一个纪念协会。',
          it: 'Il movimento resiste due anni. Trieste, Venezia, Roma, Parigi: in ogni città nuova carta intestata, in due lingue, per destinatari che non rispondono.\n\n' +
          'Ogni 12 settembre quelli che restano trovano una sala e cantano la stessa canzone. Ogni anno sono meno, ma non si salta mai.\n\n' +
          'Negli anni Cinquanta si riuniscono ancora. Negli anni Sessanta diventa un\'associazione commemorativa.' },
      check: function (s) { return s.flags.exile_endured || s.flags.passive_victory; }
    },
    {
      id: 'ending_fiume_o_morte', priority: 14, zh: '阜姆或死亡！', it: 'Fiume o morte!', tag: '胜利',
      body: { zh: '1927 年 12 月。城还在。\n\n' +
          '它有一部宪法、一部劳动法、一支八百人的市政卫队、两个邻国的贸易协定、一份在国联登记的条约，以及一个回到战前九成吞吐量的港口。\n\n' +
          '广场上的雕像是一个写诗的人。街上的人说三种语言。每年 9 月 12 日，从意大利来的老兵会走过 Ronchi 的那段路，然后在省督府的阳台上，找一个年轻人念一段宪法。\n\n' +
          '念完之后，他们会一起喊那句 1919 年的口号。它听起来仍然像一句威胁，也仍然像一句承诺。',
          it: 'Dicembre 1927. La città è ancora qui.\n\n' +
          'Ha una costituzione, una legge sul lavoro, un corpo civico di ottocento uomini, accordi commerciali con entrambi i vicini, un trattato registrato a Ginevra, e un porto tornato al novanta per cento del traffico anteguerra.\n\n' +
          'La statua in piazza è quella di un uomo che scriveva versi. Per strada si parlano tre lingue. Ogni 12 settembre i reduci arrivano dall\'Italia lungo la strada di Ronchi, e dal balcone del Palazzo un giovane legge un articolo della Carta.\n\n' +
          'Poi gridano tutti insieme lo slogan del 1919. Suona ancora come una minaccia, e ancora come una promessa.' },
      check: function (s) { return s.flags.porto_revived && s.economy.traffic >= 85 && !s.flags.coup_done && s.laws.statuto >= 3 && s.date.y >= 1927; }
    },
    {
      id: 'ending_timer', priority: 99, zh: '尚未落幕', it: 'Non ancora concluso', tag: '未完',
      body: { zh: '时间到了，故事没有结束。', it: 'Il tempo è scaduto, la storia no.' },
      check: function () { return true; }
    }
  ];

  /* ======================= Achievements ======================= */
  M.ACHIEVEMENTS = [
    { id: 'ach_balcony',   zh: '阳台上的国家', it: 'Uno Stato dal balcone', desc: { zh: '让《卡尔纳罗宪章》进入议程。', it: 'Portare la Carta del Carnaro all\'ordine del giorno.' } },
    { id: 'ach_arengo',    zh: '阿伦戈',       it: 'L\'Arengo', desc: { zh: '召开一次由最优者议会与临时者议会合并的市民大会。', it: 'Convocare l\'Arengo riunito.' } },
    { id: 'ach_carta',     zh: '不是诗，是法', it: 'Non poesia, legge', desc: { zh: '把宪章推进到国联登记。', it: 'Portare la Carta alla registrazione a Ginevra.' } },
    { id: 'ach_comune',    zh: '劳动的共和国', it: 'La Repubblica del lavoro', desc: { zh: '合作社份额 ≥ 18 且劳动法 ≥ 2。', it: 'Cooperative ≥ 18 e legislazione del lavoro ≥ 2.' } },
    { id: 'ach_survive',   zh: '活过圣诞',     it: 'Sopravvivere al Natale', desc: { zh: '在 1921 年 3 月之后仍然掌权。', it: 'Restare al potere dopo il marzo 1921.' } },
    { id: 'ach_disarm',    zh: '解除侧翼的武装', it: 'Disarmare l\'ala', desc: { zh: '解除法西斯小队武装。', it: 'Disarmare le squadre fasciste.' } },
    { id: 'ach_seats',     zh: '制度陷阱',     it: 'La trappola istituzionale', desc: { zh: '在 1921 年的选举中保住 30 席以上。', it: 'Conservare più di 30 seggi alle elezioni del 1921.' } },
    { id: 'ach_geneva',    zh: '日内瓦的赌注', it: 'La scommessa di Ginevra', desc: { zh: '拿到英法美共同保证。', it: 'Ottenere la garanzia congiunta di UK, Francia e USA.' } },
    { id: 'ach_port',      zh: '港口回来了',   it: 'Il porto è tornato', desc: { zh: '吞吐指数 ≥ 75。', it: 'Indice di traffico ≥ 75.' } },
    { id: 'ach_sound',     zh: '不印钞的政府', it: 'Un governo che non stampa', desc: { zh: '通胀 < 12 且债务 < 1800 K£。', it: 'Inflazione < 12 e debito < 1800 K£.' } },
    { id: 'ach_reconcile', zh: '三次语言',     it: 'In tre lingue', desc: { zh: '与本地人和解并把双语写进法律。', it: 'Riconciliarsi con i fiumani e mettere il bilinguismo nella legge.' } },
    { id: 'ach_movement',  zh: '军团兵政党',   it: 'Il partito dei legionari', desc: { zh: '把军团兵网络变成一个组织。', it: 'Trasformare la rete legionaria in un\'organizzazione.' } },
    { id: 'ach_stay',      zh: '留在佩奇内',   it: 'Restare a Pećine', desc: { zh: '被逐出省督府后仍留在城里，坚持 18 个月。', it: 'Restare in città dopo la cacciata dal Palazzo per 18 mesi.' } },
    { id: 'ach_exile',     zh: '出走的集会',   it: 'Le adunate in fuga', desc: { zh: '流亡运动维持 24 个月。', it: 'Mantenere il movimento in esilio per 24 mesi.' } },
    { id: 'ach_empty',     zh: '一千个空房子', it: 'Mille case vuote', desc: { zh: '人口流失达到 5000 人。', it: 'Perdere 5.000 abitanti.' } },
    { id: 'ach_calm',      zh: '不流血的三年', it: 'Tre anni senza sangue', desc: { zh: '政治暴力始终低于 15 直到 1924 年。', it: 'Violenza politica sempre sotto 15 fino al 1924.' } },
    { id: 'ach_dissent',   zh: '四派同桌', it: 'Quattro correnti a un tavolo', desc: { zh: '四个派系的整体异议始终低于 10。', it: 'Dissenso complessivo sempre sotto 10.' } },
    { id: 'ach_o_morte',   zh: '自由未烬',     it: 'Libertà non estinta', desc: { zh: '达成「阜姆或死亡！」结局。', it: 'Raggiungere il finale "Fiume o morte!".' } }
  ];

  return M;
});
