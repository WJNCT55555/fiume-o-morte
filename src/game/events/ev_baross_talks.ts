import type { GameEvent } from '../content/types';


export const evBarossTalks: GameEvent = {
    id: 'ev_baross_talks', repeatable: true, cooldown: 6,
    condition: function (s) { return s.economy.delta < 45 && s.monthIndex >= 2 && s.diplo.yugoslavia > 18; },
    title: { zh: '三角洲的谈判', it: 'Il negoziato sul Delta' },
    body: { zh: '贝尔格莱德派了一个中校来。条件很清楚：埃内奥河的整个河床与三角洲、波尔托巴罗斯的新港池归南斯拉夫；作为交换，苏沙克的铁路给阜姆用，木材和粮食的转口走阜姆的码头。\n\n' +
        '"你们要的是货，我们要的是岸。"他说。"这两件事不必冲突。"',
      it: 'Da Belgrado arriva un tenente colonnello. Le condizioni sono chiare: l\'intero alveo dell\'Eneo, il Delta e il nuovo bacino di Porto Baross alla Jugoslavia. In cambio, la ferrovia di Sussak a disposizione di Fiume, e il transito di legname e grano dai moli fiumani.\n\n' +
        '"Voi volete le merci, noi la riva," dice. "Le due cose non devono contraddirsi."' },
    options: [
      {
        id: 'a', text: { zh: '接受。用岸边换货物。', it: 'Accettare: la riva in cambio delle merci.' },
        preview: [{ zh: '腹地 ++', label: 'entroterra ++' }, { zh: '三角洲 −', label: 'Delta −' }, { zh: '南斯拉夫 ++', label: 'Jugoslavia ++' }, { zh: '法西斯 ++', label: 'Fascio ++' }],
        effect: function () { return { economy: { hinterland: 20, delta: -15, traffic: 6 }, diplo: { yugoslavia: 15, italy: -8 }, support: [['contadini', 'LEG', 5], ['portuali', 'LEG', 3], ], order: { squadre: 8, fervour: 4 }, factions: { arditi: { dis: 10 }, fascisti: { dis: 12 } }, flags: { baross_deal: true } }; }
      },
      {
        id: 'b', text: { zh: '拒绝。三角洲是阜姆的，字面意义上的。', it: 'Rifiutare. Il Delta è di Fiume, letteralmente.' },
        preview: [{ zh: '南斯拉夫 −', label: 'Jugoslavia −' }, { zh: '民族阵营士气 +', label: 'Fascio −' }, { zh: '港口复兴受阻', label: 'ripresa −' }],
        effect: function () { return { diplo: { yugoslavia: -10, italy: 4 }, order: { fervour: 3 }, economy: { hinterland: -3 }, factions: { arditi: { dis: -5 } } }; }
      },
      {
        id: 'c', text: { zh: '提交国联仲裁。', it: 'Rimettersi all\'arbitrato della Società delle Nazioni.' },
        preview: [{ zh: '国联 +', label: 'SDN +' }, { zh: '双方 −', label: 'entrambi −' }, { zh: '延迟', label: 'rinvio' }],
        effect: function () { return { diplo: { league: 10, italy: -4, yugoslavia: -4 }, economy: { recognition: 5 }, flags: { baross_arbitration: true } }; }
      }
    ]
  };
