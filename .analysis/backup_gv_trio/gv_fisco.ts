import type { Card } from '../content/types';

/* Port dues and transit taxes were the only revenue the Regency could
     actually collect. */
export const gvFisco: Card = {
    id: 'gv_fisco', deck: 'governo', ministry: 'finanze',
    name: { zh: '港口费与转口税', it: 'Tasse portuali e dazio di transito' },
    cooldown: 3,
        text: { zh: '码头工人卸货，通关员盖章。钱在中间蒸发。',
            it: 'I portuali scaricano, i doganieri timbrano. Il denaro evapora nel mezzo.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.finanze === s.playerForce; },
    requireText: { zh: '未掌握财政执政官席位', it: 'Ministero delle Finanze non controllato' },
    options: [
      { id: 'moderato', text: { zh: '小幅上调港口费', it: 'Aumento moderato delle tasse portuali' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['财政法 +1', '月度收入 +12%', '资本信心 −'],
        effect: { laws: { fisco: 1 }, revenueBoost: { porto: 0.12 },
                  economy: { capitalConfidence: -2, traffic: -1 } } },
      { id: 'pesante', text: { zh: '大幅提高，并向货主直接征收', it: 'Aumento forte, riscosso sugli spedizionieri' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['财政法 +2', '月度收入 +26%', '吞吐 −−', '商业派异议 ++'],
        effect: { laws: { fisco: 2 }, revenueBoost: { porto: 0.26, dogana: 0.10 },
                  support: [['borghesia', 'LEG', -5], ['impiegati', 'LEG', 2]],
                  economy: { traffic: -6, capitalConfidence: -9 },
                  factions: { sindacalisti: { dis: -6 } } } },
      { id: 'esenzione', text: { zh: '给转口货物免税，换吞吐量', it: 'Esenzione per il transito, in cambio di volume' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['吞吐 ++', '腹地 +', '月度收入 −'],
        effect: { laws: { dogana: 1 }, revenueBoost: { porto: -0.18 },
                  support: [['borghesia', 'LEG', 4], ['portuali', 'LEG', 3]],
                  economy: { traffic: 9, hinterland: 7, capitalConfidence: 8 } } }
    ]
  };
