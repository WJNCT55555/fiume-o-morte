import type { Card } from '../content/types';

/* The Baross arbitration over the delta: Belgrade wanted the whole river
     bed, and Fiume's timber trade needed it too. */
export const gvDoganaYu: Card = {
    id: 'gv_dogana_yu', deck: 'governo', ministry: 'economia',
    name: { zh: '与贝尔格莱德的转口协定', it: 'Accordo di transito con Belgrado' },
    cooldown: 6,
        text: { zh: '从贝尔格莱德来了一名中校。条件很清楚：整个河床。',
            it: 'Da Belgrado arriva un tenente colonnello. Le condizioni sono chiare: l\'intero alveo.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.economia === s.playerForce; },
    requireText: { zh: '未掌握公共经济执政官席位', it: 'Ministero dell\'Economia non controllato' },
    options: [
      { id: 'accordo', text: { zh: '接受河床换转口权', it: 'Cedere l\'alveo in cambio del transito' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['腹地 ++', '吞吐 +', '关税法 +2', '民族派异议 ++'],
        effect: { laws: { dogana: 2 },
                  economy: { hinterland: 16, traffic: 7, delta: 4 },
                  diplo: { yugoslavia: 12, italy: -8 },
                  support: [['contadini', 'LEG', 3], ['borghesia', 'LEG', 3], ],
                  factions: { sindacalisti: { inf: 3, dis: -8 }, fascisti: { dis: 12 } } } },
      { id: 'parziale', text: { zh: '只谈木材堆场的使用权', it: 'Solo l\'uso dei depositi di legname' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['腹地 +', '南斯拉夫 +', '意大利 +', '国联 +'],
        effect: { laws: { dogana: 1 },
                  economy: { hinterland: 7, traffic: 3, delta: 1 },
                  diplo: { yugoslavia: 6, italy: 3, league: 3 },
                  support: [['contadini', 'LEG', 2], ['borghesia', 'LEG', 2]] } },
      { id: 'rifiuto', text: { zh: '拒绝。河床是我们的。', it: 'Rifiutare. L\'alveo è nostro' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['热度 ++', '合法性 +', '事态 ++', '腹地 −−'],
        effect: { order: { fervour: 8, coup: 8 },
                  economy: { hinterland: -8, traffic: -3 },
                  diplo: { yugoslavia: -10, italy: 4 },
                  factions: { fascisti: { inf: 2, dis: -10 } } } }
    ]
  };
