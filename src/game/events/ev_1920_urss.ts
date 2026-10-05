import type { GameEvent } from '../content/types';

/* The Regency's recognition by Soviet Russia. Conditional rather than dated: it
   is the payoff of a diplomatic line the player has to build, not a calendar
   entry. Two doors must be open — the Charter has to be promulgated, because
   what Moscow recognises is the Carnaro state and not a band of legionaries,
   and relations have to be high enough that the invitation is worth sending.
   `soviet_contact` guards the other direction: relations can also creep up
   through Hungarian and League channels, and recognition should follow from
   having actually dealt with Moscow.

   Historically the Bolsheviks were the one great power with nothing to lose by
   recognising Fiume: they had no stake in the Treaty of Rapallo, and D'Annunzio's
   anti-Versailles rhetoric was useful to them. Nothing came of it because the
   Regency fell first — which is exactly the window this event lets the player
   use. */
export const evUrssRiconoscimento: GameEvent = {
  id: 'ev_1920_urss',
  title: { zh: '莫斯科的邀请', it: 'L\'invito di Mosca' },
  body: {
    zh: '一名立陶宛水手带来的信没有署名，只有一枚印章：镰刀与锤子。信不长。' +
      '苏维埃政府注意到，阜姆是欧洲唯一一个没有在凡尔赛的账本上签字的国家，' +
      '也是唯一一个把「被压迫民族」写进宪法的国家。它提议互派代表，' +
      '并建议由敖德萨运来一批粮食——帝国南部今年的收成不错，而阜姆的冬天向来很硬。\n\n' +
      '没有人需要假装这是一件纯粹的好事。契切林在信里写得很清楚：莫斯科什么都不承认，' +
      '所以也什么都不必付出。一个被整个欧洲拒绝承认的政府，正在向另一个这样的政府伸出手——' +
      '而伦敦、巴黎和罗马会把这理解为一件事：阜姆已经把自己交给了布尔什维克。',
    it: 'Una lettera senza firma, portata da un marinaio lituano, con un solo sigillo: falce e martello. ' +
      'Il governo sovietico osserva che Fiume è l\'unico Stato d\'Europa che non ha firmato il registro di Versailles, ' +
      'e l\'unico che ha scritto i «popoli oppressi» nella propria Carta. Propone di scambiare rappresentanti, ' +
      'e suggerisce un carico di grano da Odessa: il Sud dell\'impero ha avuto un buon raccolto, e l\'inverno di Fiume è sempre duro.\n\n' +
      'Nessuno deve fingere che sia un bene puro. Čičerin lo scrive senza giri: Mosca non riconosce nulla, ' +
      'quindi non ha nulla da perdere. Un governo che l\'Europa intera rifiuta tende la mano a un altro governo simile — ' +
      'e Londra, Parigi e Roma leggeranno una cosa sola: che Fiume si è consegnata ai bolscevichi.'
  },
  /* Both doors, plus the contact flag. Not `repeatable`: once recognition is
     settled the question does not come back. */
  condition: function (s) {
    return !!s.flags.charter_promulgated
      && !!s.flags.soviet_contact
      && (s.diplo.soviet || 0) > 80;
  },
  options: [
    {
      id: 'accettare',
      text: { zh: '接受。互派代表，让粮食在冬天前到港。', it: 'Accettare. Scambiare rappresentanti e far arrivare il grano prima dell\'inverno.' },
      subtitle: { zh: '一个不承认任何人的国家，承认了我们。', it: 'Uno Stato che non riconosce nessuno ha riconosciuto noi.' },
      preview: [{ zh: '苏联关系 +', label: 'URSS +' }, { zh: '承认 +++', label: 'riconoscimento +++' },
                { zh: '意大利 −−−', label: 'Italia −−−' }, { zh: '英美法 −−', label: 'Intesa −−' },
                { zh: '法西斯派异议 +++', label: 'Fascio +++' }, { zh: '工团派异议 −−−', label: 'Falange −−−' }],
      effect: function () { return {
        diplo: { soviet: 12, italy: -20, uk: -12, france: -12, usa: -8, league: -14 },
        economy: { recognition: 16, capitalConfidence: -12, traffic: 3 },
        order: { fervour: 8, authority: 4, coup: 10 },
        support: [['operai', 'LEG', 4], ['portuali', 'LEG', 4], ['borghesia', 'LEG', -6], ['rentiers', 'LEG', -5]],
        factions: { sindacalisti: { inf: 4, dis: -22 }, fascisti: { inf: 3, dis: 20 }, futuristi: { dis: -8 } },
        flags: { urss_recognised: true }
        }; }
    },
    {
      id: 'rinviare',
      text: { zh: '收下粮食，代表的事推到明年。', it: 'Prendere il grano e rimandare i rappresentanti all\'anno prossimo.' },
      subtitle: { zh: '救这个冬天的命，但不在纸上留下签名。', it: 'Salvare questo inverno senza firmare nulla.' },
      preview: [{ zh: '苏联关系 −', label: 'URSS −' }, { zh: '金库 ++', label: 'cassa ++' },
                { zh: '意大利 −', label: 'Italia −' }, { zh: '资本信心 −', label: 'fiducia −' }],
      effect: function () { return {
        diplo: { soviet: -8, italy: -5, league: -3 },
        economy: { capitalConfidence: -4 },
        order: { fervour: 2 },
        support: [['operai', 'LEG', 2], ['portuali', 'LEG', 2]],
        funds: 120,
        factions: { sindacalisti: { dis: 8 }, fascisti: { dis: 4 } },
        flags: { urss_recognised: true, urss_postponed: true }
        }; }
    },
    {
      id: 'rifiutare',
      text: { zh: '不回信。把这封信烧掉，让伦敦去猜。', it: 'Non rispondere. Bruciare la lettera e lasciare che Londra indovini.' },
      subtitle: { zh: '与莫斯科握手，就等于把阜姆交给罗马的报纸。', it: 'Stringere la mano a Mosca significa consegnare Fiume ai giornali di Roma.' },
      preview: [{ zh: '苏联关系 −−−', label: 'URSS −−−' }, { zh: '英美 +', label: 'Intesa +' },
                { zh: '工团派异议 +++', label: 'Falange +++' }, { zh: '法西斯派异议 −', label: 'Fascio −' }],
      effect: function () { return {
        diplo: { soviet: -26, uk: 6, france: 6, usa: 4, league: 5, italy: 4 },
        economy: { recognition: 4, capitalConfidence: 6 },
        factions: { sindacalisti: { dis: 24, inf: -3 }, futuristi: { dis: 8 }, fascisti: { dis: -8 } },
        flags: { urss_recognised: true, urss_refused: true }
        }; }
    }
  ]
};
