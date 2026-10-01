import type { Card } from '../content/types';

/* Factional strife, modelled on the reference project's `party_disunity`
   scene. The shape there is what matters: the card only surfaces once dissent
   is already a problem, and every concession is zero-sum — appeasing one wing
   is what angers the next. Discipline is the only way to bring all five down
   at once, and it is paid for out of the movement's own base.

   The gate is calibrated to this game's numbers rather than copied: dissent
   only moves when content moves it, so at the opening (22/16/26/34/20) the
   card stays hidden and appears once the player's own choices have pushed a
   wing past the point of quiet. */
export const azFazioni: Card = {
    id: 'az_fazioni', deck: 'azione',
    name: { zh: '派系斗争', it: 'Lotte fra le fazioni' },
    cooldown: 4,
    text: { zh: '军团的五个派系从来不是一支军队的五个师，而是五群彼此看不顺眼的人：' +
        '阿迪蒂要的是冲锋，工团派要的是宪章，未来主义派要的是把这座城烧成一件艺术品，' +
        '法西斯派要的是秩序，收复主义者要的是罗马。\n\n' +
        '他们唯一的共识是邓南遮。而邓南遮只有一个。\n\n' +
        '分歧已经到了必须处理的地步。',
      it: 'Le cinque fazioni della Legione non sono mai state cinque divisioni di un solo esercito, ma cinque gruppi di persone che non si sopportano: gli arditi vogliono l\'assalto, i sindacalisti la Carta, i futuristi bruciare la città in un\'opera d\'arte, i fascisti l\'ordine, gli irredentisti Roma.\n\n' +
        'La loro sola intesa è D\'Annunzio. E D\'Annunzio è uno solo.\n\n' +
        'La discordia è arrivata al punto in cui bisogna farci qualcosa.' },
    cost: { ap: 1 },
    /* Only surfaces once the quarrel is real. Thirty-five is chosen against
       this game's own numbers: the wings open at 22/16/26/34/20 and nothing
       raises the futurists or the irredentists at all, so the gate is crossed
       by pushing the arditi (to 42), the fascists (to 48) or the syndicalists
       (to 38) — and stays shut until the player does. */
    require: function (s) {
      var f = (s && s.factions) || {};
      var worst = 0;
      Object.keys(f).forEach(function (k) { if (f[k] && f[k].dis > worst) worst = f[k].dis; });
      return worst >= 35;
    },
    requireText: { zh: '派系尚未闹到需要开会的程度', it: 'Le fazioni non litigano ancora abbastanza' },
    options: [
      { id: 'disciplina',
        text: { zh: '强化纪律。把闹得最凶的人赶出去。', it: 'Imporre la disciplina: cacciare i più turbolenti.' },
        subtitle: { zh: '队伍会小一圈，但至少是一支队伍。', it: 'La schiera sarà più stretta, ma almeno sarà una schiera.' },
        preview: ['全体派系异议 −', '码头劳工 −', '产业工人 −', '军团兵力 −180', '摄政领袖权威 +'],
        effect: { factions: { arditi: { dis: -5 }, sindacalisti: { dis: -5 }, futuristi: { dis: -5 },
                              fascisti: { dis: -5 }, irredentisti: { dis: -5 } },
                  support: [['portuali', 'LEG', -3], ['operai', 'LEG', -3]],
                  order: { milizia: -180, fervour: -3, authority: 4 } } },
      { id: 'arditi',
        text: { zh: '向阿迪蒂让步——给他们想要的那场冲锋。', it: 'Cedere agli arditi: l\'assalto che chiedono.' },
        subtitle: { zh: '让战壕里的老兵来决定这座城市的节奏。', it: 'Che siano i veterani di trincea a dare il passo alla città.' },
        preview: ['阿迪蒂异议 −−', '工团派异议 +', '政治暴力 +', '民众热忱 +'],
        require: function (s) { return s.factions.arditi.dis > 30; },
        requireText: { zh: '阿迪蒂尚未闹到需要安抚', it: 'Gli arditi non sono ancora in fermento' },
        effect: { factions: { arditi: { dis: -8 }, sindacalisti: { dis: 6 }, futuristi: { dis: -3 } },
                  order: { violence: 5, fervour: 4, squadre: 4 } } },
      { id: 'sindacalisti',
        text: { zh: '向工团派让步——把《卡尔纳罗宪章》真正实施出来。', it: 'Cedere ai sindacalisti: applicare davvero la Carta.' },
        subtitle: { zh: '德·安布里斯要的从来不是赞美，是执行。', it: 'De Ambris non ha mai chiesto elogi, ma esecuzione.' },
        preview: ['工团派异议 −−', '阿迪蒂异议 +', '法西斯派异议 +', '劳动保障 +1'],
        require: function (s) { return s.factions.sindacalisti.dis > 30; },
        requireText: { zh: '工团派尚未闹到需要安抚', it: 'I sindacalisti non sono ancora in fermento' },
        effect: { factions: { sindacalisti: { dis: -8 }, arditi: { dis: 5 }, fascisti: { dis: 5 } },
                  laws: { lavoro: 1 },
                  support: [['operai', 'LEG', 3], ['portuali', 'LEG', 2]],
                  economy: { capitalConfidence: -5 } } },
      { id: 'futuristi',
        text: { zh: '向未来主义派让步——给他们的剧场和报纸拨钱。', it: 'Cedere ai futuristi: finanziare teatri e giornali.' },
        subtitle: { zh: '马里内蒂要的是把政治做成一场演出。那就让它好看些。', it: 'Marinetti vuole farne uno spettacolo. Almeno che sia bello.' },
        preview: ['未来主义派异议 −−', '工团派异议 +', '金库 −', '民众热忱 +'],
        require: function (s) { return s.factions.futuristi.dis > 30; },
        requireText: { zh: '未来主义派尚未闹到需要安抚', it: 'I futuristi non sono ancora in fermento' },
        effect: { factions: { futuristi: { dis: -8 }, sindacalisti: { dis: 5 }, fascisti: { dis: 2 } },
                  funds: -180,
                  order: { fervour: 7, authority: 2 },
                  support: [['borghesia', 'LEG', 2]] } },
      { id: 'fascisti',
        text: { zh: '向法西斯派让步——把街头交给黑衫。', it: 'Cedere ai fascisti: la strada alle camicie nere.' },
        subtitle: { zh: '墨索里尼的人要的是秩序。他们自己那种秩序。', it: 'Gli uomini di Mussolini vogliono l\'ordine. Il loro.' },
        preview: ['法西斯派异议 −−−', '工团派异议 ++', '小队 ++', '事态累积 +'],
        require: function (s) { return s.factions.fascisti.dis > 30; },
        requireText: { zh: '法西斯派尚未闹到需要安抚', it: 'I fascisti non sono ancora in fermento' },
        effect: { factions: { fascisti: { dis: -12 }, sindacalisti: { dis: 8 }, irredentisti: { dis: 4 } },
                  order: { squadre: 10, violence: 6, coup: 3 },
                  diplo: { italy: 4 } } },
      { id: 'irredentisti',
        text: { zh: '向收复主义者让步——把并入意大利重新写进纲领。', it: 'Cedere agli irredentisti: rimettere l\'annessione nel programma.' },
        subtitle: { zh: '朱里亚蒂的人从来没放弃过那个「大意大利」。', it: 'Gli uomini di Giuriati non hanno mai rinunciato alla Grande Italia.' },
        preview: ['收复主义者异议 −−', '法西斯派异议 +', '意大利 +', '工团派异议 +'],
        require: function (s) { return s.factions.irredentisti.dis > 30; },
        requireText: { zh: '收复主义者尚未闹到需要安抚', it: 'Gli irredentisti non sono ancora in fermento' },
        effect: { factions: { irredentisti: { dis: -8 }, fascisti: { dis: 5 }, sindacalisti: { dis: 6 } },
                  diplo: { italy: 8 },
                  relations: [['LEG', 'ANI', 8]],
                  support: [['regnicoli', 'LEG', 3], ['borghesia', 'ANI', 2]] } },
      /* The reference project's @do_nothing. It is not free: the bickering goes
         on without you. */
      { id: 'lasciarli',
        text: { zh: '让他们吵吧。', it: 'Che litighino fra loro.' },
        subtitle: { zh: '自由争辩才是这场运动的精神——哪怕它正在把自己吵散。', it: 'Il libero dibattito è lo spirito del movimento, anche quando lo disfa.' },
        preview: ['全体派系异议 +'],
        effect: { factions: { arditi: { dis: 1 }, sindacalisti: { dis: 1 }, futuristi: { dis: 1 },
                              fascisti: { dis: 1 }, irredentisti: { dis: 1 } } } }
    ]
  };
