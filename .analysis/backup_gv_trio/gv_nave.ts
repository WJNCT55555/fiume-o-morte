import type { Card } from '../content/types';

/* The Regency had no navy. It had a few boats and a lot of nerve. */
export const gvNave: Card = {
    id: 'gv_nave', deck: 'governo', ministry: 'difesa',
    name: { zh: '征用阜姆舰艇', it: 'Requisire le navi di Fiume' },
    cooldown: 4,
        text: { zh: '港里停着几艘船。名义上它们属于一家公司。',
            it: 'In porto ci sono alcune navi. Nominalmente appartengono a una società.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.difesa === s.playerForce; },
    requireText: { zh: '未掌握国防执政官席位', it: 'Ministero della Difesa non controllato' },
    options: [
      { id: 'requisire', text: { zh: '以国防名义征用', it: 'Requisire in nome della difesa' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['军团兵 ++', '领袖权威 +', '意大利 −−'],
        effect: { order: { authority: 4, fervour: 5, milizia: 140 }, economy: { traffic: -2 },
                  support: [['portuali', 'LEG', 2]],
                  diplo: { italy: -8, yugoslavia: -4, league: -3 } } },
      { id: 'noleggio', text: { zh: '向船东租用，付市场价', it: 'Noleggiare dagli armatori a prezzo di mercato' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['金库 −−', '商业派 +', '合法性 +', '意大利 −'],
        effect: { funds: -280, order: { milizia: 100, authority: 2 },
                  support: [['borghesia', 'LEG', 4]],
                  economy: { capitalConfidence: 5 }, diplo: { italy: -4 } } },
      { id: 'affondare', text: { zh: '把不能用的凿沉在航道里', it: 'Autoaffondare le inutilizzabili nel canale' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['航道封锁', '吞吐 −−−', '意大利 −', '事态 +'],
        effect: { economy: { traffic: -9, hinterland: -4 }, order: { authority: 5, coup: 6 },
                  diplo: { italy: -10, yugoslavia: -6 },
                  districts: { porto: { control: 6, agitation: 6 } } } }
    ]
  };
