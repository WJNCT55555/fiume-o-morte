import type { Card } from '../content/types';

/* Amnesty was how a revolutionary government admitted it needed the people
     it had locked up. */
export const gvAmnistia: Card = {
    id: 'gv_amnistia', deck: 'governo', ministry: 'interno',
    name: { zh: '大赦令', it: 'Decreto di amnistia' },
    cooldown: 6,
        text: { zh: '监狱里关着自治派、社会党人，以及三个偷了军团兵步枪的人。',
            it: 'In carcere ci sono autonomi, socialisti e tre che hanno rubato un fucile ai legionari.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.interno === s.playerForce; },
    requireText: { zh: '未掌握内政与司法执政官席位', it: 'Ministero dell\'Interno non controllato' },
    options: [
      { id: 'generale', text: { zh: '全部释放，包括政治犯', it: 'Amnistia piena, compresi i politici' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['暴力 −−', '事态 −', '合法性 +', '阿迪蒂异议 ++'],
        effect: { order: { violence: -12, coup: -10, squadre: -6, fervour: -4 },
                  support: [['portuali', 'LEG', 3]],
                  factions: { arditi: { dis: 10 }, fascisti: { dis: 8 } } } },
      { id: 'politici', text: { zh: '只放政治犯，刑事犯照旧', it: 'Solo i politici; i comuni restano dentro' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['合法性 ++', '英法美 +', '暴力 −'],
        effect: { order: { violence: -6, coup: -6 },
                  diplo: { uk: 4, france: 3, league: 4 },
                  support: [['impiegati', 'LEG', 3], ],
                  factions: { arditi: { dis: 4 } } } },
      { id: 'nessuna', text: { zh: '不赦。乱世用重典。', it: 'Nessuna amnistia. Tempi duri, leggi dure' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['领袖权威 ++', '暴力 +', '合法性 −', '工团派异议 ++'],
        effect: { order: { authority: 6, violence: 5, coup: 4 },
                  factions: { arditi: { dis: -8 }, sindacalisti: { dis: 12 } } } }
    ]
  };
