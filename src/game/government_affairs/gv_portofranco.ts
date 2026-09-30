import type { Card } from '../content/types';

/* Free-port status was Fiume's only structural economic asset. */
export const gvPortofranco: Card = {
    id: 'gv_portofranco', deck: 'governo', ministry: 'economia',
    name: { zh: '自由港法令', it: 'Decreto del porto franco' },
    subtitle: { zh: '1719 年的那张纸还在档案馆里。', it: 'La carta del 1719 e ancora in archivio.' },
    cooldown: 6,
        text: { zh: '1719 年的那份特许状还在档案馆里。可以把它重新拿出来。',
            it: 'La patente del 1719 è ancora in archivio. Si può tirare fuori.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.economia === s.playerForce; },
    requireText: { zh: '未掌握公共经济执政官席位', it: 'Ministero dell\'Economia non controllato' },
    options: [
      { id: 'decreto', text: { zh: '按 1719 年的原文恢复', it: 'Restaurare il testo del 1719' },
        preview: ['自由港 +1', '吞吐 ++', '腹地 +', '意大利 −', '港口日志'],
        effect: { laws: { portofranco: 1 }, journals: ['porto'],
                  economy: { traffic: 6, hinterland: 6, works: 4, capitalConfidence: 8 },
                  support: [['borghesia', 'LEG', 4], ['portuali', 'LEG', 2]],
                  diplo: { italy: -4, yugoslavia: -3 } } },
      { id: 'limitato', text: { zh: '只给关税暂缓区，不给完整特权', it: 'Solo un deposito franco' },
        preview: ['自由港 +1', '意大利 +', '国联 +', '工团派异议 +'],
        effect: { laws: { portofranco: 1 }, diplo: { italy: 6, league: 4 },
                  economy: { traffic: 3, capitalConfidence: 4 },
                  support: [['borghesia', 'LEG', 2]],
                  factions: { sindacalisti: { dis: 8 } } } },
      { id: 'rinvio', text: { zh: '先把港口收归公营再说', it: 'Prima il porto pubblico, poi lo statuto' },
        preview: ['工人 ++', '劳动法 +', '资本信心 −−', '吞吐 −'],
        effect: { laws: { lavoro: 1 },
                  support: [['portuali', 'LEG', 5], ['operai', 'LEG', 4]],
                  economy: { capitalConfidence: -10, traffic: -4, works: 6 },
                  factions: { sindacalisti: { inf: 3, dis: -12 } } } }
    ]
  };
